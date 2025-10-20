import { Router } from "express";
import { OpenAI } from "openai";
import { authMiddleware } from "../middleware/auth";
import { requireMedicalAccess, rateLimitMedicalTools, auditMedicalToolUsage } from "../middleware/medicalTools";
import { z } from "zod";

const router = Router();

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY not found. Medical tools will not work.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Helper function to get role-specific disclaimer
function getRoleSpecificDisclaimer(role: string): string {
  if (role === "medico") {
    return "Suporte à decisão clínica. Revise com julgamento médico.";
  } else if (role === "estudante") {
    return "Conteúdo para prática supervisionada. Não prescrever sem preceptor.";
  }
  return "Este conteúdo é apenas informativo.";
}

// Environment flags for medical tools
const MED_FULL_UNLOCK = process.env.MED_FULL_UNLOCK !== "false";
const POSO_MAX_DOSE_MULTIPLIER = parseFloat(process.env.POSO_MAX_DOSE_MULTIPLIER || "1.2");
const CALC_ENABLE = process.env.CALC_ENABLE 
  ? JSON.parse(process.env.CALC_ENABLE) 
  : ["alvarado", "curb65", "centor", "wells_dvt", "wells_pe", "perc", "chadsvasc", "qsofa"];

// ===== SCHEMAS =====

const posologiaSchema = z.object({
  principio_ativo: z.string().min(1, "Princípio ativo é obrigatório"),
  indicacao: z.string().min(1, "Indicação é obrigatória"),
  idade_anos: z.number().optional(),
  peso_kg: z.number().optional(),
  creatinina_clear_mlmin: z.number().optional(),
  gravidez: z.boolean().optional(),
  lactacao: z.boolean().optional(),
  alergias: z.array(z.string()).optional(),
});

