import bcrypt from "bcryptjs";
import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { verificationCodes, users } from "@shared/schema";

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 6;
const COOLDOWN_SECONDS = 60;
const MAX_REQUESTS_PER_DAY = 5;

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createVerificationCode(
  emailOrPhone: string,
  channel: "email" | "sms",
  purpose: "signup" | "reset",
  userId?: string
): Promise<string> {
  // Check cooldown (last request within 60 seconds)
  const cooldownTime = new Date(Date.now() - COOLDOWN_SECONDS * 1000);
  const recentCode = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.emailOrPhone, emailOrPhone),
        eq(verificationCodes.purpose, purpose),
        gte(verificationCodes.createdAt, cooldownTime)
      )
    )
    .limit(1);

  if (recentCode.length > 0) {
    throw new Error(`Por favor, aguarde ${COOLDOWN_SECONDS} segundos antes de solicitar um novo código.`);
  }

  // Check daily limit (5 requests per day per user per purpose)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dailyCodes = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.emailOrPhone, emailOrPhone),
        eq(verificationCodes.purpose, purpose),
        gte(verificationCodes.createdAt, dayAgo)
      )
    );

  if (dailyCodes.length >= MAX_REQUESTS_PER_DAY) {
    throw new Error(`Limite de ${MAX_REQUESTS_PER_DAY} solicitações por dia atingido. Tente novamente amanhã.`);
  }

  // Generate and hash code
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  // Save to database
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  await db.insert(verificationCodes).values({
    userId,
    channel,
    purpose,
    codeHash,
    expiresAt,
    emailOrPhone,
    attempts: 0,
    consumed: false,
  });

  return code;
}

export async function verifyCode(
  emailOrPhone: string,
  code: string,
  purpose: "signup" | "reset"
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  // Find the most recent non-consumed code for this email/phone and purpose
  const codes = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.emailOrPhone, emailOrPhone),
        eq(verificationCodes.purpose, purpose),
        eq(verificationCodes.consumed, false)
      )
    )
    .orderBy(sql`${verificationCodes.createdAt} DESC`)
    .limit(1);

  if (codes.length === 0) {
    return { valid: false, error: "Código inválido ou expirado." };
  }

  const verificationCode = codes[0];

  // Check if expired
  if (new Date() > new Date(verificationCode.expiresAt)) {
    return { valid: false, error: "Código expirado. Solicite um novo código." };
  }

  // Check max attempts
  if (verificationCode.attempts >= MAX_ATTEMPTS) {
    return { valid: false, error: "Número máximo de tentativas excedido. Solicite um novo código." };
  }

  // Increment attempts
  await db
    .update(verificationCodes)
    .set({ attempts: verificationCode.attempts + 1 })
    .where(eq(verificationCodes.id, verificationCode.id));

  // Verify code
  const isValid = await bcrypt.compare(code, verificationCode.codeHash);

  if (!isValid) {
    const remainingAttempts = MAX_ATTEMPTS - (verificationCode.attempts + 1);
    return {
      valid: false,
      error: `Código inválido. ${remainingAttempts} tentativas restantes.`,
    };
  }

  // Mark as consumed
  await db
    .update(verificationCodes)
    .set({ consumed: true })
    .where(eq(verificationCodes.id, verificationCode.id));

  return { valid: true, userId: verificationCode.userId || undefined };
}

export async function markEmailVerified(userId: string) {
  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.id, userId));
}

export async function markPhoneVerified(userId: string) {
  await db
    .update(users)
    .set({ phoneVerified: true })
    .where(eq(users.id, userId));
}

export async function cleanupExpiredCodes() {
  const now = new Date();
  await db
    .delete(verificationCodes)
    .where(sql`${verificationCodes.expiresAt} < ${now}`);
}
