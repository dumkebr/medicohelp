export type InputType = "boolean" | "number" | "select" | "date";

export interface CalculatorInput {
  key: string;
  label: string;
  type: InputType;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  options?: { value: string | number; label: string }[];
}

export interface InterpretationRange {
  range: [number, number] | "all";
  text: string;
  severity?: "low" | "moderate" | "high" | "info";
}

export interface CalculatorResult {
  score?: number;
  value?: string | number;
  interpretation: string;
  severity?: "low" | "moderate" | "high" | "info";
  details?: Record<string, any>;
}

export interface CalculatorSchema {
  id: string;
  name: string;
  group: "Clínico" | "Obstetrícia";
  description: string;
  inputs: CalculatorInput[];
  compute: (values: Record<string, any>) => CalculatorResult;
  refs: string[];
}

// Helper functions
function sumBooleans(values: Record<string, any>, keys: string[]): number {
  return keys.reduce((sum, key) => sum + (values[key] ? 1 : 0), 0);
}

function getInterpretation(
  score: number,
  ranges: InterpretationRange[]
): { text: string; severity?: string } {
  const range = ranges.find((r) =>
    r.range === "all" ? true : score >= r.range[0] && score <= r.range[1]
  );
  return { text: range?.text || "", severity: range?.severity };
}

// ============= CLINICAL CALCULATORS =============

// 1. CURB-65
const curb65: CalculatorSchema = {
  id: "curb65",
  name: "CURB-65 (Pneumonia)",
  group: "Clínico",
  description: "Avaliação de gravidade em pneumonia comunitária",
  inputs: [
    { key: "confusion", label: "Confusão mental", type: "boolean", required: true },
    { key: "urea", label: "Ureia > 7 mmol/L (ou BUN > 20 mg/dL)", type: "boolean", required: true, hint: "Avaliar função renal" },
    { key: "resp_rate", label: "Frequência respiratória ≥ 30 irpm", type: "boolean", required: true },
    { key: "bp", label: "PAS < 90 mmHg ou PAD ≤ 60 mmHg", type: "boolean", required: true },
    { key: "age65", label: "Idade ≥ 65 anos", type: "boolean", required: true },
  ],
  compute: (values) => {
    const score = sumBooleans(values, ["confusion", "urea", "resp_rate", "bp", "age65"]);
    const ranges: InterpretationRange[] = [
      { range: [0, 1], text: "Risco baixo - Considerar tratamento ambulatorial", severity: "low" },
      { range: [2, 2], text: "Risco moderado - Considerar internação ou observação hospitalar", severity: "moderate" },
      { range: [3, 5], text: "Risco alto - Internação; avaliar necessidade de UTI", severity: "high" },
    ];
    const interp = getInterpretation(score, ranges);
    return {
      score,
      interpretation: interp.text,
      severity: interp.severity as any,
    };
  },
  refs: ["Lim WS et al. Thorax 2003;58(5):377-82"],
};

// 2. Alvarado (Apendicite)
const alvarado: CalculatorSchema = {
  id: "alvarado",
  name: "Escore de Alvarado (Apendicite)",
  group: "Clínico",
  description: "Probabilidade de apendicite aguda",
  inputs: [
    { key: "dolor_migratoria", label: "Dor migratória para FID", type: "boolean", required: true },
    { key: "anorexia", label: "Anorexia", type: "boolean", required: true },
    { key: "nausea", label: "Náusea/Vômito", type: "boolean", required: true },
    { key: "dor_fid", label: "Dor à palpação em FID", type: "boolean", required: true },
    { key: "descompressao", label: "Dor à descompressão", type: "boolean", required: true },
    { key: "febre", label: "Febre > 37.3°C", type: "boolean", required: true },
    { key: "leucocitose", label: "Leucocitose > 10.000/mm³", type: "boolean", required: true },
    { key: "desvio", label: "Desvio à esquerda (neutrofilia)", type: "boolean", required: true },
  ],
  compute: (values) => {
    let score = 0;
    if (values.dolor_migratoria) score += 1;
    if (values.anorexia) score += 1;
    if (values.nausea) score += 1;
    if (values.dor_fid) score += 2;
    if (values.descompressao) score += 1;
    if (values.febre) score += 1;
    if (values.leucocitose) score += 2;
    if (values.desvio) score += 1;

    const ranges: InterpretationRange[] = [
      { range: [0, 4], text: "Risco baixo de apendicite - Considerar diagnósticos alternativos", severity: "low" },
      { range: [5, 6], text: "Apendicite compatível - Observação e reavaliação; considerar exames de imagem", severity: "moderate" },
      { range: [7, 10], text: "Apendicite provável - Forte indicação cirúrgica", severity: "high" },
    ];
    const interp = getInterpretation(score, ranges);
    return {
      score,
      interpretation: interp.text,
      severity: interp.severity as any,
    };
  },
  refs: ["Alvarado A. Ann Emerg Med 1986;15(5):557-64"],
};

