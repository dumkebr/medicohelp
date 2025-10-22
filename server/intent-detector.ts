/**
 * Intent Detection System - Motor Único do MédicoHelp
 * 
 * Pipeline: Entrada → Normaliza → Router → Template → Resposta
 */

export type IntentType = 
  | "score"           // Calculadoras (Alvarado, CURB-65, etc)
  | "protocolo"       // Protocolos/Conduta (dor torácica, sepse, etc)
  | "posologia"       // Prescrição/Posologia
  | "documento"       // Documentos clínicos (prontuário, atestado, etc)
  | "explicacao"      // Explicação + Evidências
  | "administrativo"  // Salvar, renomear, buscar
  | "utilitario"      // Interpretar exame, comparar, etc
  | "unknown";        // Não identificado

export interface IntentMatch {
  type: IntentType;
  slug: string;
  canonical: string;
  confidence: number;
  extractedData?: Record<string, any>;
}

interface IntentEntry {
  type: IntentType;
  slug: string;
  canonical: string;
  keywords: string[];
  context?: string[];
  priority?: number; // Para resolver conflitos
}

// Léxico médico expandido
const INTENT_LEXICON: IntentEntry[] = [
  // ============ SCORES/CALCULADORAS ============
  {
    type: "score",
    slug: "alvarado",
    canonical: "Escala de Alvarado (apendicite)",
    keywords: ["alvarado", "alvorado", "alvorada", "alvaro", "apendicite"],
    priority: 10
  },
  {
    type: "score",
    slug: "curb65",
    canonical: "CURB-65 (pneumonia)",
    keywords: ["curb", "curb-65", "curb65", "pneumonia"],
    priority: 10
  },
  {
    type: "score",
    slug: "glasgow",
    canonical: "Glasgow Coma Scale",
    keywords: ["glasgow", "gcs", "coma", "consciencia"],
    priority: 10
  },
  {
    type: "score",
    slug: "wells-tvp",
    canonical: "Wells Score (TVP)",
    keywords: ["wells", "tvp", "trombose venosa"],
    context: ["tvp", "trombose", "membro"],
    priority: 9
  },
  {
    type: "score",
    slug: "wells-tep",
    canonical: "Wells Score (TEP)",
    keywords: ["wells", "tep", "embolia pulmonar"],
    context: ["tep", "embolia", "dispneia"],
    priority: 9
  },
  {
    type: "score",
    slug: "cha2ds2vasc",
    canonical: "CHA₂DS₂-VASc",
    keywords: ["cha2ds2", "chads", "chavas", "fibrilacao atrial", "avc"],
    priority: 10
  },
  
  // ============ PROTOCOLOS/CONDUTA ============
  {
    type: "protocolo",
    slug: "dor-toracica",
    canonical: "Protocolo de Dor Torácica",
    keywords: ["dor toracica", "precordial", "anginosa", "sindrome coronariana"],
    priority: 8
  },
  {
    type: "protocolo",
    slug: "dispneia",
    canonical: "Protocolo de Dispneia",
    keywords: ["dispneia", "falta de ar", "insuficiencia respiratoria"],
    priority: 8
  },
  {
    type: "protocolo",
    slug: "sepse",
    canonical: "Protocolo de Sepse",
    keywords: ["sepse", "choque septico", "bundle", "lactato"],
    priority: 9
  },
  {
    type: "protocolo",
    slug: "pcr",
    canonical: "Protocolo de PCR/ACLS",
    keywords: ["pcr", "parada", "acls", "reanimacao", "rcp"],
    priority: 10
  },
  {
    type: "protocolo",
    slug: "ave",
    canonical: "Protocolo de AVE",
    keywords: ["ave", "avc", "ictus", "stroke", "trombolise"],
    priority: 10
  },
  
  // ============ POSOLOGIA/PRESCRIÇÃO ============
  {
    type: "posologia",
    slug: "antibiotico",
    canonical: "Posologia de Antibiótico",
    keywords: ["antibiotico", "posologia", "dose", "prescrever"],
    context: ["amoxicilina", "azitromicina", "ceftriaxona", "ciprofloxacino"],
    priority: 7
  },
  {
    type: "posologia",
    slug: "analgesia",
    canonical: "Posologia de Analgésico",
    keywords: ["analgesia", "dor", "dipirona", "paracetamol", "tramadol"],
    priority: 7
  },
  
  // ============ DOCUMENTO CLÍNICO ============
  {
    type: "documento",
    slug: "prontuario",
    canonical: "Prontuário/Evolução",
    keywords: ["prontuario", "evolucao", "soap", "historia clinica"],
    priority: 8
  },
  {
    type: "documento",
    slug: "atestado",
    canonical: "Atestado Médico",
    keywords: ["atestado", "afastamento", "ateste"],
    priority: 9
  },
  {
    type: "documento",
    slug: "encaminhamento",
    canonical: "Encaminhamento",
    keywords: ["encaminhamento", "referencia", "encaminhar"],
    priority: 8
  },
  
  // ============ ADMINISTRATIVO ============
  {
    type: "administrativo",
    slug: "salvar",
    canonical: "Salvar Atendimento",
    keywords: ["salvar", "salve", "guardar"],
    priority: 10
  },
  {
    type: "administrativo",
    slug: "renomear",
    canonical: "Renomear Atendimento",
    keywords: ["renomear", "renomeie", "mudar nome"],
    priority: 10
  },
  {
    type: "administrativo",
    slug: "buscar",
    canonical: "Buscar Atendimento",
    keywords: ["buscar", "procurar", "encontrar"],
    context: ["atendimento", "paciente", "consulta"],
    priority: 9
  },
  
  // ============ UTILITÁRIOS ============
  {
    type: "utilitario",
    slug: "interpretar-exame",
    canonical: "Interpretar Exame",
    keywords: ["interpretar", "resultado", "exame", "laboratorio"],
    priority: 7
  },
  {
    type: "utilitario",
    slug: "comparar",
    canonical: "Comparar Exames",
    keywords: ["comparar", "diferenca", "evolucao"],
    context: ["exame", "usg", "tomografia"],
    priority: 7
  },
];

