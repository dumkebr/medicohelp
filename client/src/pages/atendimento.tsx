import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Paperclip, Loader2, FileImage, X, Save, Brain, ExternalLink, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FileAttachment, Patient, ScientificReference } from "@shared/schema";
import TopControls from "@/components/TopControls";
import ChatComposer from "@/components/ChatComposer";
import { useAuth } from "@/lib/auth";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  getCurrentId,
  getAtendimento,
  addMensagem,
  renameAtendimento,
  assignPatient,
  updateMode,
  createAtendimento,
  setSaved,
  type Atendimento as AtendimentoType,
  type Mensagem
} from "@/lib/atendimentos";
import { SessionAPI } from "@/lib/chatSessions";

// ========================= PERSONALIZAÇÃO DO MÉDICO =========================
interface MedicoInfo {
  nome: string;
  especialidade?: string;
  estilo?: string;
}

function getMedicoFromStorage(): MedicoInfo {
  if (typeof window === "undefined") {
    return { nome: "Dr. Médic(o)a" };
  }

  // Tentar localStorage primeiro
  const raw = localStorage.getItem("medicohelp_user");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const nome = parsed?.nome || parsed?.name || parsed?.displayName;
      if (nome) {
        return { 
          nome: nome.toString().startsWith("Dr") ? nome : `Dr. ${nome}`,
          especialidade: parsed?.especialidade,
          estilo: parsed?.estilo
        };
      }
    } catch {}
  }

  return { nome: "Dr. Médic(o)a" };
}

function firstName(full: string): string {
  const clean = full.replace(/^Dr\.?\s*/i, "").trim();
  return clean.split(" ")[0] || clean;
}

function buildSaudacao(medico: MedicoInfo): string {
  const nomeCurto = firstName(medico.nome);
  return `Beleza, ${nomeCurto}. Vamos direto ao ponto:`;
}

// ========================= CLAIRTON STYLE SYSTEM =========================
// Sistema de detecção local de cenários clínicos - "Estilo Clairton"
// Formato estruturado: 🩺 Diagnóstico ⚡ Conduta 🧪 Investigação 💬 Alertas

const SECTION = {
  DX: "🩺 Diagnóstico provável",
  CONDUTA: "⚡ Conduta imediata",
  EXAMES: "🧪 Investigação complementar",
  ALERTAS: "💬 Observações / alertas",
} as const;

