import { useState, useRef, useEffect } from "react";
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

interface ChatHistoryItem {
  user: string;
  assistant: string;
  references?: ScientificReference[];
}

export default function Atendimento() {
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
    let curId = getCurrentId();
    
    if (!curId) {
      // Criar novo atendimento se não existir
      const novo = createAtendimento();
      curId = novo.id;
    }

    const atendimento = getAtendimento(curId);
    if (atendimento) {
      setCurrentAtendimento(atendimento);
      setMode(atendimento.mode || 'clinico');
      setSelectedPatientId(atendimento.patientId || "");
      
      // Carregar histórico de mensagens
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

  // Salvar modo quando alterado  
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

    try {
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 60000);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "demo-doctor",
        },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory,
          mode: mode,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Erro ao conectar com o servidor");
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
                console.log(`Chat completed: ${data.tokens} tokens in ${data.duration}ms`);
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
      
      if (enableEvidence && fullResponse) {
        try {
          const researchData = await researchMutation.mutateAsync(userMessage);
          references = researchData.references;
        } catch (error) {
          console.error("Erro ao buscar evidências:", error);
        }
      }

      // Salvar no localStorage
      if (currentAtendimento) {
        const now = new Date().toISOString();
        addMensagem(currentAtendimento.id, { role: "user", content: userMessage, ts: now });
        addMensagem(currentAtendimento.id, { role: "assistant", content: fullResponse, ts: now });
      }

      setHistory(prev => [...prev, {
        user: userMessage,
        assistant: fullResponse,
        references,
      }]);

      setMessage("");
      setFiles([]);
      setStreamingMessage("");
      setCurrentUserMessage("");
      
    } catch (error: any) {
      console.error("Erro no chat stream:", error);
      setStreamingMessage("");
      setCurrentUserMessage("");
      setIsStreaming(false);
      
      if (error.name !== "AbortError") {
        toast({
          variant: "destructive",
          title: "Erro ao processar mensagem",
          description: error.message || "⚠️ Conexão lenta. Tente novamente ou verifique sua chave API.",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 10);
      setFiles(newFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;

    // Comandos de texto rápido
    if (currentAtendimento && message.trim() && files.length === 0) {
      const texto = message.toLowerCase().trim();

      // SALVAR COMO "<nome>"
      const m1 = texto.match(/^salvar como (.+)$/i);
      if (m1) {
        const novoNome = message.trim().substring(12).trim(); // Preserva maiúsculas
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

      // RENOMEAR PARA "<nome>" ou RENOMEAR "<nome>"
      const m2 = texto.match(/^renomear (?:para )?(.+)$/i);
      if (m2) {
        const idx = texto.startsWith("renomear para ") ? 14 : 9;
        const novoNome = message.trim().substring(idx).trim(); // Preserva maiúsculas
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = isStreaming || uploadMutation.isPending;

  return (
    <div className="h-screen w-full bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      {/* HEADER FIXO */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* TOPCONTROLS - Interface limpa com abas */}
          <TopControls
            initialTab="clinico"
            onTabChange={(tab) => {
              if (tab === "clinico") {
                setMode("clinico");
              } else if (tab === "evidencias") {
                setMode("explicativo");
                setEvidenceEnabled(true);
              }
            }}
          />

          {/* PAINEL DE SALVAR CONSULTA (COLAPSÁVEL) */}
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

      {/* THREAD - SÓ A CONVERSA */}
      <main
        ref={threadRef}
        className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-6"
      >
        {history.length === 0 && !isStreaming ? (
          <div className="text-neutral-500 dark:text-neutral-400 text-sm mt-12 text-center space-y-2">
            <p className="text-base font-medium">Chat Médico com IA</p>
            <p>Digite sua pergunta clínica ou envie exames para análise</p>
            <p className="text-xs">Os controles ficam fixos no topo. A conversa aqui é contínua.</p>
          </div>
        ) : (
          <div className="space-y-6" data-testid="card-chat-history">
            {history.map((item, index) => (
              <div key={index} className="space-y-4">
                {/* USER BUBBLE */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#3cb371] text-white">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.user}</p>
                  </div>
                </div>

                {/* ASSISTANT BUBBLE */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] space-y-3">
                    <div className="rounded-2xl px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.assistant}</p>
                    </div>

                    {/* REFERÊNCIAS CIENTÍFICAS */}
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

            {/* STREAMING MESSAGE */}
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

      {/* COMPOSER FIXO EMBAIXO */}
      <footer className="sticky bottom-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-4" data-testid="card-chat-input">
          <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 shadow-sm">
            {/* FILES PREVIEW */}
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

            {/* TEXTAREA */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta clínica... (Ctrl+Enter para enviar)"
              rows={1}
              disabled={isLoading}
              data-testid="input-chat-message"
              className="w-full resize-none outline-none bg-transparent p-2 text-[15px] leading-6 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById("file-input")?.click()}
                  disabled={isLoading}
                  data-testid="button-attach-files"
                  className="h-8"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Até 10 arquivos (imagens ou PDF)
                </span>
              </div>

              <Button
                onClick={handleSend}
                disabled={isLoading || (!message.trim() && files.length === 0)}
                data-testid="button-send-message"
                className="px-4 py-2 rounded-xl bg-[#3cb371] text-white font-semibold hover:bg-[#2f9e62] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* DISCLAIMER */}
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 text-center">
            Conteúdo de apoio clínico. Validação e responsabilidade: médico usuário.
          </p>
        </div>
      </footer>
    </div>
  );
}
