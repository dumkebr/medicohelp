import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, index, jsonb, char, unique, boolean } from "drizzle-orm/pg-core";
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

// User storage table - Email/Password Auth com JWT + OAuth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().$type<"medico" | "estudante">(),
  crm: text("crm"),
  uf: char("uf", { length: 2 }),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  oauthProvider: text("oauth_provider"),
  oauthSub: text("oauth_sub"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("unique_oauth_provider_sub").on(table.oauthProvider, table.oauthSub),
]);

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
  defaultStyle: text("default_style").notNull().default("tradicional").$type<"tradicional" | "soap" | "personalizado">(),
  customTemplate: text("custom_template"),
  explanatoryModeEnabled: boolean("explanatory_mode_enabled").default(false).notNull(),
  showPediatria: boolean("show_pediatria").default(true).notNull(),
  showGestante: boolean("show_gestante").default(true).notNull(),
  showEmergencia: boolean("show_emergencia").default(true).notNull(),
  historyRetentionMax: integer("history_retention_max").default(100).notNull(),
  historyRetentionDays: integer("history_retention_days").default(30).notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings, {
  defaultStyle: z.enum(["tradicional", "soap", "personalizado"]),
}).omit({
  id: true,
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// Chat history table (persistência de pesquisas)
export const chatHistoryItems = pgTable("chat_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  prompt: text("prompt").notNull(),
  response: text("response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  pinned: boolean("pinned").default(false).notNull(),
}, (table) => [
  index("idx_chat_history_user_created").on(table.userId, table.createdAt),
]);

export const insertChatHistoryItemSchema = createInsertSchema(chatHistoryItems).omit({
  id: true,
  createdAt: true,
});

export type InsertChatHistoryItem = z.infer<typeof insertChatHistoryItemSchema>;
export type ChatHistoryItem = typeof chatHistoryItems.$inferSelect;

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
  showPediatria: z.boolean().optional(),
  showGestante: z.boolean().optional(),
  showEmergencia: z.boolean().optional(),
  historyRetentionMax: z.number().int().min(1).max(500).optional(),
  historyRetentionDays: z.number().int().min(1).max(365).optional(),
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
  showPediatria: boolean;
  showGestante: boolean;
  showEmergencia: boolean;
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

// Notifications Waitlist (Em breve modules)
export const notificationsWaitlist = pgTable("notifications_waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feature: text("feature").notNull(), // "pediatria", "gestante", "emergencia"
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("unique_feature_email").on(table.feature, table.email),
  index("idx_notifications_waitlist_feature").on(table.feature),
]);

export const insertNotificationsWaitlistSchema = createInsertSchema(notificationsWaitlist, {
  feature: z.string().min(1),
  email: z.string().email("Email inválido"),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertNotificationsWaitlist = z.infer<typeof insertNotificationsWaitlistSchema>;
export type NotificationsWaitlist = typeof notificationsWaitlist.$inferSelect;

// Verification Codes (Email + SMS)
export const verificationCodes = pgTable("verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Opcional - pode ser null se estiver criando novo usuário
  channel: text("channel").notNull().$type<"email" | "sms">(),
  purpose: text("purpose").notNull().$type<"signup" | "reset">(),
  codeHash: text("code_hash").notNull(), // Hash bcrypt do código
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  consumed: boolean("consumed").default(false).notNull(),
  emailOrPhone: text("email_or_phone").notNull(), // Email ou telefone para quem foi enviado
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_verification_codes_email_or_phone").on(table.emailOrPhone),
  index("idx_verification_codes_expires_at").on(table.expiresAt),
]);

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes, {
  channel: z.enum(["email", "sms"]),
  purpose: z.enum(["signup", "reset"]),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
export type VerificationCode = typeof verificationCodes.$inferSelect;

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

// ===== VERIFICATION CODE SCHEMAS =====

export const requestCodeSchema = z.object({
  purpose: z.enum(["signup", "reset"]),
  channel: z.enum(["email", "sms"]),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
}).refine((data) => {
  if (data.channel === "email") {
    return !!data.email;
  }
  if (data.channel === "sms") {
    return !!data.phone;
  }
  return false;
}, {
  message: "Email é obrigatório para channel='email' e phone é obrigatório para channel='sms'",
  path: ["email"],
});

export const verifyCodeSchema = z.object({
  purpose: z.enum(["signup", "reset"]),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  code: z.string().length(6, "Código deve ter 6 dígitos"),
}).refine((data) => {
  return !!data.email || !!data.phone;
}, {
  message: "Email ou phone é obrigatório",
  path: ["email"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  channel: z.enum(["email", "sms"]).optional(),
}).refine((data) => {
  return !!data.email || !!data.phone;
}, {
  message: "Email ou phone é obrigatório",
  path: ["email"],
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export type RequestCodeRequest = z.infer<typeof requestCodeSchema>;
export type VerifyCodeRequest = z.infer<typeof verifyCodeSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

// ===== CLINICAL EVIDENCE / RESEARCH SCHEMAS =====

// Analytics table for clinical evidence feature usage (optional)
export const researchAnalytics = pgTable("research_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  provider: text("provider").notNull(), // "pubmed", "perplexity", etc.
  resultsCount: integer("results_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_research_analytics_user_id").on(table.userId),
  index("idx_research_analytics_created_at").on(table.createdAt),
]);

export const insertResearchAnalyticsSchema = createInsertSchema(researchAnalytics).omit({
  id: true,
  createdAt: true,
});

export type InsertResearchAnalytics = z.infer<typeof insertResearchAnalyticsSchema>;
export type ResearchAnalytics = typeof researchAnalytics.$inferSelect;

// Scientific reference interface
export interface ScientificReference {
  title: string;
  url: string;
  source?: string; // "PubMed", "Ministério da Saúde", etc.
  authors?: string;
  year?: string;
}

// Research request schema
export const researchRequestSchema = z.object({
  query: z.string().min(1, "Query não pode estar vazia"),
  maxSources: z.number().min(1).max(10).optional().default(5),
});

export type ResearchRequest = z.infer<typeof researchRequestSchema>;

// Research response interface
export interface ResearchResponse {
  answer: string;
  references: ScientificReference[];
}