interface LocalReply {
  title?: string;
  body: string;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const hasAny = (text: string, keys: string[]) => keys.some(k => text.includes(k));

function needsVitals(userText: string) {
  const t = norm(userText);
  const lacksPA = !/(\bpa\b|pressao|mmhg)/.test(t);
  const lacksFC = !/(\bfc\b|frequencia cardiaca|batimento)/.test(t);
  const lacksSat = !/(satur(a|)cao|sat\b|o2|oxigen)/.test(t);
  const lacksT = !/(\bt\b|temperatura|febre)/.test(t);
  return { lacksPA, lacksFC, lacksSat, lacksT };
}

function vitalPrompt(userText: string): string | undefined {
  const v = needsVitals(userText);
  const ask: string[] = [];
  if (v.lacksPA) ask.push("PA (mmHg)");
  if (v.lacksFC) ask.push("FC (bpm)");
  if (v.lacksSat) ask.push("Saturação (%)");
  if (v.lacksT) ask.push("Temperatura (°C)");
  if (ask.length === 0) return undefined;
  return `Me passa ${ask.join(", ")} pra eu ajustar dose/conduta com segurança.`;
}

function baseFrame(dx: string[], conduta: string[], exames: string[], alertas: string[]): string {
  return [
    `**${SECTION.DX}:**\n${dx.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`,
    `**${SECTION.CONDUTA}:**\n${conduta.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`,
    `**${SECTION.EXAMES}:**\n${exames.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`,
    alertas.length
      ? `**${SECTION.ALERTAS}:**\n${alertas.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// ---------- IAM / Dor torácica ----------
function handleACS(text: string): LocalReply {
  const t = norm(text);
  const inferior = hasAny(t, ["d2", "d3", "avf", "parede inferior", "iam inferior"]);
  const suspeitaVD = inferior;
  const dx = [
    inferior
      ? "IAM com supra de ST em parede inferior (D2, D3, aVF)."
      : "SCA — avaliar ECG para STEMI/NSTEMI e diagnósticos diferenciais.",
  ];

  const conduta = [
    "Monitorização, acesso venoso, analgesia. O₂ se Sat < 94%.",
    "AAS 300 mg VO mastigado (se não usou antes).",
    "Segundo antiplaquetário: Clopidogrel 300–600 mg VO ou Ticagrelor 180 mg VO.",
    "Anticoagulação: Heparina não fracionada 60 U/kg EV (máx 4.000 U) ou Enoxaparina 1 mg/kg SC.",
    suspeitaVD
      ? "⚠️ Evita nitrato até excluir infarto de VD (fazer derivações direitas V3R–V4R)."
      : "Nitrato SL se dor e PA > 100x60, sem sinais de choque/VD.",
    "Morfina 2–4 mg EV se dor refratária (cautela em hipotensão).",
    "Atorvastatina 80 mg VO o quanto antes.",
    "Acionar hemodinâmica para angioplastia primária (ideal < 120 min). Se indisponível, considerar trombólise conforme protocolo local.",
  ];

  const exames = [
    "ECG seriado a cada 15–30 min.",
    "Troponina/CK-MB, hemograma, eletrólitos, função renal, glicemia.",
    "RX tórax conforme quadro.",
  ];

  const alertas = [
    "Se suspeita de VD: evitar nitrato e usar volume (SF 0,9% 300–500 mL) se hipotenso.",
    "Bradicardia/bloqueio AV em inferior: avaliar atropina se repercussão.",
  ];

  const ask = vitalPrompt(text);
  if (ask) alertas.unshift(ask);
  return { title: "SCA / IAM", body: baseFrame(dx, conduta, exames, alertas) };
}

// ---------- Crise convulsiva ----------
function handleSeizure(text: string): LocalReply {
  const dx = [
    "Crise convulsiva ativa ou pós-ictal — estabilizar via aérea, ventilação e circulação.",
  ];
  const conduta = [
    "Monitorização, acesso venoso, proteção de vias aéreas.",
    "Glicemia capilar — se <60 mg/dL: glicose EV conforme protocolo.",
    "Benzodiazepínico: Diazepam 0,15–0,2 mg/kg EV (máx 10 mg) ou Midazolam 10 mg IM/IN se sem acesso.",
    "Se persistir >5 min: repetir; considerar Levetiracetam / Valproato / Fenitoína conforme disponibilidade.",
  ];
  const exames = [
    "Eletrolitos, função renal/hepática, hemograma, toxicológico conforme suspeita.",
    "TC de crânio se primeira crise, déficit focal, trauma, uso de anticoagulante, febre alta, imunossupressão.",
  ];
  const alertas = [
    "Investigar infecção SNC, abstinência, erro de dose, gestação (eclâmpsia).",
  ];
  const ask = vitalPrompt(text);
  if (ask) alertas.unshift(ask);
  return { title: "Crise convulsiva", body: baseFrame(dx, conduta, exames, alertas) };
}

// ---------- AVC / Déficit neurológico súbito ----------
function handleStroke(text: string): LocalReply {
  const dx = ["AVC isquêmico vs hemorrágico — tempo de início define janela terapêutica."];
  const conduta = [
    "Escala NIHSS, glicemia capilar, PA e SatO₂ (O₂ se Sat <94%).",
    "TC de crânio sem contraste imediata.",
    "Se janela e critérios: trombólise sistêmica / trombectomia mecânica conforme protocolo.",
    "PA alvo: não reduzir agressivo antes de definir conduta (salvo emergência hipertensiva).",
  ];
  const exames = [
    "TC/angio-TC, hemograma, coagulograma, eletrólitos, função renal, ECG.",
  ];
  const alertas = ["Exclusão de hipoglicemia é prioritária."];
  const ask = vitalPrompt(text);
  if (ask) alertas.unshift(ask);
  return { title: "AVC / Déficit focal", body: baseFrame(dx, conduta, exames, alertas) };
}

// ---------- Sepse / Choque séptico ----------
function handleSepsis(text: string): LocalReply {
  const dx = ["Sepse — infecção suspeita/provada com disfunção orgânica."];
  const conduta = [
    "Coletar culturas rapidamente e iniciar antibiótico empírico amplo conforme foco.",
    "Reposição volêmica 30 mL/kg de cristalóide nas primeiras 3 h se hipotensão/lactato alto.",
    "Vasopressor (noradrenalina) se refratário a volume para MAP ≥65 mmHg.",
  ];
  const exames = [
    "Lactato, hemograma, função renal/hepática, eletrólitos, gasometria, coagulograma.",
    "Imagem conforme foco (RX tórax, US, TC).",
  ];
  const alertas = ["Reavaliar perfusão, diurese, necessidade de UTI."];
  const ask = vitalPrompt(text);
  if (ask) alertas.unshift(ask);
  return { title: "Sepse", body: baseFrame(dx, conduta, exames, alertas) };
}

// ---------- Obstetrícia (gestante) ----------
function handleOb(text: string): LocalReply {
  const t = norm(text);
  const preeclampsia = hasAny(t, ["pre eclampsia", "preeclampsia", "ip uterino", "rastr pre eclampsia"]);
  const dx = [
    preeclampsia ? "Gestante – suspeita/diagnóstico de pré‑eclâmpsia." : "Gestante – avaliar risco materno‑fetal e queixa principal.",
  ];
  const conduta = [
    "PA seriada, proteinúria, avaliação de sinais de gravidade.",
    preeclampsia ? "Se grave: sulfatação (MgSO4) e controle pressórico (hidralazina/labetalol conforme protocolo)." : "Conduta conforme quadro (trabalho de parto, infecção urinária, sangramento, etc.).",
    "Avaliar necessidade de encaminhamento ao alto risco / maternidade de referência.",
  ];
  const exames = [
    "EAS/urocultura se sintomas urinários, beta‑hCG conforme IG, US obstétrico/Doppler quando indicado.",
  ];
  const alertas = [
    "Evitar medicamentos contraindicados na gestação.",
    "Sempre documentar IG, movimentos fetais, sangramento, dor, atividade uterina.",
  ];
  const ask = vitalPrompt(text);
  if (ask) alertas.unshift(ask);
  return { title: "Gestante", body: baseFrame(dx, conduta, exames, alertas) };
}

// ---------- Pediatria – Febre / Quadro infeccioso comum ----------
function handlePeds(text: string): LocalReply {
  const dx = ["Pediatria – síndrome febril. Avaliar foco (vias aéreas, urinário, GI, pele)."];
  const conduta = [
    "Hidratar, antitérmico conforme peso. Avaliar sinais de alarme (letargia, gemência, má perfusão, tiragem, vômitos incoercíveis).",
    "Se <3 meses ou toxemia: investigação e possível internação.",
  ];
  const exames = [
    "Urina I/urocultura se sem foco claro, hemograma, RX tórax se sintomas respiratórios importantes.",
  ];
  const alertas = ["Reavaliar em 24–48 h ou antes se piora."];
  const ask = vitalPrompt(text);
  if (ask) alertas.unshift(ask);
  return { title: "Pediatria – Febre", body: baseFrame(dx, conduta, exames, alertas) };
}

// ---------- Fallback – Resposta médica geral ----------
function handleGeneric(text: string): LocalReply {
  const dx = ["Quadro clínico informado – vou te guiar de forma prática agora mesmo."];
  const conduta = [
    "Primeiro: sinais vitais e exame dirigido ao principal sintoma.",
    "Alívio de sintomas imediato quando seguro.",
    "Depois: investigação objetiva e conduta específica conforme achados.",
  ];
  const exames = ["Selecionar exames que mudem conduta hoje. Evitar pedir por pedir."];
  const alertas: string[] = [];
  const ask = vitalPrompt(text);
  if (ask) alertas.unshift(ask);
  return { title: "Atendimento clínico", body: baseFrame(dx, conduta, exames, alertas) };
}

// Router de cenários - Detecção local
function routeCase(userText: string): LocalReply {
  const t = norm(userText);

  if (hasAny(t, ["iam", "stemi", "scai", "dor toracica", "ecg", "d2", "d3", "avf", "v4r", "v3r"])) {
    return handleACS(userText);
  }
  if (hasAny(t, ["convuls", "crise", "epilep"])) {
    return handleSeizure(userText);
  }
  if (hasAny(t, ["avc", "derrame", "hemiparesia", "afasia", "nistagmo", "ataxia"])) {
    return handleStroke(userText);
  }
  if (hasAny(t, ["sepse", "choque septico", "septic", "lactato"])) {
    return handleSepsis(userText);
  }
  if (hasAny(t, ["gestante", "gravida", "obstetr", "ig ", "dpp", "pre eclampsia", "preeclampsia"])) {
    return handleOb(userText);
  }
  if (hasAny(t, ["crianca", "pediatr", "menor", "lactente", "febre"])) {
    return handlePeds(userText);
  }

  return handleGeneric(userText);
}

// ========================= FIM CLAIRTON STYLE SYSTEM =========================

interface ChatHistoryItem {
  user: string;
  assistant: string;
  references?: ScientificReference[];
}

export default function Atendimento() {
  // ===== PERSONALIZAÇÃO =====
  const medico = useMemo<MedicoInfo>(() => getMedicoFromStorage(), []);
  const saudacao = useMemo(() => buildSaudacao(medico), [medico]);

  // ===== ESTADO =====
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [savedAttachments, setSavedAttachments] = useState<any[]>([]);
  const [mode, setMode] = useState<'clinico' | 'explicativo'>('clinico');
  const [evidenceEnabled, setEvidenceEnabled] = useState(false);
  const [isResearchAvailable, setIsResearchAvailable] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const threadRef = useRef<HTMLDivElement>(null);
  const [showPatientMgmt] = useLocalStorage<boolean>("mh_showPatientMgmt", true);
  
  // Histórico de atendimentos
  const [currentAtendimento, setCurrentAtendimento] = useState<AtendimentoType | null>(null);

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: showPatientMgmt,
  });

  const researchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/research", {
        query,
        maxSources: 5,
      });
      return response as unknown as { answer: string; references: ScientificReference[] };
    },
    onError: (error: any) => {
      if (error.message?.includes("não configurado")) {
        setIsResearchAvailable(false);
        setEvidenceEnabled(false);
      }
    },
  });

  const streamAbortController = useRef<AbortController | null>(null);

  // Carregar atendimento atual
  useEffect(() => {
    // Hidrata sessão da URL (se houver ?sid=...)
    SessionAPI.hydrateFromURL("/atendimento");
    
    let curId = getCurrentId();
    
    if (!curId) {
      const novo = createAtendimento();
      curId = novo.id;
    }

    const atendimento = getAtendimento(curId);
    if (atendimento) {
      setCurrentAtendimento(atendimento);
      setMode(atendimento.mode || 'clinico');
      setSelectedPatientId(atendimento.patientId || "");
      
      const chatHistory: ChatHistoryItem[] = [];
      for (let i = 0; i < atendimento.messages.length; i += 2) {
        if (i + 1 < atendimento.messages.length) {
          chatHistory.push({
            user: atendimento.messages[i].content,
            assistant: atendimento.messages[i + 1].content,
          });
        }
      }
      setHistory(chatHistory);
    }
  }, []);

  const handleModeChange = (newMode: 'clinico' | 'explicativo') => {
    setMode(newMode);
    if (currentAtendimento) {
      updateMode(currentAtendimento.id, newMode);
    }
  };

  useEffect(() => {
    return () => {
      if (streamAbortController.current) {
        streamAbortController.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [history.length, streamingMessage]);

  // SISTEMA HÍBRIDO: Local + IA
  const handleChatStream = async (userMessage: string, chatHistory: any[], enableEvidence: boolean) => {
    if (streamAbortController.current) {
      streamAbortController.current.abort();
    }

    const abortController = new AbortController();
    streamAbortController.current = abortController;
    setIsStreaming(true);
    setStreamingMessage("");
    setCurrentUserMessage(userMessage);
    
    let fullResponse = "";
    let references: ScientificReference[] | undefined;

    // 1️⃣ EXECUTAR DETECÇÃO LOCAL PRIMEIRO
    const localReply = routeCase(userMessage);
    
    try {
      // 2️⃣ TENTAR ENRIQUECER COM IA (mantendo estilo Clairton)
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 60000);

      const enrichmentPrompt = mode === "clinico"
        ? `${localReply.body}\n\n[INSTRUÇÃO PARA IA]: Enriqueça a resposta acima mantendo EXATAMENTE o formato (🩺⚡🧪💬) e o estilo direto do Dr. Clairton Dumke. Adicione doses específicas, ajustes conforme dados clínicos, e detalhes práticos. Linguagem médica direta, sem floreios.`
        : `${localReply.body}\n\n[INSTRUÇÃO PARA IA]: Enriqueça a resposta acima mantendo o formato (🩺⚡🧪💬), mas adicione explicações fisiopatológicas e cite diretrizes (SBC/ILAS/ANE) quando relevante. Tom humano e técnico, não robotizado.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "demo-doctor",
        },
        body: JSON.stringify({
          message: enrichmentPrompt,
          history: chatHistory,
          mode: mode,
          isEnrichment: true, // Flag para backend saber que é enriquecimento
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("API offline - usando resposta local");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Streaming não suportado");
      }

      let buffer = "";
      let currentEvent = "";
      let dataBuffer: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataBuffer.push(line.slice(5).trim());
          } else if (line.trim() === "" && dataBuffer.length > 0) {
            const fullData = dataBuffer.join("\n");
            dataBuffer = [];
            
            try {
              const data = JSON.parse(fullData);

              if (currentEvent === "chunk") {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              } else if (currentEvent === "complete") {
                console.log(`✅ IA enrichment: ${data.tokens} tokens em ${data.duration}ms`);
              } else if (currentEvent === "error") {
                throw new Error(data.message);
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", fullData, parseError);
            }
            
            currentEvent = "";
          }
        }
      }

