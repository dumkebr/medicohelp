import { 
  type Patient, 
  type InsertPatient, 
  patients, 
  users, 
  type User, 
  type InsertUser,
  userSettings,
  type UserSettings,
  type InsertUserSettings,
  type UserWithSettings,
  consultations, 
  type Consultation, 
  type InsertConsultation 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations - Email/Password Auth
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // OAuth operations
  getUserByOAuth(provider: string, sub: string): Promise<User | undefined>;
  linkOAuthProvider(userId: string, provider: string, sub: string): Promise<User | undefined>;
  getLinkedProviders(userId: string): Promise<string[]>;
  
  // User settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, defaultStyle: "tradicional" | "soap"): Promise<UserSettings | undefined>;
  getUserWithSettings(userId: string): Promise<UserWithSettings | undefined>;
  
  // Pacientes
  getPatient(id: string): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;
  
  // Consultas
  getConsultation(id: string): Promise<Consultation | undefined>;
  getConsultationsByPatient(patientId: string): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  deleteConsultation(id: string): Promise<boolean>;
  
  // Quota tracking
  getQuotaUsed(userId: string): Promise<number>;
  incrementQuota(userId: string): Promise<void>;
  resetQuota(userId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // User operations - Email/Password Auth
  async getUserById(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .returning();
    
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }

  // OAuth operations
  async getUserByOAuth(provider: string, sub: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(and(
        eq(users.oauthProvider, provider),
        eq(users.oauthSub, sub)
      ))
      .limit(1);
    
    return result[0];
  }

  async linkOAuthProvider(userId: string, provider: string, sub: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ 
        oauthProvider: provider, 
        oauthSub: sub 
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  async getLinkedProviders(userId: string): Promise<string[]> {
    const user = await this.getUserById(userId);
    if (!user || !user.oauthProvider) {
      return [];
    }
    
    return [user.oauthProvider];
  }

  // User settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const result = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    
    return result[0];
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const result = await db
      .insert(userSettings)
      .values(settings)
      .returning();
    
    return result[0];
  }

  async updateUserSettings(userId: string, defaultStyle: "tradicional" | "soap"): Promise<UserSettings | undefined> {
    const result = await db
      .update(userSettings)
      .set({ defaultStyle })
      .where(eq(userSettings.userId, userId))
      .returning();
    
    return result[0];
  }

  async getUserWithSettings(userId: string): Promise<UserWithSettings | undefined> {
    const user = await this.getUserById(userId);
    if (!user) return undefined;

    const settings = await this.getUserSettings(userId);
    if (!settings) return undefined;

    return {
      ...user,
      defaultStyle: settings.defaultStyle,
    };
  }

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

  // Consultas usando PostgreSQL
  async getConsultation(id: string): Promise<Consultation | undefined> {
    const result = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, id))
      .limit(1);
    
    return result[0];
  }

  async getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.createdAt));
  }

  async createConsultation(insertConsultation: InsertConsultation): Promise<Consultation> {
    const result = await db
      .insert(consultations)
      .values(insertConsultation)
      .returning();
    
    return result[0];
  }

  async deleteConsultation(id: string): Promise<boolean> {
    const result = await db
      .delete(consultations)
      .where(eq(consultations.id, id))
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
