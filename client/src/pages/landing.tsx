import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { FaWhatsapp } from "react-icons/fa";
import { Mail, X, Send } from "lucide-react";
import { loadAllKB, findAnswer, handleAction, logQuestion, type KBItem } from "@/lib/clarice-brain";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [audioButtonText, setAudioButtonText] = useState("📞 Ligar para a Dra. Clarice");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, sender: 'clarice' | 'user'}>>([
    { text: 'Olá! Eu sou a <b>Dra. Clarice</b>, assistente virtual do MédicoHelp. Como posso te ajudar hoje?', sender: 'clarice' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [kb, setKb] = useState<KBItem[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load Knowledge Base on mount (modular V5)
  useEffect(() => {
    loadAllKB().then((data: KBItem[]) => setKb(data));
  }, []);

  const handleAudioCall = () => {
    setAudioButtonText("🔔 Ligando para a Dra. Clarice...");
    
    setTimeout(() => {
      setAudioButtonText("📞 Conversando com Dra. Clarice");
      
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          // Audio autoplay blocked - expected in some browsers
        });
      }
      
      setTimeout(() => {
        setAudioButtonText("📞 Ligar para a Dra. Clarice");
      }, 6000);
    }, 1800);
  };

  const handleSendMessage = () => {
    const text = inputValue.trim();
    if (!text) return;

    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setInputValue("");

    // Log question for analytics
    logQuestion(text);

    setTimeout(() => {
      // Try to find answer in Knowledge Base (V5 modular)
      const answer = findAnswer(kb, text);
      
      if (answer) {
        // Found in KB - use the configured response
        setMessages(prev => [...prev, { 
          text: answer.resposta_html, 
          sender: 'clarice' 
        }]);
      } else {
        // Fallback response
        setMessages(prev => [...prev, { 
          text: 'Entendi sua dúvida. Posso te ajudar por aqui, ou encaminhar você para a equipe no WhatsApp para um atendimento mais personalizado.', 
          sender: 'clarice' 
        }]);
        
        // Show WhatsApp option
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            text: '👉 <a href="https://wa.me/5544991065757?text=Olá!%20Gostaria%20de%20falar%20com%20a%20equipe%20do%20MédicoHelp" target="_blank" rel="noopener noreferrer" style="color: #1affb8; font-weight: 600; text-decoration: none;">Falar com a equipe no WhatsApp</a>', 
            sender: 'clarice' 
          }]);
        }, 700);
      }
    }, 700);
  };

  // Handle action buttons in KB responses (V5)
  useEffect(() => {
    const handleActionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('clarice-action')) {
        const action = target.getAttribute('data-action');
        if (action) {
          handleAction(action);
        }
      }
    };

    document.addEventListener('click', handleActionClick);
    return () => document.removeEventListener('click', handleActionClick);
  }, []);

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", Arial, sans-serif',
      color: '#f3f7f6',
      background: '#043c37',
      minHeight: '100vh'
    }}>
      <style>{`
        :root {
          --bg: #043c37;
          --bg-2: #0b2f2b;
          --teal: #1fb7a6;
          --teal-2: #15a192;
          --text: #f3f7f6;
          --muted: #c9d7d4;
          --shadow: 0 10px 30px rgba(0,0,0,.25);
          --radius: 18px;
        }
        .landing-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .landing-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
        .landing-brand { display: flex; align-items: center; gap: 10px; }
        .landing-brand .logo-img { height: 44px; width: 44px; object-fit: contain; display: block; margin: 0; padding: 0; }
        .landing-brand .brand-content { display: flex; align-items: center; gap: 12px; }
        .landing-brand .title { font-weight: 700; font-size: 26px; letter-spacing: 0.2px; line-height: 1; display: flex; align-items: center; }
        .landing-brand .heart-icon { height: 32px; width: 32px; }
        .landing-nav { display: flex; gap: 12px; }
        .landing-nav a, .landing-btn { background: transparent; border: 1px solid rgba(255,255,255,.15); padding: 10px 14px; border-radius: 12px; color: var(--text); cursor: pointer; text-decoration: none; display: inline-block; }
        .landing-btn-primary { background: var(--teal); border: none; color: #042c28; font-weight: 700; }
        .landing-btn-primary:hover { background: var(--teal-2); }
        .landing-hero { display: flex; flex-direction: column; gap: 18px; align-items: center; padding: 40px 0 20px; max-width: 1040px; }
        .landing-hero h1 { font-weight: 800; line-height: 1.1; letter-spacing: -0.01em; margin: 0; font-size: clamp(28px, 6vw, 48px); text-align: center; }
        .landing-hero h1 .subtitle { display: block; font-size: clamp(20px, 4vw, 32px); font-weight: 600; margin-top: 8px; }
        .landing-hero .underline { width: 72px; height: 3px; background: rgba(255,255,255,.18); border-radius: 2px; }
        .landing-hero .lead { font-size: clamp(16px, 2.2vw, 18px); line-height: 1.55; color: var(--muted); margin: 0; text-align: center; max-width: 800px; }
        .landing-hero .lead b { color: var(--text); }
        .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; justify-content: center; }
        .pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; font-weight: 700; font-size: 14px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); }
        .pill .dot { width: 8px; height: 8px; border-radius: 999px; }
        .pill--clinico .dot { background: #22c55e; }
        .pill--teorico .dot { background: #3b82f6; }
        .pill--medprime .dot { background: #f59e0b; }
        .disclaimer { margin-top: 8px; font-style: italic; color: var(--muted); font-size: 14px; text-align: center; max-width: 700px; }
        .landing-cta { margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        
        /* AI Assistant Badge - Revolutionary Style */
        .ai-badge-container { margin: 60px auto; max-width: 680px; }
        .ai-badge { background: linear-gradient(135deg, #0c4540 0%, #084842 100%); border: 3px solid var(--teal); border-radius: 28px; padding: 32px 40px; position: relative; box-shadow: 0 8px 32px rgba(31,183,166,.25), 0 0 0 1px rgba(255,255,255,.05) inset; }
        .ai-badge::before { content: ''; position: absolute; top: 12px; right: 12px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(31,183,166,0.2) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
        .ai-badge-header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .ai-badge-avatar { width: 88px; height: 88px; border-radius: 50%; border: 3px solid var(--teal); box-shadow: 0 4px 16px rgba(31,183,166,.4); background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%); object-fit: cover; flex-shrink: 0; }
        .ai-badge-title-area { flex: 1; }
        .ai-badge-powered { display: inline-flex; align-items: center; gap: 6px; background: rgba(31,183,166,.15); border: 1.5px solid var(--teal); color: var(--teal); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .ai-badge h2 { font-size: 26px; font-weight: 800; margin: 0; line-height: 1.2; color: var(--text); }
        .ai-badge-content p { font-size: 15px; line-height: 1.6; color: var(--muted); margin: 0 0 12px; }
        .ai-badge-highlight { color: var(--teal); font-weight: 700; }
        .ai-badge-quote { margin-top: 16px; padding: 14px 18px; background: rgba(0,0,0,.2); border-left: 3px solid var(--teal); border-radius: 8px; font-style: italic; font-size: 14px; line-height: 1.5; color: #b8ddd8; }
        
        .landing-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .landing-card { background: var(--bg-2); padding: 20px; border-radius: var(--radius); box-shadow: var(--shadow); }
        .landing-card h3 { margin: 0 0 8px; }
        .landing-bullets { line-height: 1.7; color: var(--muted); }
        .landing-section { padding: 40px 0; }
        .landing-kicker { color: var(--teal); text-transform: uppercase; font-size: 12px; letter-spacing: 0.18em; }
        .landing-section h2 { margin: 6px 0 8px; font-size: 28px; }
        .landing-footer { padding: 26px 0; color: var(--muted); font-size: 14px; border-top: 1px solid rgba(255,255,255,.1); margin-top: 30px; }
        .landing-list { margin: 0; padding-left: 18px; color: var(--muted); }
        
        /* Contact Buttons */
        .contact-buttons { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 16px; }
        .contact-btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 24px; border-radius: 12px; font-weight: 600; font-size: 15px; text-decoration: none; transition: all 0.2s; border: none; cursor: pointer; }
        .contact-btn-whatsapp { background: #25D366; color: #fff; }
        .contact-btn-whatsapp:hover { background: #20BA5A; transform: translateY(-2px); }
        .contact-btn-email { background: rgba(255,255,255,.1); color: var(--text); border: 1px solid rgba(255,255,255,.2); }
        .contact-btn-email:hover { background: rgba(255,255,255,.15); transform: translateY(-2px); }
        .contact-btn svg { width: 20px; height: 20px; }
        
        /* MédicoHelp Section Styles */
        .mh-wrap { max-width: 1200px; margin: 50px auto; padding: 32px 20px; border-radius: 24px; background: linear-gradient(180deg, #0b3332, #043c37); box-shadow: 0 10px 30px rgba(0,0,0,.25), inset 0 0 0 1px rgba(25,194,158,.18); }
        .mh-title { font-size: clamp(22px, 3vw, 34px); font-weight: 800; letter-spacing: .2px; margin: 0 0 6px; text-align: center; }
        .mh-sub { font-size: clamp(14px, 2vw, 18px); color: var(--muted); margin: 0 0 20px; text-align: center; max-width: 800px; margin-left: auto; margin-right: auto; }
        .mh-chip { display: inline-flex; gap: 8px; align-items: center; background: #123f3d; color: #19c29e; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(25,194,158,.25); font-weight: 700; font-size: 12px; margin-bottom: 10px; }
        .mh-grid { display: grid; gap: 14px; grid-template-columns: repeat(12, 1fr); }
        .mh-card { grid-column: span 12; background: #0f4a47; border-radius: 18px; padding: 16px 16px 14px; box-shadow: 0 10px 30px rgba(0,0,0,.25), inset 0 0 0 1px rgba(25,194,158,.18); transition: .18s ease; position: relative; overflow: hidden; cursor: pointer; }
        .mh-card:hover { background: #0e4441; transform: translateY(-1px); }
        .mh-card h4 { display: flex; align-items: center; gap: 10px; font-size: 18px; margin: 0 0 6px; }
        .mh-card p { margin: 0; color: var(--muted); line-height: 1.5; }
        .mh-hr { height: 1px; background: linear-gradient(90deg, transparent, rgba(26,165,142,.4), transparent); margin: 24px 0; }
        .mh-section-title { font-size: 16px; letter-spacing: .18em; color: var(--muted); margin: 4px 0 12px; text-transform: uppercase; text-align: center; }
        .mh-kicker { font-size: clamp(18px, 2.4vw, 22px); font-weight: 700; margin: 0 0 14px; }
        .mh-ico { width: 18px; height: 18px; color: #19c29e; flex: 0 0 18px; }
        .mh-card.span-6 { grid-column: span 12; }
        .mh-card.span-8 { grid-column: span 12; }
        @media (min-width: 720px) {
          .mh-card { grid-column: span 4; }
          .mh-card.span-6 { grid-column: span 6; }
          .mh-card.span-8 { grid-column: span 8; }
        }
        .mh-card:focus { outline: 2px solid #19c29e; outline-offset: 2px; }
        
        /* Floating Chat Styles */
        .floating-chat-fab {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #00d9a3;
          box-shadow: 0 6px 24px rgba(0, 217, 163, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          z-index: 10000;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          padding: 0;
          overflow: hidden;
        }
        .floating-chat-fab:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0, 217, 163, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        .floating-chat-fab:active {
          transform: translateY(-1px);
        }
        
        .floating-chat-panel {
          position: fixed;
          bottom: 100px;
          right: 20px;
          width: 380px;
          max-height: 550px;
          background: #052828;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(0, 217, 163, 0.2);
        }
        
        .floating-chat-header {
          background: #041e1e;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(0, 217, 163, 0.15);
        }
        
        .floating-chat-close {
          background: transparent;
          border: none;
          color: #c9d7d4;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .floating-chat-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .floating-chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 300px;
          max-height: 400px;
        }
        
        .floating-chat-message {
          padding: 10px 14px;
          border-radius: 12px;
          max-width: 82%;
          word-wrap: break-word;
          line-height: 1.5;
          font-size: 14px;
        }
        .floating-chat-message.clarice {
          background: #0a3a35;
          align-self: flex-start;
          color: #f3f7f6;
        }
        .floating-chat-message.user {
          background: #00d9a3;
          align-self: flex-end;
          color: #042c28;
          font-weight: 500;
        }
        
        /* KB Action Buttons (V5) */
        .clarice-action {
          display: inline-block;
          margin-top: 8px;
          padding: 8px 16px;
          background: #00d9a3;
          color: #041012;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .clarice-action:hover {
          background: #1affb8;
          transform: translateY(-1px);
        }
        .clarice-action:active {
          transform: translateY(0);
        }
        .clarice-whats {
          color: #1affb8 !important;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid rgba(26, 255, 184, 0.3);
          transition: border-color 0.2s ease;
        }
        .clarice-whats:hover {
          border-bottom-color: #1affb8;
        }
        
        .floating-chat-input {
          padding: 12px;
          display: flex;
          gap: 8px;
          background: #041e1e;
          border-top: 1px solid rgba(0, 217, 163, 0.15);
        }
        .floating-chat-input input {
          flex: 1;
          border: none;
          padding: 10px 14px;
          border-radius: 20px;
          background: #0a3a35;
          color: #f3f7f6;
          font-size: 14px;
          outline: none;
        }
        .floating-chat-input input::placeholder {
          color: #7a9b96;
        }
        .floating-chat-input input:focus {
          background: #0d4540;
        }
        
        .floating-chat-send {
          background: #00d9a3;
          border: none;
          color: #042c28;
          padding: 10px 14px;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .floating-chat-send:hover {
          background: #1affb8;
        }
        
        @media (max-width: 900px) {
          .landing-grid-3 { grid-template-columns: 1fr; }
          .landing-hero h1 { font-size: clamp(24px, 5vw, 40px); }
          .ai-badge { padding: 24px 20px; }
          .ai-badge-header { flex-direction: column; text-align: center; gap: 16px; }
          .ai-badge-avatar { width: 72px; height: 72px; }
          .ai-badge h2 { font-size: 22px; }
          .ai-badge-content p { font-size: 14px; }
          .ai-badge-quote { font-size: 13px; padding: 12px 14px; }
          
          .floating-chat-fab {
            width: 60px;
            height: 60px;
            bottom: 16px;
            right: 16px;
          }
          .floating-chat-panel {
            left: 12px;
            right: 12px;
            bottom: 90px;
            width: auto;
          }
        }
      `}</style>

      {/* Header */}
      <header className="landing-container landing-header">
        <div className="landing-brand">
          <img src="/assets/heart-icon.png" alt="MédicoHelp" className="logo-img" />
          <div className="title">MédicoHelp</div>
        </div>
        
        <nav className="landing-nav">
          <a href="#recursos">Recursos</a>
          <a href="/legal/termo.html" target="_blank" rel="noopener noreferrer">Termo de Uso</a>
          <button 
            className="landing-btn landing-btn-primary" 
            onClick={() => setLocation("/register")}
            data-testid="button-cadastro"
          >
            Entrar
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="landing-container">
        {/* Hero Section */}
        <section className="landing-hero" aria-label="Apresentação da Dra. Clarice">
          <h1>
            Decisão clínica rápida, do jeito tradicional
            <span className="subtitle">"Feita por médicos, para médicos."</span>
          </h1>
          <div className="underline" aria-hidden="true"></div>
          
          <p className="lead">
            A Dra. Clarice apoia sua conduta com respostas objetivas <b>(Modo Clínico)</b> e explicações baseadas em evidências <b>(Fundamentação Teórica)</b>, além de ferramentas práticas <b>(MedPrime: calculadoras e posologia)</b>.
          </p>
          
          <div className="pills" role="list" aria-label="Modos de uso">
            <span className="pill pill--clinico" role="listitem" data-testid="pill-clinico">
              <span className="dot" aria-hidden="true"></span>
              Modo Clínico
            </span>
            <span className="pill pill--teorico" role="listitem" data-testid="pill-teorico">
              <span className="dot" aria-hidden="true"></span>
              Fundamentação Teórica
            </span>
            <span className="pill pill--medprime" role="listitem" data-testid="pill-medprime">
              <span className="dot" aria-hidden="true"></span>
              MedPrime
            </span>
          </div>
          
          <p className="disclaimer">Clareza, segurança e medicina de verdade — do jeito que sempre funcionou.</p>
          
          <div style={{ marginTop: '20px', color: '#1affb8', fontWeight: '600', fontSize: '15px', textAlign: 'center' }}>
            💬 Sabia que você pode até "ligar" para a Dra. Clarice?<br />
            Clique abaixo e ela te atende pessoalmente!
          </div>
          
          <div className="landing-cta">
            <button 
              className="landing-btn landing-btn-primary" 
              onClick={handleAudioCall}
              data-testid="button-ligar-clarice"
            >
              {audioButtonText}
            </button>
            <button 
              className="landing-btn landing-btn-primary" 
              onClick={() => setLocation("/register")}
              data-testid="button-comecar"
            >
              Começar agora
            </button>
            <a className="landing-btn" href="#recursos" data-testid="link-recursos">Conhecer recursos</a>
          </div>
          
          {/* Hidden audio element */}
          <audio ref={audioRef} preload="auto">
            <source src="/audio/clarice_ligacao.mp3?v=2" type="audio/mpeg" />
            Seu navegador não suporta áudio.
          </audio>
        </section>

        {/* ===================== MÉDICOHELP - SEÇÃO DESTAQUE ===================== */}
        <section className="mh-wrap" aria-label="O que é MédicoHelp">
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div className="mh-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mh-ico">
                <path d="M12 2v6M7 4.5A9 9 0 1 0 21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              POWERED BY GPT-5
            </div>
          </div>

          <h2 className="mh-title">Plataforma médica inteligente — direta, confiável e pronta para o plantão</h2>
          <p className="mh-sub">Condutas objetivas, evidências clínicas e ferramentas práticas para o dia a dia do médico.</p>

          <div className="mh-section-title">O QUE É</div>
          <div className="mh-grid" role="list">
            <article className="mh-card" role="listitem" tabIndex={0}>
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7h16M7 4v6m5 5v5m0-5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Modo Clínico
              </h4>
              <p>Respostas passo a passo, linguagem médica tradicional. Protocolos de PS (dor torácica, dispneia, febre, convulsão, dor abdominal etc.).</p>
            </article>

            <article className="mh-card" role="listitem" tabIndex={0}>
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M5 4h14v14H5zM9 8h6m-6 4h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 20h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Evidências Clínicas
              </h4>
              <p>Explicações com base científica, raciocínio terapêutico e referências atualizadas. Ideal para registrar fundamentação teórica.</p>
            </article>

            <article 
              className="mh-card" 
              role="listitem" 
              tabIndex={0}
              onClick={() => setLocation("/medprime")}
              data-testid="card-medprime"
            >
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12h8m4 0h4M8 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                MedPrime (Calculadoras)
              </h4>
              <p>Dose mg/kg, ajustes renal/gestante, conversões para mL/comprimidos, limites por dose/dia. Rápido, preciso e auditável.</p>
            </article>
          </div>

          <div className="mh-hr" role="separator" aria-hidden="true"></div>

          <div className="mh-section-title">RECURSOS</div>
          <h3 className="mh-kicker" style={{ textAlign: 'center' }}>Ferramentas que resolvem na prática</h3>

          <div className="mh-grid" role="list">
            <article className="mh-card span-6" role="listitem" tabIndex={0} data-testid="card-anexos">
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M8 12v5a4 4 0 0 0 8 0v-7a3 3 0 1 0-6 0v7a2 2 0 1 0 4 0v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Anexos: foto, áudio e PDF
              </h4>
              <p>Envie imagens de exames ou lesões de pele — a IA descreve automaticamente (cor, bordas, tamanho, padrão) e gera texto clínico pronto. PDFs/laudos são interpretados e liberados digitados para colar na história clínica.</p>
            </article>

            <article className="mh-card span-6" role="listitem" tabIndex={0} onClick={handleAudioCall} data-testid="card-voz">
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Zm8 9a8 8 0 0 1-16 0m8 8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Modo Voz "Ligar para a Dra. Clarice"
              </h4>
              <p>Ícone de telefone inicia a chamada simulada. Tire dúvidas de conduta, posologia e interpretação por voz, em tempo real.</p>
            </article>

            <article className="mh-card span-6" role="listitem" tabIndex={0} data-testid="card-imagens">
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M4 5h16v14H4zM7 14l3-3 3 3 3-4 1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Interpretação de Imagens Médicas
              </h4>
              <p>RX, USG, TC, RM e Dermatologia. Ajuda na leitura e correlação clínica, com resumo estruturado pronto para a anamnese.</p>
            </article>

            <article className="mh-card span-6" role="listitem" tabIndex={0} data-testid="card-soap">
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Histórias Clínicas Automáticas (SOAP ou Personalizada)
              </h4>
              <p>Gere SOAP tradicional ou um modelo personalizado ao seu estilo. Tudo limpo, objetivo e pronto para o prontuário.</p>
            </article>

            <article className="mh-card span-6" role="listitem" tabIndex={0} onClick={() => setLocation("/medprime")} data-testid="card-calc">
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Calculadoras Inteligentes
              </h4>
              <p>Peça os cálculos pela IA (doses, correções, scores) ou acesse direto o módulo <strong>MedPrime</strong> com todas as calculadoras.</p>
            </article>

            <article className="mh-card span-6" role="listitem" tabIndex={0}>
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a6 6 0 0 0-6 6v3H4v7h16v-7h-2V8a6 6 0 0 0-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M10 15l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Segurança e LGPD
              </h4>
              <p>Cadastro controlado (CRM/UF ou Aluno 6º ano com universidade), termo de confidencialidade e verificação por e-mail/WhatsApp.</p>
            </article>
          </div>

          <div className="mh-hr" role="separator" aria-hidden="true"></div>

          <div className="mh-section-title">EM BREVE</div>
          <div className="mh-grid" role="list">
            <article className="mh-card span-8" role="listitem" tabIndex={0}>
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M12 7v10m-5-5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Especialidades Avançadas
              </h4>
              <p>Condutas personalizadas para gestantes e lactantes, pediatria, cardiologia e mais — incluindo alertas e ajustes de tratamento.</p>
            </article>

            <article className="mh-card span-6" role="listitem" tabIndex={0}>
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M7 11a5 5 0 1 1 10 0v3a5 5 0 1 1-10 0v-3Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 4v3m0 10v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Módulo Pré-natal Inteligente
              </h4>
              <p>IG automática, acompanhamento de exames, relatórios e alertas de risco gestacional para agilizar o pré-natal.</p>
            </article>

            <article className="mh-card span-6" role="listitem" tabIndex={0}>
              <h4>
                <svg className="mh-ico" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18v12H3zM8 18v3h8v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Atendimentos Digitais
              </h4>
              <p>Consultas por vídeo integradas, emissão de receitas, laudos e pedidos — com validação via Memed (roadmap).</p>
            </article>
          </div>
        </section>

        {/* AI Assistant Badge - Revolutionary */}
        <div className="landing-container ai-badge-container">
          <div className="ai-badge">
            <div className="ai-badge-header">
              <img 
                src="/assets/clarice-hero.png" 
                alt="Dra. Clarice" 
                className="ai-badge-avatar"
                data-testid="img-clarice-badge"
              />
              <div className="ai-badge-title-area">
                <span className="ai-badge-powered">🤖 POWERED BY GPT-5</span>
                <h2>Conheça a Dra. Clarice</h2>
              </div>
            </div>
            <div className="ai-badge-content">
              <p>
                Sua <span className="ai-badge-highlight">assistente médica inteligente</span> disponível 24/7, treinada com conhecimento médico atualizado e pronta para apoiar suas decisões clínicas.
              </p>
              <p>
                💡 <strong>Respostas em segundos</strong> — Condutas objetivas, evidências científicas e ferramentas práticas para o dia a dia médico.
              </p>
              <div className="ai-badge-quote">
                "Do plantão ao consultório, a Dra. Clarice está sempre ao seu lado — <span className="ai-badge-highlight">sem julgamentos, sem pressa, com toda a medicina que você precisa.</span>"
              </div>
            </div>
          </div>
        </div>

        {/* Como Funciona */}
        <section id="como-funciona" className="landing-section">
          <span className="landing-kicker">O que é</span>
          <h2>Plataforma médica inteligente — direta, confiável e pronta para o plantão</h2>
          <div className="landing-grid-3">
            <div className="landing-card">
              <h3>🩺 Modo Clínico</h3>
              <p className="landing-bullets">
                Respostas objetivas, passo a passo, linguagem médica tradicional. Protocolos de pronto-socorro (dor torácica, dispneia, febre etc.).
              </p>
            </div>
            <div className="landing-card">
              <h3>📚 Evidências Clínicas</h3>
              <p className="landing-bullets">
                Explicações com base científica, racional terapêutico e referências. Bom para discutir caso e registrar fundamentação.
              </p>
            </div>
            <div className="landing-card">
              <h3>⚕️ MedPrime (Calculadoras)</h3>
              <p className="landing-bullets">
                Dose mg/kg, ajustes renal/gestante, conversão para mL/comprimidos, máximos por dose/dia. Tudo rápido e auditável.
              </p>
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="landing-section">
          <span className="landing-kicker">Recursos</span>
          <h2>Ferramentas que resolvem na prática</h2>
          <div className="landing-grid-3">
            <div className="landing-card">
              <h3>📎 Anexos: foto, áudio e PDF</h3>
              <p className="landing-bullets">Envie imagem do exame, áudio do relato ou PDF do laudo para contextualizar o atendimento.</p>
            </div>
            <div className="landing-card">
              <h3>🎙️ Modo Voz "Ligar para a Dra. Clarice"</h3>
              <p className="landing-bullets">Ícone de telefone inicia a chamada simulada; integração real pode usar WebRTC/SDK conforme necessidade.</p>
            </div>
            <div className="landing-card">
              <h3>🛡️ Segurança e LGPD</h3>
              <p className="landing-bullets">Cadastro controlado (CRM/UF ou Aluno 6º ano com universidade), termo de confidencialidade e verificação por e-mail/WhatsApp.</p>
            </div>
          </div>
        </section>

        {/* Para Quem É */}
        <section className="landing-section">
          <span className="landing-kicker">Para quem é</span>
          <h2>Médicos e alunos do 6º ano</h2>
          <ul className="landing-list">
            <li>Médicos: CRM e UF obrigatórios.</li>
            <li>Alunos 6º ano: informar universidade e aceitar termo.</li>
            <li>Login por e-mail; aprovação administrativa para ativação completa.</li>
          </ul>
          <div className="landing-cta" style={{ marginTop: '14px' }}>
            <button 
              className="landing-btn landing-btn-primary" 
              onClick={() => setLocation("/register")}
              data-testid="button-cadastro-footer"
            >
              Fazer cadastro
            </button>
            <a className="landing-btn" href="/legal/termo.html" target="_blank" rel="noopener noreferrer">Ler termo</a>
          </div>
        </section>

        {/* Contato */}
        <section className="landing-section">
          <span className="landing-kicker">Contato</span>
          <h2>Fale com a equipe</h2>
          <div className="contact-buttons">
            <a 
              href="https://wa.me/5544991065757?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20MédicoHelp" 
              className="contact-btn contact-btn-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="button-whatsapp"
            >
              <FaWhatsapp />
              WhatsApp: (44) 9106-5757
            </a>
            <a 
              href="mailto:sic@medicohelp.com.br?subject=Contato%20-%20MédicoHelp"
              className="contact-btn contact-btn-email"
              data-testid="button-email"
            >
              <Mail />
              sic@medicohelp.com.br
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-container landing-footer">
        © 2025 MédicoHelp · <strong>C.J.Dumke Tecnologia e Saúde LTDA / MEI</strong> · <a href="/legal/privacidade.html" target="_blank" rel="noopener noreferrer">Privacidade</a>
      </footer>

      {/* Floating Chat Button (FAB) */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="floating-chat-fab"
        data-testid="button-floating-chat"
        aria-label="Abrir chat da Dra. Clarice"
        title="Falar com a Dra. Clarice"
      >
        <img 
          src="/assets/clarice-hero.png" 
          alt="Dra. Clarice" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            borderRadius: '50%' 
          }}
        />
      </button>

      {/* Floating Chat Panel */}
      {chatOpen && (
        <div className="floating-chat-panel" data-testid="panel-floating-chat">
          {/* Header */}
          <div className="floating-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/assets/clarice-hero.png" 
                alt="Dra. Clarice" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  objectFit: 'cover' 
                }}
              />
              <div>
                <div style={{ fontWeight: 700, lineHeight: 1 }}>Dra. Clarice</div>
                <div style={{ fontSize: '12px', opacity: 0.85 }}>Assistente virtual do MédicoHelp</div>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="floating-chat-close"
              data-testid="button-close-chat"
              aria-label="Fechar chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="floating-chat-messages">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`floating-chat-message ${msg.sender}`}
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
            ))}
          </div>

          {/* Input */}
          <div className="floating-chat-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite sua mensagem..."
              data-testid="input-chat-message"
            />
            <button 
              onClick={handleSendMessage}
              data-testid="button-send-message"
              className="floating-chat-send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
