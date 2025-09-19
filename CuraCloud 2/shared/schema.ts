import { z } from "zod";

// User schema for MongoDB
export const userSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['patient', 'doctor', 'admin']),
  verified: z.boolean().default(false),
  specialty: z.string().optional(), // For doctors
  createdAt: z.date().optional(),
});

export const insertUserSchema = userSchema.omit({ _id: true, createdAt: true });

// Medical record schema
export const recordSchema = z.object({
  _id: z.string().optional(),
  patientId: z.string(),
  filename: z.string(),
  filePath: z.string(),
  description: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  uploadDate: z.date().optional(),
});

export const insertRecordSchema = recordSchema.omit({ _id: true, uploadDate: true });

// Access control schema
export const accessSchema = z.object({
  _id: z.string().optional(),
  patientId: z.string(),
  doctorId: z.string(),
  granted: z.boolean().default(true),
  grantedAt: z.date().optional(),
});

export const insertAccessSchema = accessSchema.omit({ _id: true, grantedAt: true });

// Treatment notes schema
export const noteSchema = z.object({
  _id: z.string().optional(),
  doctorId: z.string(),
  patientId: z.string(),
  consultationType: z.string(),
  content: z.string(),
  diagnosis: z.string().optional(),
  nextAppointment: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertNoteSchema = noteSchema.omit({ _id: true, createdAt: true });

// Type exports
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Record = z.infer<typeof recordSchema>;
export type InsertRecord = z.infer<typeof insertRecordSchema>;
export type Access = z.infer<typeof accessSchema>;
export type InsertAccess = z.infer<typeof insertAccessSchema>;
export type Note = z.infer<typeof noteSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;
