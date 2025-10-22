// Análise de Gasometria Arterial/Venosa
// Utilidades
const round = (v: number, n = 1) => (isFinite(v) ? Number(v.toFixed(n)) : null);
const asNumber = (x: any) => (x === "" || x == null ? null : Number(x));

function calcAG({ Na, Cl, HCO3, K = null }: { Na: number | null; Cl: number | null; HCO3: number | null; K?: number | null }) {
  if (Na == null || Cl == null || HCO3 == null) return { AG: null };
  const ag = (Na + (K ?? 0)) - (Cl + HCO3);
  return { AG: round(ag, 1) };
}

function correctAGforAlbumin(AG: number | null, albumin: number | null) {
  if (AG == null || albumin == null) return null;
  return round(AG + 2.5 * (4 - albumin), 1);
}

function winters(HCO3: number | null) {
  if (HCO3 == null) return null;
  const low = 1.5 * HCO3 + 8 - 2;
  const mid = 1.5 * HCO3 + 8;
  const high = 1.5 * HCO3 + 8 + 2;
  return { low: round(low), mid: round(mid), high: round(high) };
}

function expectedPaCO2MetAlk(HCO3: number | null) {
  if (HCO3 == null) return null;
  const mid = 0.7 * HCO3 + 20;
  return { low: round(mid - 5), mid: round(mid), high: round(mid + 5) };
}

function expHCO3RespAcid(PaCO2: number | null, chronic = false) {
  if (PaCO2 == null) return null;
  const delta = PaCO2 - 40;
  const per10 = chronic ? 3.5 : 1.0;
  return round(24 + (delta / 10) * per10, 1);
}

function expHCO3RespAlk(PaCO2: number | null, chronic = false) {
  if (PaCO2 == null) return null;
  const delta = 40 - PaCO2;
  const per10 = chronic ? 4.5 : 2.0;
  return round(24 - (delta / 10) * per10, 1);
}

function alveolarPAO2(PaCO2: number | null, FiO2 = 0.21, PB = 760, PH2O = 47, R = 0.8) {
  if (PaCO2 == null || FiO2 == null) return null;
  return round(FiO2 * (PB - PH2O) - PaCO2 / R, 1);
}

function AaGradient(PaO2: number | null, PaCO2: number | null, FiO2 = 0.21) {
  if (PaO2 == null || PaCO2 == null || FiO2 == null) return { PAO2: null, Aagrad: null };
  const PAO2 = alveolarPAO2(PaCO2, FiO2);
  return { PAO2, Aagrad: PAO2 != null ? round(PAO2 - PaO2, 1) : null };
}

function normalAaByAge(age: number | null) { 
  return age != null ? round(age / 4 + 4, 0) : null; 
}

function pao2FiO2(PaO2: number | null, FiO2: number | null) {
  if (PaO2 == null || FiO2 == null || FiO2 === 0) return null;
  return round(PaO2 / FiO2, 0);
}

// Conversões venosa → arterial (aproximação)
function venousToArterial({ pH_v, PvCO2 }: { pH_v: number | null; PvCO2: number | null }) {
  const pH_a = pH_v != null ? round(pH_v + 0.03, 2) : null;
  const PaCO2 = PvCO2 != null ? round(PvCO2 - 5, 0) : null;
  return { pH_a, PaCO2 };
}

export interface GasometriaInput {
  arterial?: boolean;
  pH?: number | null;
  PaCO2?: number | null;
  HCO3?: number | null;
  Na?: number | null;
  Cl?: number | null;
  K?: number | null;
  albumin?: number | null;
  PaO2?: number | null;
  FiO2?: number | null;
  age?: number | null;
  pH_v?: number | null;
  PvCO2?: number | null;
}

export interface GasometriaResult {
  primary: string | null;
  AG: number | null;
  AGcorr: number | null;
  deltaRatio: number | null;
  compensation: any;
  oxygenation: any;
  text: string;
}

