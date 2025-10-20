import { isEmailConfigured } from "../services/email";
import { isSmsConfigured } from "../services/sms";

export function printVerificationInfo(baseUrl: string = "http://localhost:5000") {
  const emailEnabled = isEmailConfigured();
  const smsEnabled = isSmsConfigured();

  if (!emailEnabled && !smsEnabled) {
    console.log("\n❌ VERIFICATION CODES NOT CONFIGURED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Configure email or SMS to enable verification codes:");
    console.log("\n📧 Email (choose one):");
    console.log("  • Resend: Set RESEND_API_KEY");
    console.log("  • SMTP: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM");
    console.log("\n📱 SMS:");
    console.log("  • Twilio: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  console.log("\n✅ VERIFICATION CODES ENABLED");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const channels: string[] = [];
  if (emailEnabled) channels.push("email");
  if (smsEnabled) channels.push("sms");
  
  console.log(`📡 Enabled channels: ${channels.join(", ")}`);
  console.log("\n📝 Sample Requests:\n");

  if (emailEnabled) {
    console.log("1️⃣  Request Code (Email - Signup):");
    console.log(`curl -X POST ${baseUrl}/auth/request-code \\
  -H "Content-Type: application/json" \\
  -d '{
    "purpose": "signup",
    "channel": "email",
    "email": "user@example.com"
  }'`);
    console.log("");
  }

  if (smsEnabled) {
    console.log("1️⃣  Request Code (SMS - Signup):");
    console.log(`curl -X POST ${baseUrl}/auth/request-code \\
  -H "Content-Type: application/json" \\
  -d '{
    "purpose": "signup",
    "channel": "sms",
    "phone": "+5511999999999"
  }'`);
    console.log("");
  }

  console.log("2️⃣  Verify Code (Auto-login on signup):");
  console.log(`curl -X POST ${baseUrl}/auth/verify-code \\
  -H "Content-Type: application/json" \\
  -d '{
    "purpose": "signup",
    "email": "user@example.com",
    "code": "123456"
  }'`);
  console.log("");

  console.log("3️⃣  Forgot Password:");
  console.log(`curl -X POST ${baseUrl}/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com"
  }'`);
  console.log("");

  console.log("4️⃣  Reset Password (with reset token):");
  console.log(`curl -X POST ${baseUrl}/auth/reset-password \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <reset_token_from_step_2>" \\
  -d '{
    "newPassword": "newSecurePassword123"
  }'`);
  console.log("");

  console.log("⚙️  Rate Limits:");
  console.log("  • /auth/request-code: 10 requests/hour per IP");
  console.log("  • /auth/verify-code: 30 requests/hour per IP");
  console.log("\n🔒 Code Rules:");
  console.log("  • 6 digits, TTL=10min, one-time use");
  console.log("  • Cooldown: 60s between requests");
  console.log("  • Max 5 requests/day/user/purpose");
  console.log("  • Max 6 attempts per code");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