// 3. Wells TVP
const wellsTVP: CalculatorSchema = {
  id: "wells_tvp",
  name: "Escore de Wells para TVP",
  group: "Clínico",
  description: "Probabilidade clínica de trombose venosa profunda",
  inputs: [
    { key: "cancer", label: "Câncer ativo", type: "boolean", required: true },
    { key: "paralisia", label: "Paralisia/paresia ou imobilização de MMII", type: "boolean", required: true },
    { key: "acamado", label: "Acamado > 3 dias ou cirurgia < 12 semanas", type: "boolean", required: true },
    { key: "dor_trajeto", label: "Dor localizada no trajeto do sistema venoso profundo", type: "boolean", required: true },
    { key: "edema_toda_perna", label: "Edema de toda a perna", type: "boolean", required: true },
    { key: "panturrilha", label: "Edema de panturrilha > 3 cm (comparado com lado oposto)", type: "boolean", required: true },
    { key: "cacifo", label: "Edema com cacifo (maior no lado sintomático)", type: "boolean", required: true },
    { key: "colaterais", label: "Veias colaterais superficiais", type: "boolean", required: true },
    { key: "tvp_previa", label: "TVP prévia documentada", type: "boolean", required: true },
    { key: "diagnostico_alternativo", label: "Diagnóstico alternativo tão provável quanto TVP?", type: "boolean", required: true, hint: "Se SIM, subtrai 2 pontos" },
  ],
  compute: (values) => {
    let score = 0;
    if (values.cancer) score += 1;
    if (values.paralisia) score += 1;
    if (values.acamado) score += 1;
    if (values.dor_trajeto) score += 1;
    if (values.edema_toda_perna) score += 1;
    if (values.panturrilha) score += 1;
    if (values.cacifo) score += 1;
    if (values.colaterais) score += 1;
    if (values.tvp_previa) score += 1;
    if (values.diagnostico_alternativo) score -= 2;

    const ranges: InterpretationRange[] = [
      { range: [-2, 0], text: "Probabilidade baixa de TVP - D-dímero; se negativo, exclui TVP", severity: "low" },
      { range: [1, 2], text: "Probabilidade moderada - D-dímero ou ultrassom doppler", severity: "moderate" },
      { range: [3, 9], text: "Probabilidade alta - Ultrassom doppler indicado", severity: "high" },
    ];
    const interp = getInterpretation(score, ranges);
    return {
      score,
      interpretation: interp.text,
      severity: interp.severity as any,
    };
  },
  refs: ["Wells PS et al. Lancet 1997;350(9094):1795-8"],
};

