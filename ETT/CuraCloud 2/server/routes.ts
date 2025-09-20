import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertUserSchema, insertRecordSchema, insertAccessSchema, insertNoteSchema } from "@shared/schema";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: fileStorage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

declare module 'express-session' {
  interface SessionData {
    user?: {
      _id: string;
      email: string;
      role: string;
      name: string;
      verified: boolean;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'curacloud-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Middleware to check role
  const requireRole = (roles: string[]) => (req: Request, res: Response, next: Function) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };

  // Auth routes
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Auto-verify admin users, others need manual verification
      userData.verified = userData.role === 'admin';

      const user = await storage.createUser(userData);
      res.status(201).json({ message: 'User registered successfully', userId: user._id });
    } catch (error) {
      res.status(400).json({ message: 'Registration failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password || user.role !== role) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.verified) {
        return res.status(401).json({ message: 'Account pending verification' });
      }

      req.session.user = {
        _id: user._id!,
        email: user.email,
        role: user.role,
        name: user.name,
        verified: user.verified
      };

      res.json({ message: 'Login successful', user: req.session.user });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/me', requireAuth, (req: Request, res: Response) => {
    res.json({ user: req.session.user });
  });

  // Test-friendly route for creating records without file upload (for testing purposes)
  app.post('/api/records', requireAuth, requireRole(['patient']), async (req: Request, res: Response) => {
    try {
      const recordData = insertRecordSchema.parse({
        ...req.body,
        patientId: req.session.user!._id,
      });

      const record = await storage.createRecord(recordData);
      res.json({ message: 'Record created successfully', record });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create record', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // File upload route
  app.post('/api/upload', requireAuth, requireRole(['patient']), upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { description } = req.body;
      
      const recordData = insertRecordSchema.parse({
        patientId: req.session.user!._id,
        filename: req.file.originalname,
        filePath: req.file.path,
        description: description || '',
        fileType: req.file.mimetype,
        fileSize: req.file.size
      });

      const record = await storage.createRecord(recordData);
      res.json({ message: 'File uploaded successfully', record });
    } catch (error) {
      res.status(500).json({ message: 'Upload failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Access management routes
  app.post('/api/grant-access', requireAuth, requireRole(['patient']), async (req: Request, res: Response) => {
    try {
      const { doctorEmail } = req.body;
      
      const doctor = await storage.getUserByEmail(doctorEmail);
      if (!doctor || doctor.role !== 'doctor' || !doctor.verified) {
        return res.status(400).json({ message: 'Doctor not found or not verified' });
      }

      const accessData = insertAccessSchema.parse({
        patientId: req.session.user!._id,
        doctorId: doctor._id!,
        granted: true
      });

      const access = await storage.grantAccess(accessData);
      res.json({ message: 'Access granted successfully', access });
    } catch (error) {
      res.status(500).json({ message: 'Failed to grant access', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/revoke-access', requireAuth, requireRole(['patient']), async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.body;
      
      await storage.revokeAccess(req.session.user!._id, doctorId);
      res.json({ message: 'Access revoked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to revoke access', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Patient records routes
  app.get('/api/records', requireAuth, async (req: Request, res: Response) => {
    try {
      let records;
      if (req.session.user!.role === 'patient') {
        records = await storage.getRecordsByPatient(req.session.user!._id);
      } else if (req.session.user!.role === 'admin') {
        records = await storage.getAllRecords();
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json({ records });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch records', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/records/:patientId', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      
      // Check if doctor has access to patient records
      const hasAccess = await storage.checkAccess(patientId, req.session.user!._id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to patient records' });
      }

      const records = await storage.getRecordsByPatient(patientId);
      res.json({ records });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch patient records', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Treatment notes routes
  app.post('/api/notes', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
    try {
      const noteData = insertNoteSchema.parse({
        ...req.body,
        doctorId: req.session.user!._id
      });

      // Check if doctor has access to patient
      const hasAccess = await storage.checkAccess(noteData.patientId, req.session.user!._id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to patient records' });
      }

      const note = await storage.createNote(noteData);
      res.json({ message: 'Note added successfully', note });
    } catch (error) {
      res.status(500).json({ message: 'Failed to add note', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin routes
  app.get('/api/pending-verifications', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const users = await storage.getPendingVerifications();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch pending verifications', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/verify-user', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { userId, verified } = req.body;
      
      await storage.updateUserVerification(userId, verified);
      res.json({ message: `User ${verified ? 'verified' : 'rejected'} successfully` });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user verification', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/users', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Doctor access routes
  app.get('/api/doctor-patients', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
    try {
      const accessList = await storage.getDoctorAccess(req.session.user!._id);
      const patientPromises = accessList.map(access => storage.getUser(access.patientId));
      const patients = await Promise.all(patientPromises);
      
      res.json({ patients: patients.filter(p => p !== undefined) });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch authorized patients', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Patient access management
  app.get('/api/patient-access', requireAuth, requireRole(['patient']), async (req: Request, res: Response) => {
    try {
      const accessList = await storage.getPatientAccess(req.session.user!._id);
      const doctorPromises = accessList.map(access => storage.getUser(access.doctorId));
      const doctors = await Promise.all(doctorPromises);
      
      res.json({ doctors: doctors.filter(d => d !== undefined), access: accessList });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch patient access', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
