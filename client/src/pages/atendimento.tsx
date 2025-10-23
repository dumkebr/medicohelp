import "../styles/theme.css";
import "../styles/responsive.css";
import Mascote from "../components/Mascote";
import VoiceCallButton from "../components/VoiceCallButton";
import { useState, useRef, useEffect } from "react";
import { sendChatStream } from "../services/chat-stream";
import { Paperclip, Image as ImageIcon, Mic, MicOff, Download, X } from "lucide-react";

type Msg = { 
  id: string;
  who: "user" | "ai"; 
  text: string;
};

export default function Atendimento() {
  const [tab, setTab] = useState<"clinico" | "evidencias">("clinico");
  const [messages, setMessages] = useState<Msg[]>([
    { 
      id: crypto.randomUUID(),
      who: "ai", 
      text: "Beleza, Doutor. Vamos direto ao ponto: como posso ajudar?" 
    }
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, streamingText]);

  async function onSend() {
    if (!text.trim() || loading) return;
    
    const userMsg: Msg = { 
      id: crypto.randomUUID(),
      who: "user", 
      text: text.trim()
    };
    
    setMessages(m => [...m, userMsg]);
    const userText = text.trim();
    setText("");
    setLoading(true);
    setStreamingText("");

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const assistantId = crypto.randomUUID();

    try {
      // Add placeholder message for assistant
      setMessages(m => [...m, {
        id: assistantId,
        who: "ai",
        text: ""
      }]);

      const history = messages.map(m => ({
        role: m.who === "user" ? "user" : "assistant",
        content: m.text
      }));

      const fullResponse = await sendChatStream(
        userText,
        history,
        {
          mode: tab === "clinico" ? "clinico" : "explicativo",
          onChunk: (chunk) => {
            setStreamingText(chunk);
            setMessages(m => m.map(msg => 
              msg.id === assistantId ? { ...msg, text: chunk } : msg
            ));
          },
          onComplete: () => {
            setStreamingText("");
          },
          onError: (error) => {
            console.error("Stream error:", error);
          },
          signal: abortController.signal
        }
      );

      // Update final message
      setMessages(m => m.map(msg => 
        msg.id === assistantId ? { ...msg, text: fullResponse } : msg
      ));
      
    } catch (e: any) {
      if (e.name !== "AbortError") {
        const errorMsg: Msg = {
          id: crypto.randomUUID(),
          who: "ai",
          text: `❌ Erro: ${e?.message || "Falha na comunicação com a API"}`
        };
        
        setMessages(m => m.map(msg => 
          msg.id === assistantId ? errorMsg : msg
        ));
      }
    } finally {
      setLoading(false);
      setStreamingText("");
      abortControllerRef.current = null;
    }
  }

  function downloadChat() {
    const chatText = messages
      .map(m => `${m.who === "user" ? "MÉDICO" : "DRA. CLARICE"}: ${m.text}`)
      .join("\n\n");
    
    const blob = new Blob([chatText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `conversa-medicohelp-${new Date().toISOString().slice(0, 19)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function toggleVoice() {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => prev + " " + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    setFiles(prev => [...prev, ...selectedFiles]);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg)", padding: "16px" }}>
      {/* Tabs com design teal */}
      <div className="tabs card" style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button 
          className={"btn " + (tab === "clinico" ? "btn-primary" : "btn-outline")} 
          onClick={() => setTab("clinico")}
          data-testid="tab-clinico"
        >
          Modo Clínico
        </button>
        <button 
          className={"btn " + (tab === "evidencias" ? "btn-primary" : "btn-outline")} 
          onClick={() => setTab("evidencias")}
          data-testid="tab-evidencias"
        >
          Fundamentação Teórica
        </button>
        
        <button 
          className="btn btn-outline"
          onClick={downloadChat}
          style={{ marginLeft: "auto" }}
          data-testid="button-download"
        >
          <Download size={16} style={{ marginRight: 4 }} />
          Baixar
        </button>
      </div>

      {/* Chat área - ocupa todo espaço disponível */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <section className="chat card" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="msgs" ref={chatRef} style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {messages.length === 1 && (
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center",
                height: "100%",
                gap: 16
              }}>
                <div style={{ maxWidth: 200 }}>
                  <Mascote speaking={false} />
                </div>
                <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                  <h3 style={{ margin: "0 0 8px 0" }}>Dra. Clarice</h3>
                  <p className="small" style={{ margin: 0 }}>Médica veterana, direta e acolhedora.</p>
                </div>
              </div>
            )}
            
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={"bubble " + (m.who === "user" ? "user" : "ai")}
                data-testid={`message-${m.who}-${m.id}`}
              >
                {m.text}
                {loading && m.text === streamingText && streamingText && (
                  <span style={{ marginLeft: 4, animation: "pulse 1.5s infinite" }}>▍</span>
                )}
              </div>
            ))}
          </div>
          
          {files.length > 0 && (
            <div style={{ 
              padding: "8px 12px", 
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 8,
              flexWrap: "wrap"
            }}>
              {files.map((file, i) => (
                <div 
                  key={i}
                  style={{
                    background: "var(--bg-soft)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "4px 8px",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>{file.name} ({Math.round(file.size / 1024)}KB)</span>
                  <X 
                    size={14} 
                    style={{ cursor: "pointer" }}
                    onClick={() => removeFile(i)}
                  />
                </div>
              ))}
            </div>
          )}
          
          <div className="inputbar">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={onFileSelect}
            />
            <input
              type="file"
              ref={photoInputRef}
              style={{ display: "none" }}
              accept="image/*"
              capture="environment"
              onChange={onFileSelect}
            />
            
            <button
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Anexar arquivo"
              data-testid="button-attach"
              style={{ padding: "10px" }}
            >
              <Paperclip size={18} />
            </button>
            
            <button
              className="btn btn-outline"
              onClick={() => photoInputRef.current?.click()}
              disabled={loading}
              title="Capturar foto"
              data-testid="button-photo"
              style={{ padding: "10px" }}
            >
              <ImageIcon size={18} />
            </button>
            
            <button
              className={"btn " + (isListening ? "btn-primary" : "btn-outline")}
              onClick={toggleVoice}
              disabled={loading}
              title={isListening ? "Parar gravação" : "Gravar voz"}
              data-testid="button-voice"
              style={{ padding: "10px" }}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            
            <VoiceCallButton />
            
            <input
              placeholder={
                tab === "clinico" 
                  ? "Descreva o caso clínico..." 
                  : "Pergunte sobre evidências..."
              }
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && onSend()}
              disabled={loading}
              data-testid="input-chat"
              style={{ flex: 1 }}
            />
            
            <button 
              className="btn btn-primary" 
              onClick={onSend}
              disabled={loading || !text.trim()}
              data-testid="button-send"
            >
              {loading ? "..." : "Enviar"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
// Force reload 1761246082