// 4. Wells TEP (Embolia Pulmonar)
const wellsTEP: CalculatorSchema = {
  id: "wells_tep",
  name: "Escore de Wells para TEP",
  group: "Clínico",
  description: "Probabilidade clínica de embolia pulmonar",
  inputs: [
    { key: "tvp_sinais", label: "Sinais clínicos de TVP", type: "boolean", required: true, hint: "Edema, dor em membro inferior" },
    { key: "tep_mais_provavel", label: "TEP é o diagnóstico mais provável", type: "boolean", required: true, hint: "Ou igualmente provável" },
    { key: "fc", label: "FC > 100 bpm", type: "boolean", required: true },
    { key: "imobilizacao", label: "Imobilização/cirurgia nas últimas 4 semanas", type: "boolean", required: true },
    { key: "tep_tvp_previa", label: "TVP ou TEP prévia", type: "boolean", required: true },
    { key: "hemoptise", label: "Hemoptise", type: "boolean", required: true },
    { key: "cancer", label: "Câncer ativo", type: "boolean", required: true },
  ],
  compute: (values) => {
    let score = 0;
    if (values.tvp_sinais) score += 3;
    if (values.tep_mais_provavel) score += 3;
    if (values.fc) score += 1.5;
    if (values.imobilizacao) score += 1.5;
    if (values.tep_tvp_previa) score += 1.5;
    if (values.hemoptise) score += 1;
    if (values.cancer) score += 1;

    let interpretation = "";
    let severity: "low" | "moderate" | "high" = "low";

    if (score <= 4) {
      interpretation = "Probabilidade baixa de TEP - D-dímero; se negativo, exclui TEP";
      severity = "low";
    } else if (score <= 6) {
      interpretation = "Probabilidade moderada - D-dímero ou angioTC";
      severity = "moderate";
    } else {
      interpretation = "Probabilidade alta - AngioTC indicada";
      severity = "high";
    }

    return { score, interpretation, severity };
  },
  refs: ["Wells PS et al. Thromb Haemost 2000;83(3):416-20"],
};

// 5. CHA2DS2-VASc
const chadsvasc: CalculatorSchema = {
  id: "chadsvasc",
  name: "CHA₂DS₂-VASc",
  group: "Clínico",
  description: "Risco de AVC em fibrilação atrial",
  inputs: [
    { key: "icc", label: "ICC ou disfunção ventricular", type: "boolean", required: true },
    { key: "has", label: "Hipertensão arterial", type: "boolean", required: true },
    { key: "idade", label: "Idade", type: "select", required: true, options: [
      { value: 0, label: "< 65 anos" },
      { value: 1, label: "65-74 anos" },
      { value: 2, label: "≥ 75 anos" },
    ]},
    { key: "diabetes", label: "Diabetes mellitus", type: "boolean", required: true },
    { key: "avc_previo", label: "AVC/AIT/tromboembolismo prévio", type: "boolean", required: true },
    { key: "vascular", label: "Doença vascular (IAM prévio, DAP, placa aórtica)", type: "boolean", required: true },
    { key: "sexo", label: "Sexo feminino", type: "boolean", required: true },
  ],
  compute: (values) => {
    let score = 0;
    if (values.icc) score += 1;
    if (values.has) score += 1;
    score += Number(values.idade) || 0;
    if (values.diabetes) score += 1;
    if (values.avc_previo) score += 2;
    if (values.vascular) score += 1;
    if (values.sexo) score += 1;

    let interpretation = "";
    let severity: "low" | "moderate" | "high" = "low";

    if (score === 0) {
      interpretation = "Risco anual de AVC: ~0%. Anticoagulação geralmente não indicada.";
      severity = "low";
    } else if (score === 1) {
      const sexo = values.sexo;
      if (sexo && score === 1) {
        interpretation = "Risco anual de AVC: ~0%. Considerar não anticoagular (apenas se pontuação = sexo feminino).";
        severity = "low";
      } else {
        interpretation = "Risco anual de AVC: ~1.3%. Considerar anticoagulação.";
        severity = "moderate";
      }
    } else if (score === 2) {
      interpretation = "Risco anual de AVC: ~2.2%. Anticoagulação recomendada.";
      severity = "moderate";
    } else {
      interpretation = `Risco anual de AVC: ${score >= 9 ? '>15' : '~' + (score * 2.2).toFixed(1)}%. Anticoagulação fortemente recomendada.`;
      severity = "high";
    }

    return { score, interpretation, severity };
  },
  refs: ["Lip GYH et al. Chest 2010;137(2):263-72"],
};

