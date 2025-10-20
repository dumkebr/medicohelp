import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { chatRequestSchema, insertPatientSchema, insertConsultationSchema } from "@shared/schema";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Referência ao blueprint javascript_openai para integração OpenAI
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuração do multer para upload de arquivos
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
    files: 10, // máximo 10 arquivos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado. Use JPEG, PNG ou PDF."));
    }
  },
});

// Middleware para verificar quota
const DAILY_LIMIT = 50;

async function checkQuota(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const used = await storage.getQuotaUsed(userId);
  const remaining = Math.max(0, DAILY_LIMIT - used);
  return {
    allowed: used < DAILY_LIMIT,
    remaining,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== SETUP: Replit Auth =====
  // (IMPORTANT) Auth middleware from blueprint:javascript_log_in_with_replit
  await setupAuth(app);

  // ===== ENDPOINT: Get authenticated user =====
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Criar diretório de uploads se não existir
  try {
    await fs.mkdir("uploads", { recursive: true });
  } catch (error) {
    console.error("Erro ao criar diretório uploads:", error);
  }

  // ===== ENDPOINT: Chat Médico =====
  app.post("/api/chat", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string || "demo-doctor";
      
      // Verificar quota
      const quota = await checkQuota(userId);
      if (!quota.allowed) {
        return res.status(429).json({
          error: "Limite diário de consultas atingido. Tente novamente amanhã.",
          remaining: 0,
        });
      }

      // Validar requisição
      const validatedData = chatRequestSchema.parse(req.body);
      const { message, history = [], userRole = "doctor" } = validatedData;

      // Construir mensagens para OpenAI
      const systemPrompt = userRole === "doctor"
        ? `Você é um assistente médico especializado. Forneça informações clínicas precisas, baseadas em evidências médicas e guidelines atualizados. 
           
           IMPORTANTE:
           - Sempre mencione quando uma avaliação presencial é necessária
           - Cite diretrizes médicas quando relevante
           - Seja claro sobre diagnósticos diferenciais
           - Sugira exames complementares quando apropriado
           - Use linguagem técnica médica apropriada
           - Nunca substitua o julgamento clínico do médico
           
           Formato de resposta:
           - Seja objetivo e estruturado
           - Use listas quando apropriado
           - Destaque informações críticas
           - Inclua considerações de segurança`
        : "Você é um assistente de saúde que fornece informações gerais. Sempre recomende consultar um profissional de saúde para diagnósticos e tratamentos.";

      const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ];

      // Chamar OpenAI GPT-5
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages,
        max_completion_tokens: 2048,
      });

      const answer = completion.choices[0]?.message?.content || "Desculpe, não foi possível processar sua pergunta.";

      // Incrementar quota
      await storage.incrementQuota(userId);
      const newQuota = await checkQuota(userId);

      res.json({
        answer,
        remaining: newQuota.remaining,
      });
    } catch (error: any) {
      console.error("Erro no chat:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      res.status(500).json({
        error: error.message || "Erro ao processar chat",
      });
    }
  });

  // ===== ENDPOINT: Upload e Análise de Imagens =====
  app.post("/api/upload", upload.array("files", 10), async (req: Request, res) => {
    try {
      const userId = req.headers["x-user-id"] as string || "demo-doctor";
      
      // Verificar quota
      const quota = await checkQuota(userId);
      if (!quota.allowed) {
        return res.status(429).json({
          error: "Limite diário de uploads atingido. Tente novamente amanhã.",
          remaining: 0,
        });
      }

      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: "Nenhum arquivo enviado",
        });
      }

      const attachments: any[] = [];

      // Processar cada arquivo
      for (const file of files) {
        try {
          // Para imagens, fazer análise com GPT-5 Vision
          if (file.mimetype.startsWith("image/")) {
            const imageBuffer = await fs.readFile(file.path);
            const base64Image = imageBuffer.toString("base64");

            const visionResponse = await openai.chat.completions.create({
              model: "gpt-5",
              messages: [
                {
                  role: "system",
                  content: `Você é um especialista em análise de imagens médicas. Analise a imagem fornecida e forneça:
                  
                  1. Tipo de exame/imagem (raio-x, tomografia, ultrassom, foto clínica, etc.)
                  2. Principais achados visuais
                  3. Possíveis interpretações clínicas
                  4. Recomendações para avaliação adicional
                  
                  IMPORTANTE: Sempre enfatize que esta é uma análise preliminar e que um médico deve avaliar pessoalmente.`,
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Por favor, analise esta imagem médica em detalhes:",
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${file.mimetype};base64,${base64Image}`,
                      },
                    },
                  ],
                },
              ],
              max_completion_tokens: 1024,
            });

            const analysis = visionResponse.choices[0]?.message?.content || "Análise não disponível";

            attachments.push({
              filename: file.originalname,
              type: file.mimetype,
              url: `/uploads/${file.filename}`,
              analysis,
            });
          } else {
            // Para PDFs, apenas registrar o upload
            attachments.push({
              filename: file.originalname,
              type: file.mimetype,
              url: `/uploads/${file.filename}`,
              analysis: "Arquivo PDF recebido. Para análise detalhada, extraia o texto ou converta para imagens.",
            });
          }

          // Limpar arquivo temporário após processamento
          await fs.unlink(file.path).catch(() => {});
        } catch (fileError: any) {
          console.error(`Erro ao processar arquivo ${file.originalname}:`, fileError);
          attachments.push({
            filename: file.originalname,
            type: file.mimetype,
            url: "",
            error: "Erro ao processar arquivo",
          });
        }
      }

      // Incrementar quota (1 por batch de upload)
      await storage.incrementQuota(userId);
      const newQuota = await checkQuota(userId);

      res.json({
        attachments,
        remaining: newQuota.remaining,
      });
    } catch (error: any) {
      console.error("Erro no upload:", error);
      res.status(500).json({
        error: error.message || "Erro ao processar upload",
      });
    }
  });

  // ===== ENDPOINTS: Gestão de Pacientes =====
  
  // Listar todos os pacientes
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error: any) {
      console.error("Erro ao listar pacientes:", error);
      res.status(500).json({
        error: "Erro ao listar pacientes",
      });
    }
  });

  // Criar novo paciente
  app.post("/api/patients", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error: any) {
      console.error("Erro ao criar paciente:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      res.status(500).json({
        error: "Erro ao criar paciente",
      });
    }
  });

  // Obter paciente por ID
  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      
      if (!patient) {
        return res.status(404).json({
          error: "Paciente não encontrado",
        });
      }

      res.json(patient);
    } catch (error: any) {
      console.error("Erro ao buscar paciente:", error);
      res.status(500).json({
        error: "Erro ao buscar paciente",
      });
    }
  });

  // Atualizar paciente
  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.partial().parse(req.body);
      const updated = await storage.updatePatient(req.params.id, validatedData);
      
      if (!updated) {
        return res.status(404).json({
          error: "Paciente não encontrado",
        });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Erro ao atualizar paciente:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      res.status(500).json({
        error: "Erro ao atualizar paciente",
      });
    }
  });

  // Deletar paciente
  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePatient(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({
          error: "Paciente não encontrado",
        });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Erro ao deletar paciente:", error);
      res.status(500).json({
        error: "Erro ao deletar paciente",
      });
    }
  });

  // ===== ENDPOINTS: Gestão de Consultas =====
  // IMPORTANTE: Essas rotas lidam com informações sensíveis (prontuários médicos - PHI)
  // Para ativar autenticação obrigatória, adicione isAuthenticated antes de async:
  // app.get("/api/patients/:patientId/consultations", isAuthenticated, async (req, res) => {

  // Listar consultas de um paciente
  app.get("/api/patients/:patientId/consultations", async (req, res) => {
    try {
      const consultations = await storage.getConsultationsByPatient(req.params.patientId);
      res.json(consultations);
    } catch (error: any) {
      console.error("Erro ao listar consultas:", error);
      res.status(500).json({
        error: "Erro ao listar consultas",
      });
    }
  });

  // Criar nova consulta
  app.post("/api/consultations", async (req, res) => {
    try {
      const validatedData = insertConsultationSchema.parse(req.body);
      const consultation = await storage.createConsultation(validatedData);
      res.status(201).json(consultation);
    } catch (error: any) {
      console.error("Erro ao criar consulta:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      res.status(500).json({
        error: "Erro ao criar consulta",
      });
    }
  });

  // Obter consulta por ID
  app.get("/api/consultations/:id", async (req, res) => {
    try {
      const consultation = await storage.getConsultation(req.params.id);
      
      if (!consultation) {
        return res.status(404).json({
          error: "Consulta não encontrada",
        });
      }

      res.json(consultation);
    } catch (error: any) {
      console.error("Erro ao buscar consulta:", error);
      res.status(500).json({
        error: "Erro ao buscar consulta",
      });
    }
  });

  // Deletar consulta
  app.delete("/api/consultations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteConsultation(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({
          error: "Consulta não encontrada",
        });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Erro ao deletar consulta:", error);
      res.status(500).json({
        error: "Erro ao deletar consulta",
      });
    }
  });

  // ===== ENDPOINT: Info de Quota =====
  app.get("/api/quota", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string || "demo-doctor";
      const used = await storage.getQuotaUsed(userId);
      const remaining = Math.max(0, DAILY_LIMIT - used);

      res.json({
        used,
        limit: DAILY_LIMIT,
        remaining,
      });
    } catch (error: any) {
      console.error("Erro ao buscar quota:", error);
      res.status(500).json({
        error: "Erro ao buscar quota",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
