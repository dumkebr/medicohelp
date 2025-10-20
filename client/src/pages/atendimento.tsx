import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Paperclip, Loader2, FileImage, X, Save, Brain, ExternalLink, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
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

  // AbortController ref for cancelling streams
  const streamAbortController = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamAbortController.current) {
        streamAbortController.current.abort();
      }
    };
  }, []);

  // SSE Chat handler with streaming
  const handleChatStream = async (userMessage: string, chatHistory: any[], enableEvidence: boolean) => {
    // Cancel any previous stream
    if (streamAbortController.current) {
      streamAbortController.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    streamAbortController.current = abortController;
    setIsStreaming(true);
    setStreamingMessage("");
    setCurrentUserMessage(userMessage);
    
    let fullResponse = "";
    let references: ScientificReference[] | undefined;

    try {
      // Timeout safeguard: fail after 60 seconds
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 60000);

      // Create SSE connection via fetch with streaming
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
      let dataBuffer: string[] = []; // Buffer for multi-line data payloads

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            // Buffer data lines (multi-line data is separated by empty lines)
            dataBuffer.push(line.slice(5).trim());
          } else if (line.trim() === "" && dataBuffer.length > 0) {
            // Empty line signals end of multi-line data payload
            const fullData = dataBuffer.join("\n");
            dataBuffer = [];
            
            try {
              const data = JSON.parse(fullData);

              if (currentEvent === "chunk") {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              } else if (currentEvent === "complete") {
                // Stream completed successfully
                console.log(`Chat completed: ${data.tokens} tokens in ${data.duration}ms`);
              } else if (currentEvent === "error") {
                throw new Error(data.message);
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", fullData, parseError);
            }
            
            currentEvent = ""; // Reset after processing
          }
        }
      }

      // CRITICAL: Disable streaming state FIRST to re-enable button immediately
      setIsStreaming(false);
      
      // Fetch scientific references if evidence mode is enabled
      if (enableEvidence && fullResponse) {
        try {
          const researchData = await researchMutation.mutateAsync(userMessage);
          references = researchData.references;
        } catch (error) {
          console.error("Erro ao buscar evidências:", error);
        }
      }

      // Add to history
      setHistory(prev => [...prev, {
        user: userMessage,
        assistant: fullResponse,
        references,
      }]);

      // Clear inputs and streaming state markers
      setMessage("");
      setFiles([]);
      setStreamingMessage("");
      setCurrentUserMessage("");
      
    } catch (error: any) {
      console.error("Erro no chat stream:", error);
      setStreamingMessage("");
      setCurrentUserMessage("");
      setIsStreaming(false); // Explicitly disable streaming state on error
      
      // Don't show error toast for intentional cancellations
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

    // Call streaming chat handler
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Atendimento Médico com IA</h1>
        <p className="text-muted-foreground">
          Faça perguntas clínicas e envie imagens de exames para análise
        </p>
      </div>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salvar Histórico no Prontuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger data-testid="select-paciente">
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients && patients.length > 0 ? (
                      patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.nome}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        Nenhum paciente cadastrado
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => saveConsultationMutation.mutate()}
                disabled={!selectedPatientId || saveConsultationMutation.isPending}
                data-testid="button-salvar-consulta"
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
            <p className="text-xs text-muted-foreground">
              Ao salvar, todo o histórico desta conversa será registrado no prontuário do paciente
            </p>
          </CardContent>
        </Card>
      )}

      {(history.length > 0 || isStreaming) && (
        <Card data-testid="card-chat-history">
          <CardContent className="p-6 space-y-6">
            {history.map((item, index) => (
              <div key={index} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-primary">Você:</p>
                  <p className="text-sm whitespace-pre-wrap">{item.user}</p>
                </div>
                <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-primary">Médico Help:</p>
                  <p className="text-sm whitespace-pre-wrap">{item.assistant}</p>
                  
                  {item.references && item.references.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground">
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
                            <ExternalLink className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground line-clamp-2">
                                {ref.title}
                              </p>
                              {(ref.source || ref.authors || ref.year) && (
                                <p className="text-muted-foreground mt-1">
                                  {[ref.source, ref.authors, ref.year].filter(Boolean).join(" • ")}
                                </p>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic mt-2">
                        Material de apoio. Não substitui avaliação médica.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Show streaming message while it's being generated */}
            {isStreaming && currentUserMessage && (
              <div className="space-y-4 opacity-90">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-primary">Você:</p>
                  <p className="text-sm whitespace-pre-wrap">{currentUserMessage}</p>
                </div>
                <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-primary">Médico Help:</p>
                    {!streamingMessage && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>
                  {streamingMessage ? (
                    <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Gerando resposta...</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-chat-input">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4 pb-2 border-b border-border flex-wrap">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={mode === 'clinico' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('clinico')}
                      disabled={isLoading}
                      data-testid="button-mode-clinico"
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Modo Clínico
                    </Button>
                    <Button
                      variant={mode === 'explicativo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('explicativo')}
                      disabled={isLoading}
                      data-testid="button-mode-explicativo"
                      className="gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Modo Explicativo
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">
                    {mode === 'clinico' ? '🩺 Modo Clínico' : '📘 Modo Explicativo'}
                  </p>
                  <p className="text-xs">
                    {mode === 'clinico'
                      ? 'Respostas diretas e estruturadas para prontuário médico. Sem explicações teóricas.'
                      : 'Explicações educacionais com fundamentos científicos e diretrizes. Pode acessar evidências clínicas se habilitado no perfil.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="evidence-mode"
                      checked={evidenceEnabled}
                      onCheckedChange={setEvidenceEnabled}
                      disabled={!isResearchAvailable || isLoading}
                      data-testid="switch-evidence-mode"
                    />
                    <Label
                      htmlFor="evidence-mode"
                      className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${
                        !isResearchAvailable ? "opacity-50" : ""
                      }`}
                    >
                      <Brain className="w-4 h-4" />
                      Evidências Clínicas
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    {isResearchAvailable
                      ? "Fornece fontes de referência bibliográfica — uso apenas como apoio clínico."
                      : "Evidências Clínicas indisponível (API não configurada)"}
                  </p>
                </TooltipContent>
              </Tooltip>
              {evidenceEnabled && (
                <Badge variant="secondary" className="text-xs" data-testid="badge-evidence-active">
                  Ativo
                </Badge>
              )}
            </div>
          </div>

          <Textarea
            placeholder="Digite sua pergunta clínica... (Ctrl+Enter para enviar)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-none"
            disabled={isLoading}
            data-testid="input-chat-message"
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <Badge key={index} variant="secondary" className="gap-2 pr-1">
                  <FileImage className="w-3 h-3" />
                  <span className="text-xs">{file.name}</span>
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

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-input")?.click()}
                disabled={isLoading}
                data-testid="button-attach-files"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Anexar arquivos
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
              <span className="text-xs text-muted-foreground">
                Até 10 arquivos (imagens ou PDF)
              </span>
            </div>

            <Button
              onClick={handleSend}
              disabled={isLoading || (!message.trim() && files.length === 0)}
              data-testid="button-send-message"
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
        </CardContent>
      </Card>
    </div>
  );
}