// 6. HAS-BLED
const hasbled: CalculatorSchema = {
  id: "hasbled",
  name: "HAS-BLED",
  group: "Clínico",
  description: "Risco de sangramento em anticoagulação",
  inputs: [
    { key: "has", label: "Hipertensão (PAS > 160 mmHg)", type: "boolean", required: true },
    { key: "renal", label: "Disfunção renal (diálise, transplante, Cr > 2.3)", type: "boolean", required: true },
    { key: "hepatica", label: "Disfunção hepática (cirrose, bili > 2x, AST/ALT > 3x)", type: "boolean", required: true },
    { key: "avc", label: "AVC prévio", type: "boolean", required: true },
    { key: "sangramento", label: "Sangramento prévio ou predisposição", type: "boolean", required: true },
    { key: "inr_labil", label: "INR lábil (< 60% do tempo no alvo)", type: "boolean", required: true },
    { key: "idoso", label: "Idade > 65 anos", type: "boolean", required: true },
    { key: "drogas", label: "Drogas (antiagregantes, AINEs) ou álcool", type: "boolean", required: true },
  ],
  compute: (values) => {
    const score = sumBooleans(values, ["has", "renal", "hepatica", "avc", "sangramento", "inr_labil", "idoso", "drogas"]);

    const ranges: InterpretationRange[] = [
      { range: [0, 2], text: "Risco baixo de sangramento maior (~1-2%/ano). Anticoagulação geralmente segura.", severity: "low" },
      { range: [3, 4], text: "Risco moderado de sangramento maior (~3-8%/ano). Precaução; reavaliar fatores modificáveis.", severity: "moderate" },
      { range: [5, 9], text: "Risco alto de sangramento maior (>8%/ano). Considerar alternativas ou monitoramento intensivo.", severity: "high" },
    ];
    const interp = getInterpretation(score, ranges);
    return { score, interpretation: interp.text, severity: interp.severity as any };
  },
  refs: ["Pisters R et al. Chest 2010;138(5):1093-100"],
};

// 7. qSOFA
const qsofa: CalculatorSchema = {
  id: "qsofa",
  name: "qSOFA (Quick SOFA)",
  group: "Clínico",
  description: "Triagem rápida de disfunção orgânica em sepse",
  inputs: [
    { key: "fr", label: "Frequência respiratória ≥ 22 irpm", type: "boolean", required: true },
    { key: "pas", label: "PAS ≤ 100 mmHg", type: "boolean", required: true },
    { key: "consciencia", label: "Alteração do nível de consciência (Glasgow < 15)", type: "boolean", required: true },
  ],
  compute: (values) => {
    const score = sumBooleans(values, ["fr", "pas", "consciencia"]);

    const ranges: InterpretationRange[] = [
      { range: [0, 1], text: "qSOFA negativo - Risco baixo de disfunção orgânica. Monitorar evolução.", severity: "low" },
      { range: [2, 3], text: "qSOFA positivo (≥ 2) - Risco aumentado de morte e internação prolongada. Avaliar SOFA completo e considerar UTI.", severity: "high" },
    ];
    const interp = getInterpretation(score, ranges);
    return { score, interpretation: interp.text, severity: interp.severity as any };
  },
  refs: ["Singer M et al. JAMA 2016;315(8):801-10"],
};