      setIsStreaming(false);
      
      // 3️⃣ BUSCAR EVIDÊNCIAS SE HABILITADO
      if (enableEvidence && fullResponse) {
        try {
          const researchData = await researchMutation.mutateAsync(userMessage);
          references = researchData.references;
        } catch (error) {
          console.error("Erro ao buscar evidências:", error);
        }
      }

      // 4️⃣ GARANTIR SAUDAÇÃO NO INÍCIO
      const finalResponse = fullResponse.startsWith("Beleza,") || fullResponse.includes(saudacao)
        ? fullResponse
        : `**${saudacao}**\n\n${fullResponse}`;

      // Salvar no localStorage
      if (currentAtendimento) {
        const now = new Date().toISOString();
        addMensagem(currentAtendimento.id, { role: "user", content: userMessage, ts: now });
        addMensagem(currentAtendimento.id, { role: "assistant", content: finalResponse, ts: now });
      }

      setHistory(prev => [...prev, {
        user: userMessage,
        assistant: finalResponse,
        references,
      }]);

      setMessage("");
      setFiles([]);
      setStreamingMessage("");
      setCurrentUserMessage("");
      
    } catch (error: any) {
      console.warn("⚠️ IA offline, usando resposta local:", error.message);
      
      // 4️⃣ FALLBACK: USAR APENAS RESPOSTA LOCAL
      setIsStreaming(false);
      setStreamingMessage("");
      
      if (error.name !== "AbortError") {
        // Adicionar saudação na resposta local
        const fallbackResponse = `**${saudacao}**\n\n${localReply.body}`;
        
        // Salvar resposta local
        if (currentAtendimento) {
          const now = new Date().toISOString();
          addMensagem(currentAtendimento.id, { role: "user", content: userMessage, ts: now });
          addMensagem(currentAtendimento.id, { role: "assistant", content: fallbackResponse, ts: now });
        }

        setHistory(prev => [...prev, {
          user: userMessage,
          assistant: fallbackResponse,
        }]);

        setMessage("");
        setFiles([]);
        setCurrentUserMessage("");
        
        toast({
          title: "Modo Offline Ativo",
          description: "Resposta gerada localmente (IA indisponível).",
        });
      }
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-Id": "demo-doctor",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro no upload");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.attachments) {
        setSavedAttachments(prev => [...prev, ...data.attachments]);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar os arquivos.",
      });
    },
  });

  const saveConsultationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatientId) {
        throw new Error("Selecione um paciente");
      }
      if (history.length === 0) {
        throw new Error("Não há histórico de conversa para salvar");
      }

      const chatHistory = history.flatMap(h => [
        { role: "user", content: h.user },
        { role: "assistant", content: h.assistant },
      ]);

      return await apiRequest("POST", "/api/consultations", {
        patientId: selectedPatientId,
        userId: "demo-doctor",
        complaint: history[0].user,
        history: chatHistory,
        attachments: savedAttachments.length > 0 ? savedAttachments : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Consulta salva",
        description: "O histórico foi registrado com sucesso no prontuário do paciente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${selectedPatientId}/consultations`] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setHistory([]);
      setMessage("");
      setFiles([]);
      setSavedAttachments([]);
      setSelectedPatientId("");
      setShowSavePanel(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar consulta",
        description: error.message || "Não foi possível salvar o histórico.",
      });
    },
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;

    // Comandos de texto rápido
    if (currentAtendimento && message.trim() && files.length === 0) {
      const texto = message.toLowerCase().trim();

      const m1 = texto.match(/^salvar como (.+)$/i);
      if (m1) {
        const novoNome = message.trim().substring(12).trim();
        setSaved(currentAtendimento.id, true);
        renameAtendimento(currentAtendimento.id, novoNome);
        const updated = getAtendimento(currentAtendimento.id);
        if (updated) setCurrentAtendimento(updated);
        setMessage("");
        toast({
          title: "✓ Atendimento salvo e renomeado",
          description: `"${novoNome}" foi salvo e não será removido automaticamente.`,
        });
        return;
      }

      const m2 = texto.match(/^renomear (?:para )?(.+)$/i);
      if (m2) {
        const idx = texto.startsWith("renomear para ") ? 14 : 9;
        const novoNome = message.trim().substring(idx).trim();
        renameAtendimento(currentAtendimento.id, novoNome);
        const updated = getAtendimento(currentAtendimento.id);
        if (updated) setCurrentAtendimento(updated);
        setMessage("");
        toast({
          title: "✓ Atendimento renomeado",
          description: `Novo nome: "${novoNome}"`,
        });
        return;
      }
    }

    let enrichedMessage = message;

    if (files.length > 0) {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));

      try {
        const uploadResult = await uploadMutation.mutateAsync(formData);
        const attachmentText = uploadResult.attachments
          .map((a: FileAttachment) => `- ${a.filename}`)
          .join("\n");
        enrichedMessage = message
          ? `${message}\n\n[Anexos enviados:\n${attachmentText}]`
          : `[Anexos enviados:\n${attachmentText}]`;
      } catch (error) {
        return;
      }
    }

    const chatHistory = history.flatMap(h => [
      { role: "user" as const, content: h.user },
      { role: "assistant" as const, content: h.assistant },
    ]);

    handleChatStream(enrichedMessage, chatHistory, evidenceEnabled);
  };

  const isLoading = isStreaming || uploadMutation.isPending;

  return (
    <div className="h-screen w-full bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      {/* HEADER FIXO */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-1.5">
          <TopControls
            initialTab="clinico"
            onTabChange={(tab) => {
              if (tab === "clinico") {
                setMode("clinico");
                setEvidenceEnabled(false);
              } else if (tab === "avancado") {
                setMode("explicativo");
                setEvidenceEnabled(true);
              }
            }}
          />

          {showPatientMgmt && showSavePanel && history.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <Select 
                  value={selectedPatientId || "none"} 
                  onValueChange={(v) => setSelectedPatientId(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="flex-1 max-w-xs" data-testid="select-paciente">
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione um paciente</SelectItem>
                    {patients && patients.length > 0 && (
                      patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => saveConsultationMutation.mutate()}
                  disabled={!selectedPatientId || saveConsultationMutation.isPending}
                  data-testid="button-salvar-consulta"
                  className="bg-[#3cb371] hover:bg-[#2f9e62]"
                >
                  {saveConsultationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Consulta
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                Ao salvar, todo o histórico desta conversa será registrado no prontuário do paciente
              </p>
            </div>
          )}
        </div>
      </header>

      {/* THREAD */}
      <main
        ref={threadRef}
        className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-6"
      >
        {history.length === 0 && !isStreaming ? (
          <div className="text-neutral-500 dark:text-neutral-400 text-sm mt-12 text-center space-y-2">
            <p className="text-base font-medium">💚 MédicoHelp - Sistema Híbrido IA + Clairton</p>
            <p>Respostas estruturadas (🩺⚡🧪💬) enriquecidas com IA</p>
            <p className="text-xs">Funciona online (IA) e offline (local)</p>
          </div>
        ) : (
          <div className="space-y-6" data-testid="card-chat-history">
            {history.map((item, index) => (
              <div key={index} className="space-y-4">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#3cb371] text-white">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.user}</p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[85%] space-y-3">
                    <div className="rounded-2xl px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.assistant}</p>
                    </div>

                    {item.references && item.references.length > 0 && (
                      <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                            Referências Científicas
                          </p>
                        </div>
                        <div className="space-y-2">
                          {item.references.slice(0, 5).map((ref, refIndex) => (
                            <a
                              key={refIndex}
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2 text-xs hover-elevate p-2 rounded-md transition-colors"
                              data-testid={`link-reference-${refIndex}`}
                            >
                              <ExternalLink className="w-3 h-3 mt-0.5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2">
                                  {ref.title}
                                </p>
                                {(ref.source || ref.authors || ref.year) && (
                                  <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                                    {[ref.source, ref.authors, ref.year].filter(Boolean).join(" • ")}
                                  </p>
                                )}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isStreaming && currentUserMessage && (
              <div className="space-y-4 opacity-90">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#3cb371] text-white">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentUserMessage}</p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
                    {streamingMessage ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingMessage}</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">Gerando resposta...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* COMPOSER FIXO */}
      <footer className="sticky bottom-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-4" data-testid="card-chat-input">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-700">
              {files.map((file, index) => (
                <Badge key={index} variant="secondary" className="gap-2 pr-1">
                  <FileImage className="w-3 h-3" />
                  <span className="text-xs max-w-[150px] truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/20"
                    onClick={() => removeFile(index)}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          <ChatComposer
            onSend={async (text) => {
              if (!text.trim() && files.length === 0) return;
              
              let enrichedMessage = text;
              const chatHistory = history.flatMap((h) => [
                { role: "user", content: h.user },
                { role: "assistant", content: h.assistant },
              ]);

              if (files.length > 0) {
                const formData = new FormData();
                files.forEach((file) => formData.append("files", file));
                formData.append("userId", "demo-doctor");

                try {
                  const uploadResult = await uploadMutation.mutateAsync(formData);
                  const attachmentTexts = uploadResult.attachments.map(
                    (att: any) => `[${att.type === "image" ? "Imagem" : "Arquivo"}: ${att.filename}]`
                  );
                  enrichedMessage = `${text}\n\n${attachmentTexts.join("\n")}`;
                } catch (error) {
                  console.error("Erro no upload:", error);
                  return;
                }
              }

              handleChatStream(enrichedMessage, chatHistory, evidenceEnabled);
            }}
            onFiles={async (selectedFiles) => {
              setFiles(prev => [...prev, ...selectedFiles].slice(0, 10));
            }}
            uploadUrl="/api/upload"
            transcribeUrl="/api/transcribe"
            placeholder={`Fala comigo como no plantão, ${firstName(medico.nome)} (ex.: 'IAM inferior com supra em D2, D3 e aVF, PA 90x60, FC 50').`}
            disabled={isLoading}
          />

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 text-center">
            Sistema híbrido: IA online (enriquecida) + Local offline (Clairton style). Validação: médico usuário.
          </p>
        </div>
      </footer>
    </div>
  );
}
