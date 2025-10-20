import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, index, jsonb, char } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== AUTHENTICATION TABLES =====

// Session storage table (legacy - pode ser removida se não usar Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Email/Password Auth com JWT
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().$type<"medico" | "estudante">(),
  crm: text("crm"),
  uf: char("uf", { length: 2 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Email inválido"),
  role: z.enum(["medico", "estudante"]),
  uf: z.string().length(2).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User settings table
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  defaultStyle: text("default_style").notNull().default("tradicional").$type<"tradicional" | "soap">(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings, {
  defaultStyle: z.enum(["tradicional", "soap"]),
}).omit({
  id: true,
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// Auth request/response schemas
export const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["medico", "estudante"]),
  crm: z.string().optional(),
  uf: z.string().length(2, "UF deve ter 2 caracteres").optional(),
}).refine((data) => {
  if (data.role === "medico") {
    return !!data.crm && !!data.uf;
  }
  return true;
}, {
  message: "CRM e UF são obrigatórios para médicos",
  path: ["crm"],
}).refine((data) => {
  if (data.role === "estudante") {
    return !data.crm && !data.uf;
  }
  return true;
}, {
  message: "Estudantes não devem ter CRM ou UF",
  path: ["crm"],
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  defaultStyle: z.enum(["tradicional", "soap"]).optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "medico" | "estudante";
    crm?: string;
    uf?: string;
    avatarUrl?: string;
  };
}

export interface UserWithSettings extends User {
  defaultStyle: "tradicional" | "soap";
}

// ===== APPLICATION TABLES =====

// Pacientes
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  cpf: text("cpf").default(""),
  dataNascimento: text("data_nascimento").default(""),
  telefone: text("telefone").default(""),
  endereco: text("endereco").default(""),
  observacoes: text("observacoes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Consultas (histórico de atendimentos)
export const consultations = pgTable("consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  userId: varchar("user_id"), // ID do médico que fez a consulta (opcional)
  complaint: text("complaint").notNull(), // Queixa principal / primeira mensagem
  history: jsonb("history").notNull(), // Array de mensagens do chat
  attachments: jsonb("attachments"), // Array de anexos (imagens, PDFs)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
});

export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;

// Mensagens de Chat
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatHistory {
  user: string;
  assistant: string;
}

// Upload de arquivos
export interface FileAttachment {
  filename: string;
  url: string;
  type: string;
}

// Requisição de chat
export const chatRequestSchema = z.object({
  message: z.string().min(1, "Mensagem não pode estar vazia"),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  userRole: z.enum(['doctor', 'patient']).optional().default('doctor'),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// Resposta de chat
export interface ChatResponse {
  answer: string;
  remaining?: number;
}

// Resposta de upload
export interface UploadResponse {
  attachments: FileAttachment[];
  remaining?: number;
}

// Controle de quota
export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
}
