// /api/medicohelp.ts
// Endpoint universal: funciona como handler para Next.js (pages/app) ou como middleware de Express.
// POST JSON: { text: string, mode: "clinico" | "explicativo", name?: string, stream?: boolean }

import type { NextApiRequest, NextApiResponse } from "next";
import type { Request, Response } from "express";
import { askMedicoHelp, streamMedicoHelp } from "../lib/medicohelpAI";

type AnyReq = (NextApiRequest | Request) & { body?: any };
type AnyRes = (NextApiResponse | Response) & { };

export default async function medicohelpHandler(req: AnyReq, res: AnyRes) {
  try {
    const method = (req as any).method ?? "POST";
    if (method !== "POST") {
      (res as any).status(405).json?.({ error: "Method not allowed" }) ?? (res as any).end("Method not allowed");
      return;
    }

    const { text, mode = "clinico", name = "", stream = true } = (req as any).body ?? {};

    if (!text || typeof text !== "string") {
      (res as any).status(400).json?.({ error: "Missing 'text' string" }) ?? (res as any).end("Bad Request");
      return;
    }

    // Streaming (Server-Sent Chunks simples)
    if (stream) {
      (res as any).setHeader?.("Content-Type", "text/plain; charset=utf-8");
      (res as any).setHeader?.("Transfer-Encoding", "chunked");
      for await (const chunk of streamMedicoHelp(text, { mode, nomeMedico: name })) {
        (res as any).write?.(chunk);
      }
      (res as any).end?.();
      return;
    }

    // Sem streaming
    const out = await askMedicoHelp(text, { mode, nomeMedico: name });
    (res as any).status?.(200).json?.({ text: out }) ?? (res as any).end(out);
  } catch (e: any) {
    const msg = e?.message ?? "Internal error";
    try {
      (res as any).status?.(500).json?.({ error: msg }) ?? (res as any).end(msg);
    } catch {
      // ignore
    }
  }
}

// ===== Express helper (caso use servidor próprio) =====
export function mountMedicoHelpRoute(app: any, path = "/api/medicohelp") {
  app.post(path, async (req: any, res: any) => medicohelpHandler(req, res));
}
