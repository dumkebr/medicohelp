import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { 
  chatRequestSchema, 
  insertPatientSchema, 
  insertConsultationSchema,
  registerSchema,
  loginSchema,
  updateUserSchema,
  requestCodeSchema,
  verifyCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  researchRequestSchema,
  insertNotificationsWaitlistSchema,
  type AuthResponse,
  type ResearchResponse 
} from "@shared/schema";
import { generateToken, authMiddleware } from "./middleware/auth";
import { configurePassport } from "./passport-config";
import { createVerificationCode, verifyCode, markEmailVerified, markPhoneVerified } from "./services/verification";
import { sendVerificationEmail, isEmailConfigured } from "./services/email";
import { sendVerificationSMS, isSmsConfigured } from "./services/sms";
import { isResearchAvailable, searchScientificLiterature } from "./services/research";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { retryWithBackoff } from "./utils/retry";
import { loadClinicoConfig, buildClinicoSystemPrompt } from "./config-loader";

// Referência ao blueprint javascript_openai para integração OpenAI
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuração do multer para upload de arquivos (exames)
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

// Configuração do multer para upload de avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/");
  },
  filename: (req, file, cb) => {
    const userId = (req as any).authUser?.userId;
    if (!userId) {
      return cb(new Error("Usuário não autenticado"), "");
    }
    const ext = path.extname(file.originalname);
    cb(null, `${userId}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado. Use JPEG ou PNG."));
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
  // ===== SETUP: Passport OAuth =====
  app.use(passport.initialize());
  configurePassport();

  // ===== SETUP: Replit Auth =====
  // (IMPORTANT) Auth middleware from blueprint:javascript_log_in_with_replit
  await setupAuth(app);

  // ===== ENDPOINT: Get authenticated user (Replit Auth - Legacy) =====
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ===== JWT AUTHENTICATION ROUTES =====
  
  // POST /auth/register - Registro de médicos e estudantes
  app.post("/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { name, email, password, role, crm, uf } = validatedData;

      // Verificar se o email já existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Criar usuário
      const user = await storage.createUser({
        name,
        email,
        passwordHash,
        role,
        crm: role === "medico" ? crm : undefined,
        uf: role === "medico" ? uf : undefined,
      });

      // Criar configurações padrão do usuário
      await storage.createUserSettings({
        userId: user.id,
        defaultStyle: "tradicional",
      });

      // Gerar token JWT
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        verifiedCrm: user.verifiedCrm || false,
      });

      const response: AuthResponse = {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          crm: user.crm || undefined,
          uf: user.uf || undefined,
          avatarUrl: user.avatarUrl || undefined,
          verifiedCrm: user.verifiedCrm || false,
        },
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Erro no registro:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao registrar usuário" });
    }
  });

  // POST /auth/login - Login com email e senha
  app.post("/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;

      // Buscar usuário por email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      // Gerar token JWT
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        verifiedCrm: user.verifiedCrm || false,
      });

      const response: AuthResponse = {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          crm: user.crm || undefined,
          uf: user.uf || undefined,
          avatarUrl: user.avatarUrl || undefined,
          verifiedCrm: user.verifiedCrm || false,
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Erro no login:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // GET /auth/me - Retorna usuário autenticado (protegido com JWT)
  app.get("/auth/me", authMiddleware, async (req, res) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await storage.getUserById(req.authUser.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        crm: user.crm || undefined,
        uf: user.uf || undefined,
        avatarUrl: user.avatarUrl || undefined,
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  // ===== USER SETTINGS ROUTES =====

  // GET /users/me - Retorna usuário com configurações (protegido com JWT)
  app.get("/users/me", authMiddleware, async (req, res) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const userWithSettings = await storage.getUserWithSettings(req.authUser.userId);
      if (!userWithSettings) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        id: userWithSettings.id,
        name: userWithSettings.name,
        email: userWithSettings.email,
        role: userWithSettings.role,
        crm: userWithSettings.crm || undefined,
        uf: userWithSettings.uf || undefined,
        avatarUrl: userWithSettings.avatarUrl || undefined,
        defaultStyle: userWithSettings.defaultStyle,
        customTemplate: userWithSettings.customTemplate || undefined,
        explanatoryModeEnabled: userWithSettings.explanatoryModeEnabled,
        showPediatria: userWithSettings.showPediatria,
        showGestante: userWithSettings.showGestante,
        showEmergencia: userWithSettings.showEmergencia,
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  // PUT /users/me - Atualiza nome e configurações (protegido com JWT)
  // NOTA: Role, CRM e UF não podem ser alterados por segurança (previne privilege escalation)
  app.put("/users/me", authMiddleware, async (req, res) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const validatedData = updateUserSchema.parse(req.body);
      const { name, defaultStyle, customTemplate, explanatoryModeEnabled, showPediatria, showGestante, showEmergencia } = validatedData;

      // Atualizar nome se fornecido
      if (name) {
        await storage.updateUser(req.authUser.userId, { name });
      }

      // Atualizar configurações se fornecido
      const settingsUpdate: Partial<{ defaultStyle: "tradicional" | "soap" | "personalizado"; customTemplate: string; explanatoryModeEnabled: boolean; showPediatria: boolean; showGestante: boolean; showEmergencia: boolean }> = {};
      if (defaultStyle !== undefined) settingsUpdate.defaultStyle = defaultStyle;
      if (customTemplate !== undefined) settingsUpdate.customTemplate = customTemplate;
      if (explanatoryModeEnabled !== undefined) settingsUpdate.explanatoryModeEnabled = explanatoryModeEnabled;
      if (showPediatria !== undefined) settingsUpdate.showPediatria = showPediatria;
      if (showGestante !== undefined) settingsUpdate.showGestante = showGestante;
      if (showEmergencia !== undefined) settingsUpdate.showEmergencia = showEmergencia;

      if (Object.keys(settingsUpdate).length > 0) {
        await storage.updateUserSettings(req.authUser.userId, settingsUpdate);
      }

      // Retornar usuário atualizado
      const userWithSettings = await storage.getUserWithSettings(req.authUser.userId);
      if (!userWithSettings) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        id: userWithSettings.id,
        name: userWithSettings.name,
        email: userWithSettings.email,
        role: userWithSettings.role,
        crm: userWithSettings.crm || undefined,
        uf: userWithSettings.uf || undefined,
        avatarUrl: userWithSettings.avatarUrl || undefined,
        defaultStyle: userWithSettings.defaultStyle,
        customTemplate: userWithSettings.customTemplate || undefined,
        explanatoryModeEnabled: userWithSettings.explanatoryModeEnabled,
        showPediatria: userWithSettings.showPediatria,
        showGestante: userWithSettings.showGestante,
        showEmergencia: userWithSettings.showEmergencia,
      });
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  });

  // POST /users/me/avatar - Upload de avatar (protegido com JWT)
  app.post("/users/me/avatar", authMiddleware, avatarUpload.single("file"), async (req, res) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const avatarUrl = `/static/avatars/${req.file.filename}`;
      await storage.updateUser(req.authUser.userId, { avatarUrl });

      res.json({ avatarUrl });
    } catch (error: any) {
      console.error("Erro ao fazer upload do avatar:", error);
      res.status(500).json({ error: "Erro ao fazer upload do avatar" });
    }
  });

  // Servir arquivos estáticos de avatars
  app.use("/static/avatars", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=86400");
    next();
  });
  app.use("/static/avatars", express.static(path.join(process.cwd(), "uploads/avatars")));

  // ===== OAUTH ROUTES =====
  const OAUTH_BASE_URL = process.env.OAUTH_BASE_URL || "http://localhost:5000";

  // Google OAuth (only if configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/auth/google", passport.authenticate("google", { 
      scope: ["profile", "email"],
      session: false 
    }));
    
    app.get("/auth/google/callback", 
      passport.authenticate("google", { session: false, failureRedirect: `${OAUTH_BASE_URL}/?error=auth_failed` }),
      (req, res) => {
        const user = req.user as any;
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          verifiedCrm: user.verified_crm || user.verifiedCrm || false,
        });
        res.redirect(`${OAUTH_BASE_URL}/?token=${token}`);
      }
    );
  }

  // Apple OAuth (only if configured)
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    app.get("/auth/apple", passport.authenticate("apple", { session: false }));
    
    app.post("/auth/apple/callback", 
      passport.authenticate("apple", { session: false, failureRedirect: `${OAUTH_BASE_URL}/?error=auth_failed` }),
      (req, res) => {
        const user = req.user as any;
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          verifiedCrm: user.verified_crm || user.verifiedCrm || false,
        });
        res.redirect(`${OAUTH_BASE_URL}/?token=${token}`);
      }
    );
  }

  // Microsoft OAuth (only if configured)
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    app.get("/auth/microsoft", passport.authenticate("microsoft", { 
      session: false,
      prompt: "select_account"
    }));
    
    app.get("/auth/microsoft/callback", 
      passport.authenticate("microsoft", { session: false, failureRedirect: `${OAUTH_BASE_URL}/?error=auth_failed` }),
      (req, res) => {
        const user = req.user as any;
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          verifiedCrm: user.verified_crm || user.verifiedCrm || false,
        });
        res.redirect(`${OAUTH_BASE_URL}/?token=${token}`);
      }
    );
  }

  // GitHub OAuth (only if configured)
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    app.get("/auth/github", passport.authenticate("github", { 
      scope: ["user:email"],
      session: false 
    }));
    
    app.get("/auth/github/callback", 
      passport.authenticate("github", { session: false, failureRedirect: `${OAUTH_BASE_URL}/?error=auth_failed` }),
      (req, res) => {
        const user = req.user as any;
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          verifiedCrm: user.verified_crm || user.verifiedCrm || false,
        });
        res.redirect(`${OAUTH_BASE_URL}/?token=${token}`);
      }
    );
  }

  // GET /auth/providers - Lista provedores OAuth vinculados (protegido com JWT)
  app.get("/auth/providers", authMiddleware, async (req, res) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const providers = await storage.getLinkedProviders(req.authUser.userId);
      res.json({ providers });
    } catch (error: any) {
      console.error("Erro ao buscar provedores:", error);
      res.status(500).json({ error: "Erro ao buscar provedores OAuth" });
    }
  });

  // ===== VERIFICATION CODE ROUTES =====
  
  // Rate limiters
  const requestCodeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour per IP
    message: "Muitas solicitações de código. Tente novamente mais tarde.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const verifyCodeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 requests per hour per IP
    message: "Muitas tentativas de verificação. Tente novamente mais tarde.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // POST /auth/request-code - Solicitar código de verificação (email ou SMS)
  app.post("/auth/request-code", requestCodeLimiter, async (req, res) => {
    try {
      const validatedData = requestCodeSchema.parse(req.body);
      const { purpose, channel, email, phone } = validatedData;

      // Check if channel is configured
      if (channel === "email" && !isEmailConfigured()) {
        return res.status(503).json({ 
          error: "Serviço de email não configurado" 
        });
      }

      if (channel === "sms" && !isSmsConfigured()) {
        return res.status(503).json({ 
          error: "Serviço de SMS não configurado" 
        });
      }

      const emailOrPhone = email || phone!;

      // For reset password, verify user exists
      if (purpose === "reset") {
        const user = email 
          ? await storage.getUserByEmail(email)
          : await storage.getUserByPhone(phone!);
        
        if (!user) {
          // Don't reveal if user exists or not (security)
          return res.status(204).send();
        }
      }

      // Generate and send code
      const code = await createVerificationCode(emailOrPhone, channel, purpose);

      if (channel === "email") {
        await sendVerificationEmail(email!, code, purpose);
      } else if (channel === "sms") {
        await sendVerificationSMS(phone!, code, purpose);
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Erro ao solicitar código:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error.message.includes("aguarde") || error.message.includes("Limite")) {
        return res.status(429).json({ error: error.message });
      }

      res.status(500).json({ error: "Erro ao enviar código de verificação" });
    }
  });

  // POST /auth/verify-code - Verificar código
  app.post("/auth/verify-code", verifyCodeLimiter, async (req, res) => {
    try {
      const validatedData = verifyCodeSchema.parse(req.body);
      const { purpose, email, phone, code } = validatedData;

      const emailOrPhone = email || phone!;

      const result = await verifyCode(emailOrPhone, code, purpose);

      if (!result.valid) {
        return res.status(400).json({ error: result.error });
      }

      if (purpose === "signup") {
        // Auto-login: issue JWT token
        const user = email
          ? await storage.getUserByEmail(email)
          : await storage.getUserByPhone(phone!);

        if (!user) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Mark as verified
        if (email) {
          await markEmailVerified(user.id);
        } else if (phone) {
          await markPhoneVerified(user.id);
        }

        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          verifiedCrm: user.verifiedCrm || false,
        });

        const response: AuthResponse = {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            crm: user.crm || undefined,
            uf: user.uf || undefined,
            avatarUrl: user.avatarUrl || undefined,
            verifiedCrm: user.verifiedCrm || false,
          },
        };

        return res.json(response);
      } else if (purpose === "reset") {
        // Issue reset token (15 min TTL)
        const user = email
          ? await storage.getUserByEmail(email)
          : await storage.getUserByPhone(phone!);

        if (!user) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const resetToken = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          verifiedCrm: user.verifiedCrm || false,
        }, "15m");

        return res.json({ resetToken });
      }
    } catch (error: any) {
      console.error("Erro ao verificar código:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }

      res.status(500).json({ error: "Erro ao verificar código" });
    }
  });

  // POST /auth/forgot-password - Alias para request-code com purpose=reset
  app.post("/auth/forgot-password", requestCodeLimiter, async (req, res) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      const { email, phone, channel } = validatedData;

      // Determine channel if not provided
      const determinedChannel = channel || (email ? "email" : "sms");

      // Check if channel is configured
      if (determinedChannel === "email" && !isEmailConfigured()) {
        return res.status(503).json({ 
          error: "Serviço de email não configurado" 
        });
      }

      if (determinedChannel === "sms" && !isSmsConfigured()) {
        return res.status(503).json({ 
          error: "Serviço de SMS não configurado" 
        });
      }

      const emailOrPhone = email || phone!;

      // Verify user exists
      const user = email 
        ? await storage.getUserByEmail(email)
        : await storage.getUserByPhone(phone!);
      
      if (!user) {
        // Don't reveal if user exists or not (security)
        return res.status(204).send();
      }

      // Generate and send code
      const code = await createVerificationCode(emailOrPhone, determinedChannel, "reset");

      if (determinedChannel === "email") {
        await sendVerificationEmail(email!, code, "reset");
      } else if (determinedChannel === "sms") {
        await sendVerificationSMS(phone!, code, "reset");
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Erro ao solicitar reset de senha:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error.message.includes("aguarde") || error.message.includes("Limite")) {
        return res.status(429).json({ error: error.message });
      }

      res.status(500).json({ error: "Erro ao solicitar reset de senha" });
    }
  });

  // POST /auth/reset-password - Reset password com reset token
  app.post("/auth/reset-password", authMiddleware, async (req, res) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ error: "Token de reset inválido ou expirado" });
      }

      const validatedData = resetPasswordSchema.parse(req.body);
      const { newPassword } = validatedData;

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(req.authUser.userId, { passwordHash });

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }

      res.status(500).json({ error: "Erro ao redefinir senha" });
    }
  });

  // Criar diretório de uploads se não existir
  try {
    await fs.mkdir("uploads", { recursive: true });
  } catch (error) {
    console.error("Erro ao criar diretório uploads:", error);
  }

  // ===== HELPER FUNCTIONS: Dual-Mode System =====
  
  // Detectar triggers de modo explicativo
  function detectExplanatoryMode(message: string): boolean {
    const triggers = [
      'explica', 'me ensina', 'justifica', 'por qu', 'porqu',
      'base teórica', 'evidência', 'fundamento', 'racional',
      'diretriz', 'guideline', 'literatura', 'estudo',
    ];
    
    const lowerMessage = message.toLowerCase();
    return triggers.some(trigger => lowerMessage.includes(trigger));
  }

  // Construir prompt de Modo Clínico
  // Carregar configuração do modo clínico
  const clinicoConfig = loadClinicoConfig();

  function buildClinicalPrompt(style: string, customTemplate?: string): string {
    // Usar configuração JSON como base
    const configBasedPrompt = buildClinicoSystemPrompt(clinicoConfig);
    
    const basePrompt = `Você é a IA médica do MédicoHelp, ferramenta exclusiva para médicos com CRM validado.

**CONFIGURAÇÃO ATIVA:** ${clinicoConfig.meta.template}
**TOM:** ${clinicoConfig.behavior.description}

${configBasedPrompt}

**FORMATO DE RESPOSTA - CONDUTA CLÍNICA RÁPIDA:**

Use o seguinte formato estruturado e objetivo:

⚡ CONDUTA CLÍNICA RÁPIDA
1️⃣ [Primeiro passo da conduta]
2️⃣ [Segundo passo da conduta]
3️⃣ [Terceiro passo da conduta]
4️⃣ [Quarto passo (se aplicável)]
5️⃣ [Quinto passo (se aplicável)]

**INSTRUÇÕES ADICIONAIS:**
- Seja objetivo e direto, como em uma lista de verificação de plantão
- Use emojis numerados (1️⃣, 2️⃣, 3️⃣...) para passos da conduta
- Priorize ações práticas e imediatas
- Mantenha frases curtas e imperativas
- Sempre comece com "⚡ CONDUTA CLÍNICA RÁPIDA"

Finalize com o aviso discreto:
> Conteúdo de apoio clínico. Validação e responsabilidade: médico usuário.`;

    if (style === 'soap') {
      return `${basePrompt}

Formato SOAP solicitado - organize a conduta usando as divisões S/O/A/P, mas mantenha o formato de checklist dentro da seção P (Plano).`;
    } else if (style === 'personalizado' && customTemplate) {
      return `${basePrompt}

Template personalizado:
${customTemplate}`;
    } else {
      // Tradicional (default) - formato de checklist + config JSON
      return basePrompt;
    }
  }

  // Construir prompt de Modo Explicativo
  function buildExplanatoryPrompt(evidenceContext?: string): string {
    const basePrompt = `Você é a IA médica do MédicoHelp, ferramenta exclusiva para médicos com CRM validado.

**FORMATO DE RESPOSTA - MODO EXPLICATIVO + EVIDÊNCIAS:**

Forneça uma explicação completa e educacional em texto corrido, fundamentada em evidências científicas.

**ESTRUTURA:**
1. Explique o conceito médico, fisiopatologia ou racional da conduta de forma clara e profissional
2. Use texto corrido fluido e natural, como em uma conversa educativa entre colegas
3. Integre diretrizes e evidências de forma natural no texto
4. SEMPRE finalize com uma seção de referências bibliográficas

**SEÇÃO DE EVIDÊNCIAS (OBRIGATÓRIA):**
Ao final da explicação, inclua SEMPRE uma seção formatada assim:

📚 **Evidências clínicas:**
- [Nome da Sociedade/Guideline] – [Título ou tipo de referência] [Ano]
- [Nome da Base de Dados] – [Tópico específico]
- [Outras referências relevantes]

**EXEMPLO DE FORMATAÇÃO:**

[Texto explicativo fluido sobre o tema, integrando conceitos, fisiopatologia e racional científico...]

📚 **Evidências clínicas:**
- American Heart Association (AHA) – ACLS Guidelines 2020
- European Society of Cardiology (ESC) – Guideline for Management of XYZ 2023
- UpToDate: "Management of [Condition] in Adults"
- Cochrane Database: "Systematic Review on [Topic]"

> Conteúdo de apoio clínico. Validação e responsabilidade: médico usuário.`;

    if (evidenceContext) {
      return `${basePrompt}

CONTEXTO DE EVIDÊNCIAS DO PUBMED:
${evidenceContext}

Use este contexto para fundamentar sua explicação e inclua na seção "📚 Evidências clínicas" ao final.`;
    }

    return basePrompt;
  }

  // ===== ENDPOINT: Chat Médico (SSE Streaming) =====
  app.post("/api/chat", async (req, res) => {
    const startTime = Date.now();
    
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
      const { 
        message, 
        history = [], 
        userRole = "doctor",
        mode: requestedMode,
        documentStyle,
        customTemplate,
      } = validatedData;

      // Buscar configurações do usuário
      let userSettings = null;
      try {
        userSettings = await storage.getUserSettings(userId);
      } catch (error) {
        console.log("User settings not found, using defaults");
      }

      // Determinar modo (auto-detect se não especificado)
      let activeMode = requestedMode || 'clinico';
      if (!requestedMode && detectExplanatoryMode(message)) {
        activeMode = 'explicativo';
      }

      // Determinar estilo de documento
      const style = documentStyle || userSettings?.defaultStyle || 'tradicional';
      const template = customTemplate || userSettings?.customTemplate;

      // Buscar evidências silenciosamente se modo explicativo + habilitado
      // Respeita tanto a configuração do usuário quanto a flag global do sistema
      const EVIDENCE_ALLOWED_IN_EXPLANATORY = process.env.EVIDENCE_ALLOWED_IN_EXPLANATORY !== 'false';
      let evidenceContext = '';
      if (activeMode === 'explicativo' && userSettings?.explanatoryModeEnabled && EVIDENCE_ALLOWED_IN_EXPLANATORY) {
        try {
          // Chamar endpoint interno de research
          const searchProvider = process.env.SEARCH_PROVIDER;
          const searchApiKey = process.env.SEARCH_API_KEY;
          
          if (searchProvider === 'pubmed' && searchApiKey) {
            const pubmedResponse = await fetch(
              `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(message)}&retmax=3&retmode=json&api_key=${searchApiKey}`
            );
            
            if (pubmedResponse.ok) {
              const pubmedData = await pubmedResponse.json();
              const ids = pubmedData?.esearchresult?.idlist || [];
              
              if (ids.length > 0) {
                const summaryResponse = await fetch(
                  `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json&api_key=${searchApiKey}`
                );
                
                if (summaryResponse.ok) {
                  const summaryData = await summaryResponse.json();
                  const articles = ids.map((id: string) => {
                    const article = summaryData?.result?.[id];
                    if (article) {
                      return `${article.title} (${article.source}, ${article.pubdate})`;
                    }
                    return null;
                  }).filter(Boolean);
                  
                  evidenceContext = articles.join('\n');
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching evidence:", error);
          // Continue without evidence - não bloquear a resposta
        }
      }

      // Construir system prompt baseado no modo
      let systemPrompt: string;
      
      if (userRole === "doctor") {
        if (activeMode === 'explicativo') {
          systemPrompt = buildExplanatoryPrompt(evidenceContext || undefined);
        } else {
          // Modo clínico (padrão)
          systemPrompt = buildClinicalPrompt(style, template || undefined);
        }
      } else {
        // Paciente (modo básico)
        systemPrompt = "Você é um assistente de saúde que fornece informações gerais. Sempre recomende consultar um profissional de saúde para diagnósticos e tratamentos.";
      }

      const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ];

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      // Helper to send SSE event
      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      let fullAnswer = "";
      let tokenCount = 0;

      let streamingFailed = false;
      
      try {
        // Try streaming with retry logic (using GPT-4o for better compatibility)
        await retryWithBackoff(async () => {
          const stream = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            max_tokens: 4096,
            stream: true,
          });

          // Process stream chunks
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            
            if (content) {
              fullAnswer += content;
              tokenCount++;

              // Send chunk to client
              sendEvent("chunk", { content });
            }
          }

          // Stream completed successfully
          return fullAnswer;
        }, 3, 2000, 45000); // 3 attempts, 2s base delay, 45s timeout
      } catch (streamError: any) {
        // Check if it's an organization verification error
        if (streamError.message?.includes("organization must be verified") || 
            streamError.message?.includes("streaming")) {
          console.log("⚠️ Streaming not available, falling back to non-streaming mode...");
          streamingFailed = true;
        } else {
          throw streamError; // Re-throw if it's a different error
        }
      }

      // Fallback to non-streaming mode if streaming failed
      if (streamingFailed) {
        console.log("Using fallback: GPT-4o non-streaming mode");
        const completion = await retryWithBackoff(async () => {
          return await openai.chat.completions.create({
            model: "gpt-4o", // Use GPT-4o for fallback (better streaming support)
            messages,
            max_tokens: 4096,
            stream: false,
          });
        }, 2, 1000, 20000); // Reduced: 2 attempts, 1s base delay, 20s timeout

        fullAnswer = completion.choices[0]?.message?.content || "Desculpe, não foi possível processar sua pergunta.";
        tokenCount = fullAnswer.length;

        // Send the complete response as one chunk
        sendEvent("chunk", { content: fullAnswer });
      }

      // Ensure disclaimer is always present
      const disclaimer = "\n\n> Conteúdo de apoio clínico. Validação e responsabilidade: médico usuário.";
      if (!fullAnswer.includes("Conteúdo de apoio clínico")) {
        fullAnswer += disclaimer;
        sendEvent("chunk", { content: disclaimer });
      }

      // Increment quota after successful completion
      await storage.incrementQuota(userId);
      const newQuota = await checkQuota(userId);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Log analytics
      console.log(`Chat completion: ${tokenCount} tokens in ${duration}ms for user ${userId}`);

      // Send completion event with metadata
      sendEvent("complete", {
        remaining: newQuota.remaining,
        duration,
        tokens: tokenCount,
      });

      res.end();
      
    } catch (error: any) {
      console.error("Erro no chat:", error);
      
      // Send error event to client via SSE
      if (!res.headersSent) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
      }
      
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({
        message: error.message?.includes("Timeout") 
          ? "⚠️ Conexão lenta. Tente novamente ou verifique sua chave API."
          : error.name === "ZodError"
          ? "Dados inválidos"
          : "Erro ao processar chat. Por favor, tente novamente.",
      })}\n\n`);
      res.end();
    }
  });

  // ===== ENDPOINT: Clinical Evidence Research =====
  // IMPORTANT: This endpoint is REFERENCE-ONLY and should NEVER affect medical output logic
  app.post("/api/research", authMiddleware, async (req, res) => {
    try {
      // Check if research service is configured
      if (!isResearchAvailable()) {
        return res.status(503).json({
          error: "Serviço de evidências clínicas não configurado",
          message: "Configure SEARCH_PROVIDER e SEARCH_API_KEY para ativar este recurso",
        });
      }

      // Validate request
      const validatedData = researchRequestSchema.parse(req.body);
      const { query, maxSources = 5 } = validatedData;

      // Search for scientific literature
      const references = await searchScientificLiterature(query, maxSources);

      // Log analytics (optional, non-blocking)
      const userId = req.authUser?.userId || null;
      const provider = process.env.SEARCH_PROVIDER || "pubmed";
      await storage.logResearchQuery(userId, query, provider, references.length);

      // Return response (REFERENCE-ONLY)
      const response: ResearchResponse = {
        answer: "", // Empty - this is handled by the regular chat endpoint
        references,
      };

      res.json(response);
    } catch (error: any) {
      console.error("Erro na pesquisa científica:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      res.status(500).json({
        error: error.message || "Erro ao buscar evidências clínicas",
      });
    }
  });

  // ===== ENDPOINT: Notifications Waitlist (Em breve modules) =====
  app.post("/api/notify/feature", async (req, res) => {
    try {
      // Validate request
      const validatedData = insertNotificationsWaitlistSchema.parse(req.body);
      const { feature, email } = validatedData;

      // Add to waitlist (with deduplication)
      const result = await storage.addToWaitlist(feature, email);

      res.status(201).json({
        success: true,
        message: "Email cadastrado com sucesso! Você será notificado quando o recurso estiver disponível.",
        data: result,
      });
    } catch (error: any) {
      console.error("Erro ao cadastrar na waitlist:", error);
      
      // Check if it's a duplicate error
      if (error.message && error.message.includes("já cadastrado")) {
        return res.status(409).json({
          error: error.message,
        });
      }
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      res.status(500).json({
        error: error.message || "Erro ao cadastrar email na waitlist",
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
                  content: `Você é a IA médica do MédicoHelp, ferramenta exclusiva para médicos com CRM validado.

Analise a imagem médica de forma conversacional e fluida, identificando o tipo de exame, achados relevantes e interpretações clínicas.

Use texto corrido natural, como uma discussão de caso entre colegas, evitando listas numeradas excessivas.

Seja objetivo e técnico, mas mantenha o tom de conversa de plantão.

Finalize com o aviso discreto:
> Conteúdo de apoio clínico. Validação e responsabilidade: médico usuário.`,
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

  // ===== MEDICAL TOOLS ROUTES =====
  const medicalToolsRouter = (await import("./routes/medicalTools")).default;
  app.use("/api/tools", medicalToolsRouter);

  const httpServer = createServer(app);
  return httpServer;
}
