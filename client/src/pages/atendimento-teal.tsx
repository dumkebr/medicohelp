import "../styles/theme.css";
import "../styles/responsive.css";
import Mascote from "../components/Mascote";
import { useState } from "react";
import { sendChat } from "../services/chat";

type Msg = { who: "user" | "ai"; text: string };

export default function AtendimentoTeal() {
  const [tab, setTab] = useState<"clinico" | "evidencias">("clinico");
  const [messages, setMessages] = useState<Msg[]>([
    { who: "ai", text: "Beleza, Doutor. Vamos direto ao ponto: como posso ajudar?" }
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSend() {
    if (!text.trim() || loading) return;
    
    const userMsg = { who: "user" as const, text };
    setMessages(m => [...m, userMsg]);
    setText("");
    setLoading(true);
    
    try {
      const systemPrompt = tab === "clinico"
        ? "Você é a Dra. Clarice, médica veterana, direta e tradicional, tom acolhedor. Responda com objetividade clínica."
        : "Você é a Dra. Clarice. Forneça fundamentação teórica e evidências científicas com referências.";
      
      const reply = await sendChat([
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ]);
      
      setMessages(m => [...m, { who: "ai", text: reply }]);
    } catch (e: any) {
      setMessages(m => [...m, { 
        who: "ai", 
        text: `❌ Erro: ${e?.message || "Falha na comunicação com a API"}` 
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="header">
        <div className="container navbar">
          <div className="logo-row">
            <img 
              src="/logo-medicohelp-horizontal.svg?v=2025-10-23-10" 
              height={40} 
              alt="MédicoHelp" 
            />
          </div>
          <div className="small">Sua aliada inteligente na decisão clínica</div>
        </div>
      </header>

      <div className="container">
        <div className="tabs card" style={{ display: "flex", gap: 12, marginTop: 16 }}>
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
        </div>

        <div className="grid">
          <aside className="sidebar card">
            <h3 style={{ marginTop: 0 }}>Dra. Clarice</h3>
            <div className="small">Médica veterana, direta e acolhedora.</div>
            <div style={{ marginTop: 12 }}>
              <Mascote speaking={loading} />
            </div>
          </aside>

          <section className="chat card">
            <div className="msgs">
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={"bubble " + (m.who === "user" ? "user" : "ai")}
                  data-testid={`message-${m.who}-${i}`}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="bubble ai" data-testid="message-loading">
                  <div className="small">Dra. Clarice está analisando...</div>
                </div>
              )}
            </div>
            
            <div className="inputbar">
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
    </div>
  );
}
