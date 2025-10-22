/**
 * Clinical Score Detector
 * 
 * Detecta quando o usuário está perguntando sobre escalas/scores clínicos
 * e retorna sugestão estruturada para usar a calculadora apropriada.
 */

export interface ClinicalScoreMatch {
  scoreId: string;
  scoreName: string;
  description: string;
  suggestion: string;
}

// Mapeamento de termos → escalas clínicas
const CLINICAL_SCORES = [
  {
    id: "alvarado",
    name: "Escala de Alvarado",
    keywords: ["alvarado", "alvorado", "alvorada", "alvaro"],
    context: ["apendicite", "apêndice", "dor abdominal"],
    description: "Escala de Alvarado para avaliação de apendicite aguda",
    suggestion: "Vamos calcular o Escore de Alvarado. Preciso que você me informe:\n\n1️⃣ **Sintomas:**\n   • Migração da dor para FID?\n   • Anorexia (perda de apetite)?\n   • Náuseas ou vômitos?\n\n2️⃣ **Sinais:**\n   • Sensibilidade em FID?\n   • Dor à descompressão (Blumberg +)?\n   • Temperatura axilar ≥37,5°C?\n\n3️⃣ **Laboratório:**\n   • Leucocitose >10.000/mm³?\n   • Desvio à esquerda (≥75% neutrófilos)?\n\nPara facilitar, você pode clicar em **Calculadoras** → **Escore de Alvarado** no menu acima."
  },
  {
    id: "curb65",
    name: "CURB-65",
    keywords: ["curb", "curb65", "curb-65", "pneumonia"],
    context: ["pneumonia", "pnm", "infecção respiratória", "gravidade"],
    description: "Score de gravidade para pneumonia comunitária",
    suggestion: "Vamos calcular o CURB-65 para avaliar a gravidade da pneumonia. Preciso dos seguintes dados:\n\n• **C**onfusão mental (novo ou agudo)?\n• **U**reia >50 mg/dL (ou >7 mmol/L)?\n• Frequência **R**espiratória ≥30 irpm?\n• **B**lood Pressure: PAS <90 mmHg ou PAD ≤60 mmHg?\n• Idade ≥**65** anos?\n\nPara facilitar o cálculo, use **Calculadoras** → **CURB-65** no menu acima."
  },
  {
    id: "wells-tvp",
    name: "Wells Score (TVP)",
    keywords: ["wells", "tvp", "trombose", "venosa", "profunda"],
    context: ["tvp", "trombose", "edema", "membro inferior"],
    description: "Escore de Wells para probabilidade de TVP",
    suggestion: "Vamos calcular o Escore de Wells para TVP. Vou precisar avaliar os seguintes critérios:\n\n• Câncer ativo?\n• Paralisia/imobilização de MMII?\n• Restrição ao leito ≥3 dias ou cirurgia nas últimas 4 semanas?\n• Sensibilidade ao longo do sistema venoso profundo?\n• Edema de toda a perna?\n• Edema de panturrilha >3cm comparado ao lado oposto?\n• Cacifo?\n• Veias colaterais superficiais?\n• Diagnóstico alternativo mais provável que TVP?\n\nAcesse **Calculadoras** → **Wells Score (TVP)** para calcular rapidamente."
  },
  {
    id: "wells-tep",
    name: "Wells Score (TEP)",
    keywords: ["tep", "embolia", "pulmonar", "wells tep"],
    context: ["tep", "embolia", "dispneia", "taquicardia"],
    description: "Escore de Wells para probabilidade de TEP",
    suggestion: "Vamos calcular o Escore de Wells para TEP. Critérios a avaliar:\n\n• Sinais clínicos de TVP?\n• FC >100 bpm?\n• Imobilização ≥3 dias ou cirurgia nas últimas 4 semanas?\n• TVP ou TEP prévio?\n• Hemoptise?\n• Câncer ativo?\n• TEP é o diagnóstico mais provável?\n\nPara cálculo rápido: **Calculadoras** → **Wells Score (TEP)**"
  },
  {
    id: "cha2ds2vasc",
    name: "CHA₂DS₂-VASc",
    keywords: ["cha2ds2", "chads", "chavas", "fibrilação", "atrial", "avc"],
    context: ["fibrilação atrial", "fa", "anticoagulação", "avc"],
    description: "Escore de risco de AVC em fibrilação atrial",
    suggestion: "Vamos calcular o CHA₂DS₂-VASc para estratificação de risco de AVC:\n\n• **C**IC/Disfunção VE?\n• **H**ipertensão?\n• **A**ge (idade): ≥75 anos = 2 pts, 65-74 = 1 pt\n• **D**iabetes?\n• **S**troke/AIT/tromboembolismo prévio = 2 pts\n• **V**ascular disease (IAM, DAP, placa aórtica)?\n• Sexo feminino (**Sc**)?\n\nAcesse **Calculadoras** → **CHA₂DS₂-VASc** para calcular."
  },
  {
    id: "hasbled",
    name: "HAS-BLED",
    keywords: ["hasbled", "has-bled", "sangramento", "anticoagulação"],
    context: ["sangramento", "anticoagulação", "warfarin", "doac"],
    description: "Escore de risco de sangramento em anticoagulação",
    suggestion: "Vamos calcular o HAS-BLED para risco de sangramento:\n\n• **H**ipertensão (PAS >160 mmHg)?\n• **A**bnormal renal/liver function?\n• **S**troke prévio?\n• **B**leeding (sangramento prévio ou predisposição)?\n• **L**abile INR (se em warfarin)?\n• **E**lderly (idade >65 anos)?\n• **D**rugs (AINE/antiagregante) ou álcool?\n\nAcesse **Calculadoras** → **HAS-BLED**"
  },
  {
    id: "qsofa",
    name: "qSOFA",
    keywords: ["qsofa", "quick sofa", "sepse", "sepsis"],
    context: ["sepse", "infecção", "choque", "disfunção orgânica"],
    description: "Quick SOFA para rastreio de sepse",
    suggestion: "Vamos calcular o qSOFA (quick SOFA):\n\n• FR ≥22 irpm?\n• Alteração do nível de consciência (Glasgow <15)?\n• PAS ≤100 mmHg?\n\n**Interpretação:** ≥2 critérios = alto risco de sepse/má evolução\n\nAcesse **Calculadoras** → **qSOFA**"
  },
  {
    id: "sirs",
    name: "SIRS",
    keywords: ["sirs", "resposta inflamatória", "sistêmica"],
    context: ["infecção", "inflamação", "febre", "leucocitose"],
    description: "Critérios de SIRS (Síndrome da Resposta Inflamatória Sistêmica)",
    suggestion: "Vamos avaliar os critérios de SIRS:\n\n• Temperatura: >38°C ou <36°C?\n• FC >90 bpm?\n• FR >20 irpm ou PaCO₂ <32 mmHg?\n• Leucócitos: >12.000 ou <4.000/mm³, ou >10% bastões?\n\n**SIRS:** ≥2 critérios presentes\n\nAcesse **Calculadoras** → **SIRS**"
  },
  {
    id: "glasgow",
    name: "Escala de Glasgow (GCS)",
    keywords: ["glasgow", "gcs", "coma", "consciência", "rebaixamento"],
    context: ["consciência", "coma", "tce", "rebaixamento", "neurológico"],
    description: "Escala de Coma de Glasgow",
    suggestion: "Vamos calcular a Escala de Coma de Glasgow (GCS):\n\n**Abertura Ocular (1-4):**\n4 = espontânea, 3 = à voz, 2 = à dor, 1 = ausente\n\n**Resposta Verbal (1-5):**\n5 = orientado, 4 = confuso, 3 = palavras, 2 = sons, 1 = ausente\n\n**Resposta Motora (1-6):**\n6 = obedece, 5 = localiza dor, 4 = retirada, 3 = flexão anormal, 2 = extensão, 1 = ausente\n\nAcesse **Calculadoras** → **Escala de Glasgow**"
  },
  {
    id: "bishop",
    name: "Escore de Bishop",
    keywords: ["bishop", "indução", "parto", "colo", "cérvix"],
    context: ["indução", "parto", "trabalho de parto", "gestante"],
    description: "Escore de Bishop para avaliação pré-indução do parto",
    suggestion: "Vamos calcular o Escore de Bishop para avaliar condições para indução:\n\n• **Dilatação** cervical (0-3 pts)\n• **Esvaecimento** cervical (0-3 pts)\n• **Consistência** do colo (0-2 pts)\n• **Posição** do colo (0-2 pts)\n• **Altura** da apresentação (-3 a +2 pts)\n\n**Interpretação:** ≥8 pontos = condições favoráveis para indução\n\nAcesse **Calculadoras** → **Escore de Bishop**"
  },
  {
    id: "apgar",
    name: "Escore de Apgar",
    keywords: ["apgar", "recém-nascido", "rn", "vitalidade"],
    context: ["recém-nascido", "parto", "vitalidade", "reanimação"],
    description: "Escore de Apgar para vitalidade do recém-nascido",
    suggestion: "Vamos calcular o Escore de Apgar (avaliar no 1º e 5º minuto):\n\n• **A**parência (coloração): 0-2\n• **P**ulso (FC): 0-2\n• **G**rimace (reflexos): 0-2\n• **A**tividade (tônus): 0-2\n• **R**espiração: 0-2\n\n**Total:** 0-10 pontos\n\nAcesse **Calculadoras** → **Escore de Apgar**"
  },
  {
    id: "gasometria",
    name: "Gasometria Arterial/Venosa",
    keywords: ["gasometria", "gaso", "ph", "pco2", "po2", "hco3", "bicarbonato"],
    context: ["acidose", "alcalose", "distúrbio ácido-base", "insuficiência respiratória"],
    description: "Interpretação de gasometria arterial ou venosa",
    suggestion: "Vamos interpretar a gasometria. Preciso dos seguintes valores:\n\n**Arterial:**\n• pH, PaCO₂, PaO₂, HCO₃⁻, BE\n• Opcional: albumina, lactato\n\n**Venosa:**\n• pH, PvCO₂, HCO₃⁻, BE\n\nO sistema calculará automaticamente:\n• Distúrbio ácido-base primário\n• Compensação\n• Anion gap (com correção por albumina)\n• Gradiente A-a\n• Relação PaO₂/FiO₂\n\nAcesse **Calculadoras** → **Gasometria**"
  },
  {
    id: "imc",
    name: "IMC",
    keywords: ["imc", "índice de massa", "obesidade", "sobrepeso"],
    context: ["obesidade", "peso", "nutricional", "estado nutricional"],
    description: "Índice de Massa Corporal",
    suggestion: "Vamos calcular o IMC:\n\n• **Peso** (kg)\n• **Altura** (m)\n\n**IMC = Peso / Altura²**\n\nInterpretação automática segundo OMS.\n\nAcesse **Calculadoras** → **IMC**"
  },
  {
    id: "ig-dum",
    name: "Idade Gestacional (DUM)",
    keywords: ["ig", "idade gestacional", "dum", "dpp", "gestação"],
    context: ["gestante", "pré-natal", "idade gestacional", "semanas"],
    description: "Cálculo de idade gestacional e data provável do parto",
    suggestion: "Vamos calcular a idade gestacional:\n\n**Método 1:** Pela DUM (data da última menstruação)\n**Método 2:** Pela DPP (data provável do parto)\n**Método 3:** Por USG (informar IG e data do exame)\n\nAcesse **Calculadoras** → **Idade Gestacional**"
  },
];