// 8. SIRS
const sirs: CalculatorSchema = {
  id: "sirs",
  name: "SIRS (Síndrome da Resposta Inflamatória Sistêmica)",
  group: "Clínico",
  description: "Critérios para SIRS",
  inputs: [
    { key: "temp", label: "Temperatura > 38°C ou < 36°C", type: "boolean", required: true },
    { key: "fc", label: "FC > 90 bpm", type: "boolean", required: true },
    { key: "fr", label: "FR > 20 irpm ou PaCO₂ < 32 mmHg", type: "boolean", required: true },
    { key: "leuco", label: "Leucócitos > 12.000 ou < 4.000/mm³ ou > 10% bastões", type: "boolean", required: true },
  ],
  compute: (values) => {
    const score = sumBooleans(values, ["temp", "fc", "fr", "leuco"]);

    let interpretation = "";
    let severity: "low" | "moderate" | "high" | "info" = "info";

    if (score < 2) {
      interpretation = "SIRS ausente (< 2 critérios).";
      severity = "low";
    } else {
      interpretation = `SIRS presente (${score} critérios). Investigar infecção → sepse.`;
      severity = score >= 3 ? "high" : "moderate";
    }

    return { score, interpretation, severity };
  },
  refs: ["Bone RC et al. Chest 1992;101(6):1644-55"],
};

// 9. Glasgow Coma Scale (GCS)
const gcs: CalculatorSchema = {
  id: "gcs",
  name: "Escala de Coma de Glasgow (GCS)",
  group: "Clínico",
  description: "Avaliação do nível de consciência",
  inputs: [
    {
      key: "ocular",
      label: "Abertura Ocular",
      type: "select",
      required: true,
      options: [
        { value: 4, label: "Espontânea (4)" },
        { value: 3, label: "Ao comando verbal (3)" },
        { value: 2, label: "À dor (2)" },
        { value: 1, label: "Nenhuma (1)" },
      ],
    },
    {
      key: "verbal",
      label: "Resposta Verbal",
      type: "select",
      required: true,
      options: [
        { value: 5, label: "Orientado (5)" },
        { value: 4, label: "Confuso (4)" },
        { value: 3, label: "Palavras inapropriadas (3)" },
        { value: 2, label: "Sons incompreensíveis (2)" },
        { value: 1, label: "Nenhuma (1)" },
      ],
    },
    {
      key: "motora",
      label: "Resposta Motora",
      type: "select",
      required: true,
      options: [
        { value: 6, label: "Obedece comandos (6)" },
        { value: 5, label: "Localiza dor (5)" },
        { value: 4, label: "Retirada à dor (4)" },
        { value: 3, label: "Flexão anormal - decorticação (3)" },
        { value: 2, label: "Extensão anormal - descerebração (2)" },
        { value: 1, label: "Nenhuma (1)" },
      ],
    },
  ],
  compute: (values) => {
    const ocular = Number(values.ocular) || 1;
    const verbal = Number(values.verbal) || 1;
    const motora = Number(values.motora) || 1;
    const score = ocular + verbal + motora;

    let interpretation = "";
    let severity: "low" | "moderate" | "high" = "high";

    if (score >= 14) {
      interpretation = "Trauma craniano leve (GCS 14-15)";
      severity = "low";
    } else if (score >= 9) {
      interpretation = "Trauma craniano moderado (GCS 9-13)";
      severity = "moderate";
    } else {
      interpretation = "Trauma craniano grave (GCS 3-8) - Considerar via aérea definitiva";
      severity = "high";
    }

    return {
      score,
      interpretation,
      severity,
      details: { ocular, verbal, motora },
    };
  },
  refs: ["Teasdale G, Jennett B. Lancet 1974;2(7872):81-4"],
};

