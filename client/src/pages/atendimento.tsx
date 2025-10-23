import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Mic, MicOff, Paperclip, Image as ImageIcon, Download, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Patient, ScientificReference } from "@shared/schema";
import {
  getCurrentId,
  getAtendimento,
  addMensagem,
  createAtendimento,
  updateMode,
  type Atendimento as AtendimentoType,
} from "@/lib/atendimentos";
import { SessionAPI } from "@/lib/chatSessions";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: ScientificReference[];
}

export default function Atendimento() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<"clinico" | "explicativo">("clinico");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const chatRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamAbortController = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [currentAtendimento, setCurrentAtendimento] = useState<AtendimentoType | null>(null);
  const [showPatientMgmt] = useLocalStorage<boolean>("mh_showPatientMgmt", true);

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: showPatientMgmt,
  });

  // Carregar atendimento atual
  useEffect(() => {
    SessionAPI.hydrateFromURL("/atendimento");
    
    let curId = getCurrentId();
    if (!curId) {
      const novo = createAtendimento();
      curId = novo.id;
    }

    const atendimento = getAtendimento(curId);
    if (atendimento) {
      setCurrentAtendimento(atendimento);
      setMode(atendimento.mode || "clinico");
      setSelectedPatientId(atendimento.patientId || "");
      
      const loadedMessages: ChatMessage[] = atendimento.messages.map((m, i) => ({
        id: `msg-${i}`,
        role: m.role,
        content: m.content,
      }));
      setMessages(loadedMessages);
    }
  }, []);

  // Scroll automático
  useEffect(() => {
    const el = chatRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, streamingText]);

  // Listener para novo atendimento
  useEffect(() => {
    const listener = () => {
      handleNovoAtendimento();
    };
    window.addEventListener("mh:new-session", listener);
    return () => window.removeEventListener("mh:new-session", listener);
  }, [currentAtendimento]);

  const handleModeChange = (newMode: "clinico" | "explicativo") => {
    setMode(newMode);
    if (currentAtendimento) {
      updateMode(currentAtendimento.id, newMode);
    }
  };

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    
    setIsSending(true);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Salvar mensagem do usuário
    if (currentAtendimento) {
      addMensagem(currentAtendimento.id, { 
        role: "user", 
        content: trimmed,
        ts: new Date().toISOString()
      });
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await streamAssistantResponse(trimmed);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "[Erro ao obter resposta. Tente novamente.]",
      };
      setMessages((prev) => [...prev, errorMsg]);
      
      toast({
        title: "Erro",
        description: error.message || "Falha na comunicação com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function streamAssistantResponse(userMessage: string) {
    if (streamAbortController.current) {
      streamAbortController.current.abort();
    }

    const abortController = new AbortController();
    streamAbortController.current = abortController;
    
    const assistantId = crypto.randomUUID();
    let fullResponse = "";
    let references: ScientificReference[] | undefined;

    try {
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 60000);

      const chatHistory = messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        throw new Error("Backend indisponível");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Streaming não suportado");
      }

      // Adicionar mensagem vazia do assistente
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

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
            const dataStr = line.slice(5).trim();
            if (dataStr) {
              dataBuffer.push(dataStr);
            }
          } else if (line === "" && dataBuffer.length > 0) {
            const fullDataStr = dataBuffer.join("");
            dataBuffer = [];

            try {
              const eventData = JSON.parse(fullDataStr);

              if (currentEvent === "chunk") {
                const chunk = eventData.content || "";
                fullResponse += chunk;
                setStreamingText(fullResponse);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullResponse } : m
                  )
                );
              } else if (currentEvent === "references" && eventData.references) {
                references = eventData.references;
              } else if (currentEvent === "complete") {
                // Finalizado
              } else if (currentEvent === "error") {
                throw new Error(eventData.message || "Erro desconhecido");
              }
            } catch (parseError) {
              console.error("Erro ao parsear evento SSE:", parseError);
            }

            currentEvent = "";
          }
        }
      }

      // Salvar resposta do assistente
      if (currentAtendimento && fullResponse) {
        addMensagem(currentAtendimento.id, {
          role: "assistant",
          content: fullResponse,
          ts: new Date().toISOString()
        });
      }

      setStreamingText("");
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Tempo esgotado");
      }
      throw error;
    }
  }

  function handleNovoAtendimento() {
    const novo = createAtendimento();
    setCurrentAtendimento(novo);
    setMessages([]);
    setInput("");
    setStreamingText("");
    setFiles([]);
    setSelectedPatientId("");
    
    toast({
      title: "Novo atendimento",
      description: "Conversa limpa. Pronto para iniciar.",
    });
  }

  function downloadChat() {
    const text = messages
      .map((m) => `${m.role === "user" ? "MÉDICO" : "DR. HELP"}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `conversa-${new Date().toISOString().slice(0, 19)}.txt`;
    link.click();
    
    toast({
      title: "Download concluído",
      description: "Conversa salva em arquivo de texto",
    });
  }

  function onAttachClick() {
    fileRef.current?.click();
  }

  function onPhotoClick() {
    photoRef.current?.click();
  }

  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setFiles((prev) => [...prev, ...selectedFiles]);

    const info = selectedFiles
      .map((f) => `• ${f.name} (${Math.round(f.size / 1024)} KB)`)
      .join("\n");
    
    const fileMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: `Anexos adicionados:\n${info}`,
    };
    
    setMessages((prev) => [...prev, fileMsg]);
    
    if (currentAtendimento) {
      addMensagem(currentAtendimento.id, {
        role: "user",
        content: fileMsg.content,
        ts: new Date().toISOString()
      });
    }

    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleVoice() {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({
        title: "Não suportado",
        description: "Reconhecimento de voz não está disponível neste navegador.",
        variant: "destructive",
      });
      return;
    }

    const rec = new SR();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    
    rec.onresult = (ev: any) => {
      let transcript = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        transcript += ev.results[i][0].transcript;
      }
      setInput((prev) => (prev ? prev + " " : "") + transcript.trim());
    };

    recognitionRef.current = rec;
    rec.start();
  }

  const modeButton = (m: "clinico" | "explicativo", label: string) => (
    <Button
      onClick={() => handleModeChange(m)}
      variant={mode === m ? "default" : "outline"}
      size="sm"
      className={mode === m ? "bg-emerald-600 hover:bg-emerald-700" : ""}
      data-testid={`button-mode-${m}`}
    >
      {label}
    </Button>
  );

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header com controles */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-2 backdrop-blur">
        <div className="flex gap-2">
          {modeButton("clinico", "Clínico")}
          {modeButton("explicativo", "Fundamentação teórica")}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleNovoAtendimento}
            variant="outline"
            size="sm"
            data-testid="button-novo-atendimento"
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo
          </Button>
          <Button
            onClick={downloadChat}
            variant="outline"
            size="sm"
            disabled={messages.length === 0}
            data-testid="button-download-chat"
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar
          </Button>
        </div>
      </div>

      {/* Área de chat - estilo ChatGPT */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4"
        data-testid="chat-container"
      >
        <div className="mx-auto w-full max-w-3xl py-4">
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
              Beleza, Doutor. Vamos direto ao ponto: em que posso ajudar?
              <br />
              <span className="text-xs">
                Conteúdo de apoio clínico. Validação e responsabilidade: médico usuário.
              </span>
            </div>
          )}
          
          {messages.map((m) => (
            <ChatBubble key={m.id} role={m.role} text={m.content} />
          ))}
          
          {streamingText && <ChatBubble role="assistant" text={streamingText} streaming />}
        </div>
      </div>

      {/* Barra de entrada - estilo ChatGPT */}
      <div className="sticky bottom-0 z-10 border-t bg-white/80 backdrop-blur dark:bg-background/80">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          {/* Preview de arquivos */}
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((file, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="flex items-center gap-1"
                  data-testid={`file-badge-${i}`}
                >
                  {file.name}
                  <button
                    onClick={() => removeFile(i)}
                    className="ml-1 hover:text-destructive"
                    data-testid={`button-remove-file-${i}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2 shadow-sm dark:border-border dark:bg-card">
            {/* Ícones à esquerda */}
            <div className="flex items-center gap-2 self-center">
              <button
                onClick={toggleVoice}
                className={`rounded-lg px-2 py-2 ${
                  isListening ? "text-green-600" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
                title={isListening ? "Parar voz" : "Falar"}
                data-testid="button-voice"
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                onClick={onAttachClick}
                className="rounded-lg px-2 py-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Anexar arquivo"
                data-testid="button-attach"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={onFilesSelected}
              />

              <button
                onClick={onPhotoClick}
                className="rounded-lg px-2 py-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Foto/Câmera"
                data-testid="button-photo"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFilesSelected}
              />
            </div>

            {/* Textarea central (auto-height) */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder={
                mode === "clinico"
                  ? "Descreva o caso clínico..."
                  : "Faça sua pergunta. O Dr. Help responde com fundamentação teórica."
              }
              className="max-h-40 w-full resize-none overflow-hidden bg-transparent px-2 py-2 text-sm focus:outline-none"
              style={{ lineHeight: "1.5" }}
              data-testid="input-message"
              disabled={isSending}
            />

            {/* Ações à direita */}
            <div className="flex items-center gap-2 self-center">
              <button
                onClick={handleNovoAtendimento}
                className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-gray-300 dark:hover:bg-gray-800"
                title="Novo atendimento"
                data-testid="button-novo-atendimento"
              >
                <Plus className="h-4 w-4" /> Novo
              </button>

              <button
                onClick={downloadChat}
                disabled={messages.length === 0}
                className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-card dark:text-gray-300 dark:hover:bg-gray-800"
                title="Baixar conversa"
                data-testid="button-download-chat"
              >
                <Download className="h-4 w-4" /> Baixar
              </button>

              <button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Enviar"
                data-testid="button-send"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  role,
  text,
  streaming,
}: {
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div
      className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`chat-bubble-${role}`}
    >
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow ${
          isUser ? "bg-green-600 text-white" : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        }`}
        style={{ borderRadius: "18px" }}
      >
        {text}
        {streaming && <span className="ml-1 animate-pulse">▍</span>}
      </div>
    </div>
  );
}