// Palavras-chave que indicam busca por escala/score
const SCALE_INDICATORS = [
  "escala", "score", "escore", "índice", "classificação",
  "critério", "critérios", "cálculo", "calcular", "quanto dá",
  "como calcular", "qual o score", "qual a escala"
];

/**
 * Normaliza texto removendo acentos e convertendo para lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
}

/**
 * Verifica se o texto contém indicadores de busca por escala
 */
function hasScaleIndicators(text: string): boolean {
  const normalized = normalizeText(text);
  return SCALE_INDICATORS.some(indicator => 
    normalized.includes(normalizeText(indicator))
  );
}

/**
 * Detecta se o usuário está perguntando sobre alguma escala/score clínico
 * @returns Match da escala ou null
 */
export function detectClinicalScore(userMessage: string): ClinicalScoreMatch | null {
  const normalized = normalizeText(userMessage);
  const hasIndicator = hasScaleIndicators(userMessage);

  // Buscar match por keywords
  for (const score of CLINICAL_SCORES) {
    // Verificar keywords principais
    const keywordMatch = score.keywords.some(keyword =>
      normalized.includes(normalizeText(keyword))
    );

    if (keywordMatch) {
      // Se tem indicador de escala OU contexto médico, retorna match
      const contextMatch = score.context.some(ctx =>
        normalized.includes(normalizeText(ctx))
      );

      if (hasIndicator || contextMatch) {
        return {
          scoreId: score.id,
          scoreName: score.name,
          description: score.description,
          suggestion: score.suggestion,
        };
      }
    }
  }

  return null;
}

/**
 * Gera resposta estruturada quando detecta uma escala clínica
 */
export function generateScoreResponse(match: ClinicalScoreMatch): string {
  return `🎯 **${match.scoreName}**\n\n${match.suggestion}`;
}