// 10. IMC
const imc: CalculatorSchema = {
  id: "imc",
  name: "IMC (Índice de Massa Corporal)",
  group: "Clínico",
  description: "Classificação nutricional em adultos",
  inputs: [
    { key: "peso", label: "Peso (kg)", type: "number", required: true, min: 20, max: 300, step: 0.1 },
    { key: "altura", label: "Altura (m)", type: "number", required: true, min: 0.5, max: 2.5, step: 0.01, hint: "Ex: 1.75" },
  ],
  compute: (values) => {
    const peso = Number(values.peso);
    const altura = Number(values.altura);
    if (!peso || !altura || altura <= 0) {
      return { interpretation: "Dados inválidos", severity: "info" };
    }

    const imc = peso / (altura * altura);
    let interpretation = "";
    let severity: "low" | "moderate" | "high" | "info" = "info";

    if (imc < 18.5) {
      interpretation = "Baixo peso";
      severity = "moderate";
    } else if (imc < 25) {
      interpretation = "Peso normal";
      severity = "low";
    } else if (imc < 30) {
      interpretation = "Sobrepeso";
      severity = "moderate";
    } else if (imc < 35) {
      interpretation = "Obesidade grau I";
      severity = "moderate";
    } else if (imc < 40) {
      interpretation = "Obesidade grau II";
      severity = "high";
    } else {
      interpretation = "Obesidade grau III (mórbida)";
      severity = "high";
    }

    return {
      score: Math.round(imc * 10) / 10,
      value: imc.toFixed(1),
      interpretation,
      severity,
    };
  },
  refs: ["WHO. Physical status: the use of and interpretation of anthropometry. WHO Technical Report Series 854. Geneva: WHO, 1995"],
};

// ============= OBSTETRIC CALCULATORS =============

// Helper for date calculations
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString + 'T00:00:00'); // Force local timezone at midnight
  return isNaN(date.getTime()) ? null : date;
}

function daysBetween(date1: Date, date2: Date): number {
  const ms = date2.getTime() - date1.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

function weeksAndDays(totalDays: number): { weeks: number; days: number } {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days };
}

function getTrimester(weeks: number): string {
  if (weeks < 14) return "1º trimestre";
  if (weeks < 28) return "2º trimestre";
  return "3º trimestre";
}

