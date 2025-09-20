import { MongoClient, Db, ObjectId } from 'mongodb';
import { type User, type InsertUser, type Record, type InsertRecord, type Access, type InsertAccess, type Note, type InsertNote } from "@shared/schema";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mati_2006:Maitri%4009@cluster0.wpsahhs.mongodb.net/curacloud";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVerification(id: string, verified: boolean): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getPendingVerifications(): Promise<User[]>;
  
  // Record methods
  createRecord(record: InsertRecord): Promise<Record>;
  getRecordsByPatient(patientId: string): Promise<Record[]>;
  getAllRecords(): Promise<Record[]>;
  
  // Access methods
  grantAccess(access: InsertAccess): Promise<Access>;
  revokeAccess(patientId: string, doctorId: string): Promise<void>;
  getPatientAccess(patientId: string): Promise<Access[]>;
  getDoctorAccess(doctorId: string): Promise<Access[]>;
  checkAccess(patientId: string, doctorId: string): Promise<boolean>;
  
  // Note methods
  createNote(note: InsertNote): Promise<Note>;
  getNotesByPatient(patientId: string): Promise<Note[]>;
  getNotesByDoctor(doctorId: string): Promise<Note[]>;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db | null = null;

  constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }

  private async connect(): Promise<Db> {
    if (!this.db) {
      await this.client.connect();
      this.db = this.client.db('curacloud');
    }
    return this.db;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const db = await this.connect();
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    return user ? { ...user, _id: user._id.toString() } as User : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.connect();
    const user = await db.collection('users').findOne({ email });
    return user ? { ...user, _id: user._id.toString() } as User : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const db = await this.connect();
    const result = await db.collection('users').insertOne({
      ...user,
      createdAt: new Date()
    });
    return { ...user, _id: result.insertedId.toString(), createdAt: new Date() };
  }

  async updateUserVerification(id: string, verified: boolean): Promise<void> {
    const db = await this.connect();
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { verified } }
    );
  }

  async getAllUsers(): Promise<User[]> {
    const db = await this.connect();
    const users = await db.collection('users').find({}).toArray();
    return users.map(user => ({ ...user, _id: user._id.toString() } as User));
  }

  async getPendingVerifications(): Promise<User[]> {
    const db = await this.connect();
    const users = await db.collection('users').find({ 
      verified: false,
      role: { $in: ['doctor', 'patient'] }
    }).toArray();
    return users.map(user => ({ ...user, _id: user._id.toString() } as User));
  }

  // Record methods
  async createRecord(record: InsertRecord): Promise<Record> {
    const db = await this.connect();
    const result = await db.collection('records').insertOne({
      ...record,
      uploadDate: new Date()
    });
    return { ...record, _id: result.insertedId.toString(), uploadDate: new Date() };
  }

  async getRecordsByPatient(patientId: string): Promise<Record[]> {
    const db = await this.connect();
    const records = await db.collection('records').find({ patientId }).sort({ uploadDate: -1 }).toArray();
    return records.map(record => ({ ...record, _id: record._id.toString() } as Record));
  }

  async getAllRecords(): Promise<Record[]> {
    const db = await this.connect();
    const records = await db.collection('records').find({}).toArray();
    return records.map(record => ({ ...record, _id: record._id.toString() } as Record));
  }

  // Access methods
  async grantAccess(access: InsertAccess): Promise<Access> {
    const db = await this.connect();
    // Remove existing access record if any
    await db.collection('access').deleteOne({
      patientId: access.patientId,
      doctorId: access.doctorId
    });
    
    const result = await db.collection('access').insertOne({
      ...access,
      grantedAt: new Date()
    });
    return { ...access, _id: result.insertedId.toString(), grantedAt: new Date() };
  }

  async revokeAccess(patientId: string, doctorId: string): Promise<void> {
    const db = await this.connect();
    await db.collection('access').deleteOne({ patientId, doctorId });
  }

  async getPatientAccess(patientId: string): Promise<Access[]> {
    const db = await this.connect();
    const access = await db.collection('access').find({ patientId, granted: true }).toArray();
    return access.map(a => ({ ...a, _id: a._id.toString() } as Access));
  }

  async getDoctorAccess(doctorId: string): Promise<Access[]> {
    const db = await this.connect();
    const access = await db.collection('access').find({ doctorId, granted: true }).toArray();
    return access.map(a => ({ ...a, _id: a._id.toString() } as Access));
  }

  async checkAccess(patientId: string, doctorId: string): Promise<boolean> {
    const db = await this.connect();
    const access = await db.collection('access').findOne({ patientId, doctorId, granted: true });
    return !!access;
  }

  // Note methods
  async createNote(note: InsertNote): Promise<Note> {
    const db = await this.connect();
    const result = await db.collection('notes').insertOne({
      ...note,
      createdAt: new Date()
    });
    return { ...note, _id: result.insertedId.toString(), createdAt: new Date() };
  }

  async getNotesByPatient(patientId: string): Promise<Note[]> {
    const db = await this.connect();
    const notes = await db.collection('notes').find({ patientId }).sort({ createdAt: -1 }).toArray();
    return notes.map(note => ({ ...note, _id: note._id.toString() } as Note));
  }

  async getNotesByDoctor(doctorId: string): Promise<Note[]> {
    const db = await this.connect();
    const notes = await db.collection('notes').find({ doctorId }).sort({ createdAt: -1 }).toArray();
    return notes.map(note => ({ ...note, _id: note._id.toString() } as Note));
  }
}

export const storage = new MongoStorage();