const calculadoraSchema = z.object({
  variaveis: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

const condutaSchema = z.object({
  quadro: z.string().min(1, "Quadro clínico é obrigatório"),
  resumo: z.string().optional(),
});

const examesSchema = z.object({
  quadro: z.string().min(1, "Quadro clínico é obrigatório"),
});

const diferenciaisSchema = z.object({
  quadro: z.string().min(1, "Quadro clínico é obrigatório"),
});

// ===== ROUTE: POST /tools/posologia =====

router.post("/posologia", authMiddleware, requireMedicalAccess, rateLimitMedicalTools, async (req, res) => {
  const tool = "posologia";
  
  try {
    const data = posologiaSchema.parse(req.body);
    const { principio_ativo, indicacao, idade_anos, peso_kg, creatinina_clear_mlmin, gravidez, lactacao, alergias } = data;
    
    // Build payload summary for audit
    const payloadSummary = `${principio_ativo} para ${indicacao}`;
    
    // Safety guards
    const isPediatric = idade_anos !== undefined && idade_anos < 18;
    if (isPediatric && !peso_kg) {
      await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, payloadSummary, "fail");
      return res.status(400).json({
        error: "Dados insuficientes",
        message: "Para prescrição pediátrica, peso é obrigatório para cálculo de dose mg/kg"
      });
    }
    
    // Build AI prompt with enhanced safety warnings
    const prompt = `Você é um assistente médico especializado em posologia. Forneça informações de dosagem para:

**Medicamento:** ${principio_ativo}
**Indicação:** ${indicacao}
${idade_anos !== undefined ? `**Idade:** ${idade_anos} anos` : ''}
${peso_kg ? `**Peso:** ${peso_kg} kg` : ''}
${creatinina_clear_mlmin ? `**Clearance de Creatinina:** ${creatinina_clear_mlmin} mL/min` : ''}
${gravidez ? '**⚠️ GESTANTE: SIM - AVALIAR RISCO/BENEFÍCIO**' : ''}
${lactacao ? '**⚠️ LACTANTE: SIM - VERIFICAR SEGURANÇA NA AMAMENTAÇÃO**' : ''}
${alergias && alergias.length > 0 ? `**⚠️ ALERGIAS CONHECIDAS:** ${alergias.join(', ')}` : ''}

Retorne APENAS um JSON com:
{
  "esquemas": [
    {
      "via": "oral/IV/IM/etc",
      "dose": "dose específica",
      "frequencia": "intervalo",
      "duracao": "duração do tratamento"
    }
  ],
  "ajustes": {
    "renal": "ajuste se ClCr < 50",
    "hepatico": "ajuste se disfunção hepática",
    "pediatrico": "cálculo mg/kg se aplicável"
  },
  "alertas": [${gravidez ? '"⚠️ GRAVIDEZ: avaliar categoria de risco FDA/ANVISA", ' : ''}${lactacao ? '"⚠️ LACTAÇÃO: verificar compatibilidade com amamentação", ' : ''}${alergias && alergias.length > 0 ? '"⚠️ ALERGIAS: risco de reação cruzada", ' : ''}"alerta adicional se houver"],
  "contraindicacoes": ["CI1 se houver", "CI2"],
  "referencia": "Referência farmacológica breve"
}

${gravidez || lactacao ? '\n**ATENÇÃO ESPECIAL:** Droga em gestante/lactante requer avaliação criteriosa de risco-benefício.' : ''}
${alergias && alergias.length > 0 ? '\n**ATENÇÃO:** Paciente com alergias conhecidas - verificar reação cruzada.' : ''}

Seja OBJETIVO e SEGURO. Use doses da literatura médica brasileira (Bulário ANVISA, UpToDate).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um assistente médico especializado. Retorne sempre JSON válido e objetivo."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0].message.content || "{}";
    let result;
    
    try {
      result = JSON.parse(responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      result = { raw: responseText };
    }

    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, payloadSummary, "ok");
    
    res.json({
      success: true,
      data: result,
      disclaimer: getRoleSpecificDisclaimer(req.authUser!.role)
    });
    
  } catch (error: any) {
    console.error("[Posologia Error]", error);
    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, "error", "fail");
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    
    res.status(500).json({ error: "Erro ao consultar posologia" });
  }
});

// ===== ROUTE: POST /tools/calculadora/:nome =====

router.post("/calculadora/:nome", authMiddleware, requireMedicalAccess, rateLimitMedicalTools, async (req, res) => {
  const tool = "calculadora";
  const { nome } = req.params;
  
  try {
    if (!CALC_ENABLE.includes(nome.toLowerCase())) {
      return res.status(404).json({
        error: "Calculadora não disponível",
        message: `Calculadora '${nome}' não está habilitada. Disponíveis: ${CALC_ENABLE.join(', ')}`
      });
    }
    
    const data = calculadoraSchema.parse(req.body);
    const { variaveis } = data;
    
    const payloadSummary = `calculadora ${nome}`;
    
    // Build calculator prompt based on name
    const calcPrompts: Record<string, string> = {
      alvarado: "Calcule o score de Alvarado para apendicite aguda com as variáveis fornecidas. Retorne score numérico, classificação de risco (baixo/intermediário/alto) e interpretação.",
      curb65: "Calcule o score CURB-65 para pneumonia. Retorne score, mortalidade estimada e recomendação de local de tratamento.",
      centor: "Calcule o score de Centor/McIsaac para faringite estreptocócica. Retorne score e indicação de teste/antibiótico.",
      wells_dvt: "Calcule o score de Wells para TVP. Retorne score e probabilidade (improvável/provável).",
      wells_pe: "Calcule o score de Wells para embolia pulmonar. Retorne score e probabilidade.",
      perc: "Aplique os critérios PERC para embolia pulmonar. Retorne se pode excluir EP sem mais testes.",
      chadsvasc: "Calcule o score CHA2DS2-VASc para risco de AVC em FA. Retorne score e risco anual.",
      qsofa: "Calcule o qSOFA. Retorne score e se positivo (≥2) sugerindo sepse."
    };
    
    const promptTemplate = calcPrompts[nome.toLowerCase()] || "Calcule o score clínico solicitado.";
    
    const prompt = `${promptTemplate}

Variáveis fornecidas: ${JSON.stringify(variaveis)}

Retorne APENAS JSON:
{
  "score": número ou texto,
  "classificacao": "baixo/intermediário/alto risco" ou similar,
  "interpretacao": "interpretação clínica breve",
  "recomendacao": "conduta sugerida"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um assistente médico. Calcule scores clínicos com precisão. Retorne JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 800,
    });

    const responseText = completion.choices[0].message.content || "{}";
    let result;
    
    try {
      result = JSON.parse(responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      result = { raw: responseText };
    }

    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, payloadSummary, "ok");
    
    res.json({
      success: true,
      calculadora: nome,
      data: result,
      disclaimer: getRoleSpecificDisclaimer(req.authUser!.role)
    });
    
  } catch (error: any) {
    console.error("[Calculadora Error]", error);
    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, `calculadora ${nome}`, "fail");
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    
    res.status(500).json({ error: "Erro ao calcular score" });
  }
});

// ===== ROUTE: POST /tools/conduta =====

