import { type Patient, type InsertPatient } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Pacientes
  getPatient(id: string): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;
  
  // Quota tracking
  getQuotaUsed(userId: string): Promise<number>;
  incrementQuota(userId: string): Promise<void>;
  resetQuota(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private patients: Map<string, Patient>;
  private quotas: Map<string, { count: number; date: string }>;

  constructor() {
    this.patients = new Map();
    this.quotas = new Map();
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = {
      ...insertPatient,
      id,
      createdAt: new Date(),
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existing = this.patients.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updated: Patient = {
      ...existing,
      ...updates,
    };
    
    this.patients.set(id, updated);
    return updated;
  }

  async deletePatient(id: string): Promise<boolean> {
    return this.patients.delete(id);
  }

  async getQuotaUsed(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const quota = this.quotas.get(userId);
    
    if (!quota || quota.date !== today) {
      return 0;
    }
    
    return quota.count;
  }

  async incrementQuota(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const quota = this.quotas.get(userId);
    
    if (!quota || quota.date !== today) {
      this.quotas.set(userId, { count: 1, date: today });
    } else {
      quota.count++;
    }
  }

  async resetQuota(userId: string): Promise<void> {
    this.quotas.delete(userId);
  }
}

export const storage = new MemStorage();
