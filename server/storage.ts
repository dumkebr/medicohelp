import { type Patient, type InsertPatient, patients } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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

export class DbStorage implements IStorage {
  // Pacientes usando PostgreSQL
  async getPatient(id: string): Promise<Patient | undefined> {
    const result = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1);
    
    return result[0];
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db
      .select()
      .from(patients)
      .orderBy(desc(patients.createdAt));
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const result = await db
      .insert(patients)
      .values(insertPatient)
      .returning();
    
    return result[0];
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    const result = await db
      .update(patients)
      .set(updates)
      .where(eq(patients.id, id))
      .returning();
    
    return result[0];
  }

  async deletePatient(id: string): Promise<boolean> {
    const result = await db
      .delete(patients)
      .where(eq(patients.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Quota tracking ainda em memória (por enquanto)
  private quotas: Map<string, { count: number; date: string }> = new Map();

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

export const storage = new DbStorage();