// 1. Idade Gestacional por DUM
const igPorDUM: CalculatorSchema = {
  id: "ig_dum",
  name: "Idade Gestacional por DUM",
  group: "Obstetrícia",
  description: "Calcula IG e DPP a partir da última menstruação",
  inputs: [
    { key: "lmp_date", label: "DUM (primeiro dia da última menstruação)", type: "date", required: true },
  ],
  compute: (values) => {
    const lmpDate = parseDate(values.lmp_date);
    if (!lmpDate) {
      return {
        interpretation: "Data inválida. Por favor, insira uma data válida.",
        severity: "info",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lmpDate > today) {
      return {
        interpretation: "DUM não pode ser uma data futura",
        severity: "info",
      };
    }

    const gaDays = daysBetween(lmpDate, today);
    const { weeks, days } = weeksAndDays(gaDays);
    const edd = addDays(lmpDate, 280); // Regra de Näegele
    const trimester = getTrimester(weeks);

    let notes = "";
    if (weeks > 42) {
      notes = "IG > 42 semanas. Verificar DUM ou considerar USG para datação.";
    } else if (weeks < 5) {
      notes = "IG muito precoce. Considerar USG para confirmação.";
    } else {
      notes = "Se DUM incerta, priorize USG do 1º trimestre para datar.";
    }

    const interpretation = `IG: ${weeks} semanas + ${days} dias\nDPP: ${formatDate(edd)}\nTrimestre: ${trimester}\n\n${notes}`;

    return {
      interpretation,
      severity: "info",
      details: {
        weeks,
        days,
        edd: formatDate(edd),
        trimester,
        notes,
      },
    };
  },
  refs: ["ACOG Practice Bulletin No. 229: Antepartum Fetal Surveillance. Obstet Gynecol 2021;137:e116-27"],
};

// 2. Idade Gestacional por DPP
const igPorDPP: CalculatorSchema = {
  id: "ig_dpp",
  name: "Idade Gestacional por DPP",
  group: "Obstetrícia",
  description: "Calcula IG e DUM estimada a partir da data provável do parto",
  inputs: [
    { key: "edd", label: "Data Provável do Parto (DPP)", type: "date", required: true },
  ],
  compute: (values) => {
    const edd = parseDate(values.edd);
    if (!edd) {
      return {
        interpretation: "Data inválida. Por favor, insira uma data válida.",
        severity: "info",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validações
    const daysDiff = daysBetween(today, edd);
    if (daysDiff < -21 || daysDiff > 301) {
      return {
        interpretation: "DPP inconsistente com data atual. Verifique os dados.",
        severity: "info",
      };
    }

    const lmpEst = addDays(edd, -280);
    const gaDays = daysBetween(lmpEst, today);
    const { weeks, days } = weeksAndDays(gaDays);
    const trimester = getTrimester(weeks);

    const interpretation = `IG: ${weeks} semanas + ${days} dias\nDUM estimada: ${formatDate(lmpEst)}\nDPP: ${formatDate(edd)}\nTrimestre: ${trimester}`;

    return {
      interpretation,
      severity: "info",
      details: {
        weeks,
        days,
        lmpEst: formatDate(lmpEst),
        edd: formatDate(edd),
        trimester,
      },
    };
  },
  refs: ["ACOG Practice Bulletin No. 229: Antepartum Fetal Surveillance. Obstet Gynecol 2021;137:e116-27"],
};

// 3. Idade Gestacional por USG prévia
const igPorUSG: CalculatorSchema = {
  id: "ig_usg",
  name: "Idade Gestacional por USG Prévia",
  group: "Obstetrícia",
  description: "Calcula IG atual e DPP a partir de USG anterior",
  inputs: [
    { key: "usg_date", label: "Data do exame de USG", type: "date", required: true },
    { key: "usg_ga_weeks", label: "IG no USG (semanas)", type: "number", required: true, min: 0, max: 42, step: 1 },
    { key: "usg_ga_days", label: "IG no USG (dias)", type: "number", required: true, min: 0, max: 6, step: 1 },
  ],
  compute: (values) => {
    const usgDate = parseDate(values.usg_date);
    if (!usgDate) {
      return {
        interpretation: "Data inválida. Por favor, insira uma data válida.",
        severity: "info",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (usgDate > today) {
      return {
        interpretation: "Data do USG não pode ser futura",
        severity: "info",
      };
    }

    const usgWeeks = Number(values.usg_ga_weeks) || 0;
    const usgDays = Number(values.usg_ga_days) || 0;
    const usgGaDaysTotal = usgWeeks * 7 + usgDays;

    if (usgGaDaysTotal > 294 || usgGaDaysTotal < 0) {
      return {
        interpretation: "IG do USG inválida (deve estar entre 0 e 42 semanas)",
        severity: "info",
      };
    }

    const daysSinceUSG = daysBetween(usgDate, today);
    const todayGaDays = usgGaDaysTotal + daysSinceUSG;
    const { weeks, days } = weeksAndDays(todayGaDays);
    const eddByUSG = addDays(today, 280 - todayGaDays);
    const trimester = getTrimester(weeks);

    const interpretation = `IG hoje: ${weeks} semanas + ${days} dias\nDPP estimada por USG: ${formatDate(eddByUSG)}\nTrimestre: ${trimester}\n\nDica: USG do 1º trimestre é o método mais preciso para datação.`;

    return {
      interpretation,
      severity: "info",
      details: {
        weeks,
        days,
        edd: formatDate(eddByUSG),
        trimester,
      },
    };
  },
  refs: ["ACOG Practice Bulletin No. 229: Antepartum Fetal Surveillance. Obstet Gynecol 2021;137:e116-27", "WHO recommendations on antenatal care for a positive pregnancy experience. Geneva: WHO; 2016"],
};

// Export all calculators
export const CLINICAL_CALCULATORS: CalculatorSchema[] = [
  curb65,
  alvarado,
  wellsTVP,
  wellsTEP,
  chadsvasc,
  hasbled,
  qsofa,
  sirs,
  gcs,
  imc,
];

export const OBSTETRIC_CALCULATORS: CalculatorSchema[] = [
  igPorDUM,
  igPorDPP,
  igPorUSG,
];

export const ALL_CALCULATORS: CalculatorSchema[] = [
  ...CLINICAL_CALCULATORS,
  ...OBSTETRIC_CALCULATORS,
];
