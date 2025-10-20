import nodemailer from "nodemailer";

export interface EmailConfig {
  type: "resend" | "smtp" | "none";
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
}

export function getEmailConfig(): EmailConfig {
  // Check for Resend API key first
  if (process.env.RESEND_API_KEY) {
    return {
      type: "resend",
      resendApiKey: process.env.RESEND_API_KEY,
    };
  }

  // Check for SMTP configuration
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  ) {
    return {
      type: "smtp",
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT),
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
      smtpFrom: process.env.SMTP_FROM,
    };
  }

  return { type: "none" };
}

export async function sendVerificationEmail(
  email: string,
  code: string,
  purpose: "signup" | "reset"
): Promise<void> {
  const config = getEmailConfig();

  if (config.type === "none") {
    console.log("\n=== EMAIL NOT CONFIGURED ===");
    console.log(`Would send verification code to: ${email}`);
    console.log(`Code: ${code}`);
    console.log(`Purpose: ${purpose}`);
    console.log("===========================\n");
    throw new Error("Email service not configured. Set RESEND_API_KEY or SMTP_* environment variables.");
  }

  const subject = purpose === "signup" 
    ? "MédicoHelp - Código de Verificação de Cadastro"
    : "MédicoHelp - Código de Redefinição de Senha";

  const text = `
Seu código de verificação do MédicoHelp é: ${code}

Este código expira em 10 minutos.

Se você não solicitou este código, ignore este email.

Atenciosamente,
Equipe MédicoHelp
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .code { font-size: 32px; font-weight: bold; color: #00B37E; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>MédicoHelp - ${purpose === "signup" ? "Verificação de Cadastro" : "Redefinição de Senha"}</h2>
    <p>Seu código de verificação é:</p>
    <div class="code">${code}</div>
    <p><strong>Este código expira em 10 minutos.</strong></p>
    <p>Se você não solicitou este código, ignore este email.</p>
    <div class="footer">
      <p>Atenciosamente,<br>Equipe MédicoHelp</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  if (config.type === "resend") {
    // Use Resend API (https://resend.com/docs/send-with-nodejs)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MédicoHelp <noreply@medicohelp.app>",
        to: [email],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao enviar email via Resend: ${error}`);
    }

    console.log(`Email sent to ${email} via Resend`);
  } else if (config.type === "smtp") {
    // Use SMTP
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    await transporter.sendMail({
      from: config.smtpFrom,
      to: email,
      subject,
      text,
      html,
    });

    console.log(`Email sent to ${email} via SMTP`);
  }
}

export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  return config.type !== "none";
}