/**
 * Normaliza texto removendo acentos e caracteres especiais
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Indicadores contextuais que aumentam confiança
 */
const CONTEXT_INDICATORS: Record<IntentType, string[]> = {
  score: ["escala", "score", "escore", "indice", "calcular", "quanto da"],
  protocolo: ["protocolo", "conduta", "manejo", "abordagem", "tratamento"],
  posologia: ["dose", "posologia", "prescrever", "receitar", "quanto dar"],
  documento: ["fazer", "gerar", "preencher", "escrever"],
  explicacao: ["explica", "o que e", "como funciona", "por que", "fundamento"],
  administrativo: ["salvar", "renomear", "buscar", "listar"],
  utilitario: ["interpretar", "analisar", "comparar", "sumario"],
  unknown: [], // Sem indicadores para unknown
};

/**
 * Detecta a intenção do usuário
 */
export function detectIntent(userMessage: string): IntentMatch {
  const normalized = normalizeText(userMessage);
  
  let bestMatch: IntentMatch | null = null;
  let highestScore = 0;

  for (const entry of INTENT_LEXICON) {
    let score = 0;

    // 1. Match por keywords (peso 10)
    for (const keyword of entry.keywords) {
      if (normalized.includes(normalizeText(keyword))) {
        score += 10;
      }
    }

    // 2. Match por contexto (peso 5)
    if (entry.context) {
      for (const ctx of entry.context) {
        if (normalized.includes(normalizeText(ctx))) {
          score += 5;
        }
      }
    }

    // 3. Indicadores contextuais do tipo (peso 3)
    const indicators = CONTEXT_INDICATORS[entry.type] || [];
    for (const indicator of indicators) {
      if (normalized.includes(normalizeText(indicator))) {
        score += 3;
      }
    }

    // 4. Prioridade da entrada (peso 1x)
    score += (entry.priority || 0);

    // Atualizar melhor match
    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        type: entry.type,
        slug: entry.slug,
        canonical: entry.canonical,
        confidence: score,
      };
    }
  }

  // Se não encontrou nada ou confiança muito baixa → unknown
  if (!bestMatch || highestScore < 8) {
    return {
      type: "unknown",
      slug: "unknown",
      canonical: "Intenção não identificada",
      confidence: 0,
    };
  }

  return bestMatch;
}

/**
 * Extrai dados estruturados da mensagem (para uso futuro)
 */
export function extractData(userMessage: string, intent: IntentMatch): Record<string, any> {
  const data: Record<string, any> = {};

  // Extração básica de números (para scores)
  if (intent.type === "score") {
    const numbers = userMessage.match(/\d+/g);
    if (numbers) {
      data.numbers = numbers.map(n => parseInt(n));
    }
  }

  return data;
}
