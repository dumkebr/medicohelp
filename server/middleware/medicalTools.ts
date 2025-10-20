import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { medicalToolsAudit } from "@shared/schema";

/**
 * Middleware to check if user has access to medical tools
 * Only users with role 'medico' or 'estudante' OR with verified_crm can access
 */
export function requireMedicalAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ error: "Autenticação necessária" });
  }

  const { role, verifiedCrm } = req.authUser;
  
  // Allow access for medico and estudante roles, or users with verified CRM
  if (role === "medico" || role === "estudante" || verifiedCrm === true) {
    return next();
  }

  return res.status(403).json({ 
    error: "Acesso negado",
    message: "Ferramentas médicas disponíveis apenas para médicos e estudantes de medicina"
  });
}

/**
 * Rate limiter for medical tools
 * Limits to 60 requests per hour per user per tool
 */
const toolRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

export function rateLimitMedicalTools(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ error: "Autenticação necessária" });
  }

  const userId = req.authUser.userId;
  // Extract tool name from path: /posologia or /calculadora/alvarado -> "posologia", "calculadora"
  const pathParts = req.path.split('/').filter(p => p);
  const tool = pathParts[0] || 'unknown';
  const key = `${userId}:${tool}`;
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  let userLimit = toolRequestCounts.get(key);

  // Reset if hour has passed
  if (!userLimit || now > userLimit.resetTime) {
    userLimit = {
      count: 0,
      resetTime: now + oneHour
    };
    toolRequestCounts.set(key, userLimit);
  }

  // Check if limit exceeded
  if (userLimit.count >= 60) {
    const timeRemaining = Math.ceil((userLimit.resetTime - now) / 1000 / 60);
    return res.status(429).json({
      error: "Limite de requisições excedido",
      message: `Você atingiu o limite de 60 requisições por hora para esta ferramenta. Tente novamente em ${timeRemaining} minutos.`
    });
  }

  // Increment count
  userLimit.count++;

  next();
}

/**
 * Audit logger for medical tools usage
 */
export async function auditMedicalToolUsage(
  userId: string,
  role: string,
  tool: string,
  payloadSummary: string,
  status: "ok" | "fail"
) {
  try {
    await db.insert(medicalToolsAudit).values({
      userId,
      role,
      tool,
      payloadSummary,
      status,
    });
  } catch (error) {
    // Log silently - don't fail the request if audit fails
    console.error("[Audit Error]", error);
  }
}