export function analyzeGas({
  arterial = true,
  pH, PaCO2, HCO3, Na, Cl, K, albumin, PaO2, FiO2, age,
  pH_v, PvCO2
}: GasometriaInput): GasometriaResult {
  // Ajuste venoso se necessário
  if (!arterial) {
    const conv = venousToArterial({ pH_v: pH_v ?? null, PvCO2: PvCO2 ?? null });
    pH = pH ?? conv.pH_a;
    PaCO2 = PaCO2 ?? conv.PaCO2;
  }

  // Cálculos básicos
  const { AG } = calcAG({ Na: Na ?? null, Cl: Cl ?? null, HCO3: HCO3 ?? null, K: K ?? null });
  const AGcorr = correctAGforAlbumin(AG, albumin ?? null);
  const acidemia = pH != null && pH < 7.35;
  const alcalemia = pH != null && pH > 7.45;

  let prim: string | null = null;
  if (pH != null && PaCO2 != null && HCO3 != null) {
    if (acidemia) prim = (HCO3 < 22) ? "acidose metabólica" : (PaCO2 > 45 ? "acidose respiratória" : "indefinido");
    if (alcalemia) prim = (HCO3 > 26) ? "alcalose metabólica" : (PaCO2 < 35 ? "alcalose respiratória" : "indefinido");
  }

  // Compensações
  const aux: any = {};
  if (prim === "acidose metabólica") aux.win = winters(HCO3 ?? null);
  if (prim === "alcalose metabólica") aux.metAlk = expectedPaCO2MetAlk(HCO3 ?? null);
  if (prim === "acidose respiratória") { 
    aux.hco3AcidAg = expHCO3RespAcid(PaCO2 ?? null, false); 
    aux.hco3AcidCh = expHCO3RespAcid(PaCO2 ?? null, true); 
  }
  if (prim === "alcalose respiratória") { 
    aux.hco3AlkAg = expHCO3RespAlk(PaCO2 ?? null, false); 
    aux.hco3AlkCh = expHCO3RespAlk(PaCO2 ?? null, true); 
  }

  // Delta/Delta (se AG alto)
  let deltaRatio: number | null = null;
  if (AGcorr != null && AGcorr > 12 && HCO3 != null) {
    const dAG = AGcorr - 12;
    const dHCO3 = 24 - HCO3;
    if (dHCO3 !== 0) deltaRatio = round(dAG / dHCO3, 2);
  }

  // Oxigenação (só arterial)
  let oxi: any = {};
  if (arterial && PaO2 != null && FiO2 != null) {
    oxi = AaGradient(PaO2, PaCO2 ?? null, FiO2);
    oxi.PF = pao2FiO2(PaO2, FiO2);
    oxi.AaNormalEst = normalAaByAge(age ?? null);
  }

  // Texto corrido (igual a conversa)
  const partes = [];
  if (pH != null) partes.push(`pH ${pH}`);
  if (PaCO2 != null) partes.push(`PaCO₂ ${PaCO2} mmHg`);
  if (HCO3 != null) partes.push(`HCO₃⁻ ${HCO3} mEq/L`);
  if (AG != null) partes.push(`AG ${AG}` + (AGcorr != null ? ` (corrigido ${AGcorr})` : ""));

  let texto = `Gasometria ${arterial ? "arterial" : "venosa (convertida)"}: ${partes.join(", ")}. `;
  if (prim) texto += `Quadro primário sugere ${prim}. `;
  if (aux.win) texto += `Compensação esperada (Winter) para acidose metabólica: PaCO₂ ~ ${aux.win.mid} mmHg (faixa ${aux.win.low}-${aux.win.high}). `;
  if (aux.metAlk) texto += `Em alcalose metabólica, PaCO₂ esperada ~ ${aux.metAlk.mid} mmHg (±5). `;
  if (aux.hco3AcidAg) texto += `Acidose respiratória: HCO₃⁻ esperado agudo ${aux.hco3AcidAg} vs crônico ${aux.hco3AcidCh}. `;
  if (aux.hco3AlkAg) texto += `Alcalose respiratória: HCO₃⁻ esperado agudo ${aux.hco3AlkAg} vs crônico ${aux.hco3AlkCh}. `;
  if (deltaRatio != null) texto += `Δ/Δ = ${deltaRatio} (avaliar distúrbio misto se muito <0,4 ou >2). `;
  if (arterial && oxi.PAO2 != null) {
    texto += `PAO₂ ${oxi.PAO2} mmHg, gradiente A–a ${oxi.Aagrad} mmHg` +
             (oxi.AaNormalEst != null ? ` (normal ~${oxi.AaNormalEst}). ` : ". ");
    if (oxi.PF != null) texto += `PaO₂/FiO₂ ${oxi.PF}. `;
  }

  texto += "Conteúdo de apoio clínico. Validação e responsabilidade: médico usuário.";

  return {
    primary: prim,
    AG, 
    AGcorr, 
    deltaRatio,
    compensation: aux,
    oxygenation: oxi,
    text: texto
  };
}
