import { apiRequest } from "./queryClient";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "medico" | "estudante";
  crm?: string;
  uf?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "medico" | "estudante";
    crm?: string;
    uf?: string;
  };
}

export interface RequestCodeData {
  purpose: "signup" | "reset";
  channel: "email" | "sms";
  email?: string;
  phone?: string;
}

export interface VerifyCodeData {
  purpose: "signup" | "reset";
  email?: string;
  phone?: string;
  code: string;
}

export interface ResetPasswordData {
  newPassword: string;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await apiRequest("POST", "/auth/login", credentials);
  return res.json();
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await apiRequest("POST", "/auth/register", data);
  return res.json();
}

export async function requestCode(data: RequestCodeData): Promise<{ message: string; channel: string }> {
  const res = await apiRequest("POST", "/auth/request-code", data);
  return res.json();
}

export async function verifyCode(data: VerifyCodeData): Promise<AuthResponse> {
  const res = await apiRequest("POST", "/auth/verify-code", data);
  return res.json();
}

export async function forgotPassword(email: string): Promise<{ message: string; channel: string }> {
  const res = await apiRequest("POST", "/auth/forgot-password", { email });
  return res.json();
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch("/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
}