router.post("/conduta", authMiddleware, requireMedicalAccess, rateLimitMedicalTools, async (req, res) => {
  const tool = "conduta";
  
  try {
    const data = condutaSchema.parse(req.body);
    const { quadro, resumo } = data;
    
    const payloadSummary = `conduta para ${quadro.substring(0, 50)}`;
    
    const prompt = `Você é um médico assistente. Sugira uma conduta clínica objetiva para:

**Quadro:** ${quadro}
${resumo ? `**Resumo adicional:** ${resumo}` : ''}

Retorne APENAS JSON:
{
  "conduta_imediata": ["ação1", "ação2"],
  "investigacao": ["exame1", "exame2"],
  "tratamento_inicial": ["medida1", "medida2"],
  "criterios_internacao": ["critério1", "critério2"] ou null,
  "observacoes": "observações importantes"
}

NÃO inclua prescrições detalhadas. Apenas orientações gerais. Lembre que cada serviço tem seu protocolo local.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um médico assistente. Forneça condutas objetivas sem substituir protocolos locais."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const responseText = completion.choices[0].message.content || "{}";
    let result;
    
    try {
      result = JSON.parse(responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      result = { raw: responseText };
    }

    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, payloadSummary, "ok");
    
    res.json({
      success: true,
      data: result,
      disclaimer: getRoleSpecificDisclaimer(req.authUser!.role)
    });
    
  } catch (error: any) {
    console.error("[Conduta Error]", error);
    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, "error", "fail");
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    
    res.status(500).json({ error: "Erro ao gerar conduta" });
  }
});

// ===== ROUTE: POST /tools/exames/pedir =====

router.post("/exames/pedir", authMiddleware, requireMedicalAccess, rateLimitMedicalTools, async (req, res) => {
  const tool = "exames";
  
  try {
    const data = examesSchema.parse(req.body);
    const { quadro } = data;
    
    const payloadSummary = `exames para ${quadro.substring(0, 50)}`;
    
    const prompt = `Você é um médico assistente. Sugira exames complementares para investigação de:

**Quadro:** ${quadro}

Retorne APENAS JSON:
{
  "exames_iniciais": [
    {
      "exame": "nome do exame",
      "justificativa": "por que solicitar"
    }
  ],
  "exames_especializados": [
    {
      "exame": "nome",
      "quando": "situação em que solicitar"
    }
  ],
  "observacoes": "observações sobre timing, urgência, etc"
}

Seja criterioso. Sugira apenas exames com boa relação custo-benefício.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um médico assistente. Sugira exames de forma criteriosa e baseada em evidências."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const responseText = completion.choices[0].message.content || "{}";
    let result;
    
    try {
      result = JSON.parse(responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      result = { raw: responseText };
    }

    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, payloadSummary, "ok");
    
    res.json({
      success: true,
      data: result,
      disclaimer: getRoleSpecificDisclaimer(req.authUser!.role)
    });
    
  } catch (error: any) {
    console.error("[Exames Error]", error);
    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, "error", "fail");
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    
    res.status(500).json({ error: "Erro ao sugerir exames" });
  }
});

// ===== ROUTE: POST /tools/diferenciais =====

router.post("/diferenciais", authMiddleware, requireMedicalAccess, rateLimitMedicalTools, async (req, res) => {
  const tool = "diferenciais";
  
  try {
    const data = diferenciaisSchema.parse(req.body);
    const { quadro } = data;
    
    const payloadSummary = `diferenciais para ${quadro.substring(0, 50)}`;
    
    const prompt = `Você é um médico assistente. Liste os principais diagnósticos diferenciais para:

**Quadro:** ${quadro}

Retorne APENAS JSON:
{
  "diferenciais": [
    {
      "diagnostico": "nome da doença",
      "probabilidade": "alta/média/baixa",
      "pontos_chave": ["característica1", "característica2"],
      "red_flags": ["sinal de alerta1", "sinal de alerta2"] ou []
    }
  ],
  "diagnostico_mais_provavel": "nome",
  "proximos_passos": "sugestão de investigação"
}

Liste no máximo 5 diagnósticos diferenciais, ordenados por probabilidade.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um médico assistente. Forneça diagnósticos diferenciais baseados em raciocínio clínico."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0].message.content || "{}";
    let result;
    
    try {
      result = JSON.parse(responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      result = { raw: responseText };
    }

    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, payloadSummary, "ok");
    
    res.json({
      success: true,
      data: result,
      disclaimer: getRoleSpecificDisclaimer(req.authUser!.role)
    });
    
  } catch (error: any) {
    console.error("[Diferenciais Error]", error);
    await auditMedicalToolUsage(req.authUser!.userId, req.authUser!.role, tool, "error", "fail");
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    
    res.status(500).json({ error: "Erro ao gerar diferenciais" });
  }
});

export default router;
