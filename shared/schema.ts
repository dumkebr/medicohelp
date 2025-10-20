import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
