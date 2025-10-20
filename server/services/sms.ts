import twilio from "twilio";

export interface SmsConfig {
  configured: boolean;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
}

export function getSmsConfig(): SmsConfig {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM
  ) {
    return {
      configured: true,
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM,
    };
  }

  return { configured: false };
}

export async function sendVerificationSMS(
  phone: string,
  code: string,
  purpose: "signup" | "reset"
): Promise<void> {
  const config = getSmsConfig();

  if (!config.configured) {
    console.log("\n=== SMS NOT CONFIGURED ===");
    console.log(`Would send verification code to: ${phone}`);
    console.log(`Code: ${code}`);
    console.log(`Purpose: ${purpose}`);
    console.log("===========================\n");
    throw new Error("SMS service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM environment variables.");
  }

  const message = purpose === "signup"
    ? `MédicoHelp: Seu código de verificação de cadastro é ${code}. Válido por 10 minutos.`
    : `MédicoHelp: Seu código de redefinição de senha é ${code}. Válido por 10 minutos.`;

  try {
    const client = twilio(config.accountSid, config.authToken);
    
    const result = await client.messages.create({
      body: message,
      from: config.fromNumber,
      to: phone,
    });

    console.log(`SMS sent to ${phone} via Twilio (SID: ${result.sid})`);
  } catch (error: any) {
    console.error("Twilio error:", error);
    throw new Error(`Erro ao enviar SMS: ${error.message}`);
  }
}

export function isSmsConfigured(): boolean {
  const config = getSmsConfig();
  return config.configured;
}
