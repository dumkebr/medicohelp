import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { FaWhatsapp } from "react-icons/fa";
import { Mail, X, Send } from "lucide-react";
import { loadAllKB, findAnswer, handleAction, logQuestion, type KBItem } from "@/lib/clarice-brain";
import HeroClarice from "@/components/HeroClarice";
import FeaturesSection from "@/components/FeaturesSection";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [audioButtonText, setAudioButtonText] = useState("📞 Ligar para a Dra. Clarice");
  const [chatOpen, setChatOpen] = useState(false);
  const [recursosModalOpen, setRecursosModalOpen] = useState(false);
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

  // Setup window.MedicoHelp global API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ROUTES: Record<string, string> = {
        home: '/',
        history: '/',
        voice: '/',
        medprime: '/medprime',
        calculators: '/medprime',
        upload: '/',
        evidence: '/',
        avancado: '/avancado',
        recursos: '/',
        prenatal: '/',
        posologia: '/medprime',
        admin: '/admin-api.html'
      };

      (window as any).MedicoHelp = {
        // Navegação genérica (ajustada para Wouter SPA)
        navigate: (routeKeyOrUrl: string) => {
          const url = ROUTES[routeKeyOrUrl] || routeKeyOrUrl || '/';
          // Usa o hook interno da SPA (Wouter)
          if (url.startsWith('/')) {
            setLocation(url);
          } else {
            // Fallback: recarrega página se não for rota interna
            window.location.href = url;
          }
        },
        
        // Abre História Clínica (modo SOAP por padrão)
        createHistory: ({ mode = 'SOAP' }: { mode?: string } = {}) => {
          setLocation('/');
        },
        
        // Abre o Modo Voz / "ligar para a Dra. Clarice"
        openVoice: () => {
          handleAudioCall();
        },
        
        // Upload de exames
        openUploader: () => {
          setLocation('/');
        },
        
        // Acessos rápidos
        openCalculators: () => {
          setLocation('/medprime');
        },
        
        openEvidence: () => {
          setLocation('/');
        },
        
        openMedPrime: () => {
          setLocation('/medprime');
        },
        
        // Novos atalhos
        openRecursos: () => {
          setLocation('/');
        },
        
        openPreNatal: () => {
          setLocation('/');
        },
        
        openPosologia: () => {
          setLocation('/medprime');
        },
        
        openAdmin: () => {
          window.open('/admin-api.html', '_blank', 'noopener,noreferrer');
        }
      };

      // Log discreto para depuração
      console.debug('[MédicoHelp] API global inicializada. Rotas:', ROUTES);
    }
  }, [setLocation]);

  return (
    <div className="mh-landing-root" style={{ 
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", Arial, sans-serif',
      color: '#f3f7f6',
      background: 'linear-gradient(180deg, #0b3332, #0d3b3a)',
      minHeight: '100vh',
      overflowX: 'hidden',
      maxWidth: '100vw'
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
        
        /* MédicoHelp Section Styles - Green & White Theme */
        .mh-wrap { background: #f7fdf9; padding: 80px 20px; font-family: Inter, system-ui, Arial, sans-serif; color: #1a1a1a; }
        .mh-container { max-width: 1100px; margin: 0 auto; text-align: center; }
        .mh-title { font-size: 2.2rem; font-weight: 700; color: #007a4d; margin-bottom: 10px; }
        .mh-title span { color: #009e5a; }
        .mh-desc { font-size: 1.1rem; line-height: 1.6; max-width: 800px; margin: 0 auto 40px; color: #ffffff !important; }
        .mh-sub { font-size: 1.1rem; line-height: 1.6; max-width: 800px; margin: 0 auto 40px; color: #ffffff !important; }
        .mh-blocks { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 60px; }
        .mh-block { background: #ffffff; border: 1px solid #d9f2e2; border-radius: 12px; padding: 25px 20px; box-shadow: 0 3px 10px rgba(0,0,0,.04); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
        .mh-block:hover { transform: translateY(-5px); box-shadow: 0 6px 15px rgba(0,0,0,.08); }
        .mh-block h3 { color: #000000 !important; font-weight: 600; margin-bottom: 10px; font-size: 1.1rem; }
        .mh-block p { color: #000000 !important; line-height: 1.6; margin: 0; }
        .mh-list { list-style: none; padding: 0; margin: 0 auto 40px; max-width: 600px; text-align: left; }
        .mh-list li { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); font-size: 1rem; color: #ffffff !important; }
        .mh-subtitle { font-size: 1.6rem; font-weight: 600; color: #007a4d; margin: 50px 0 15px; text-align: center; }
        .mh-section-title { font-size: 1.6rem; font-weight: 600; color: #007a4d; margin: 50px 0 20px; text-align: center; text-transform: uppercase; letter-spacing: 0.1em; }
        .mh-kicker { font-size: 1.1rem; color: #333; margin-bottom: 30px; text-align: center; font-weight: 500; }
        .mh-hr { height: 1px; background: #d9f2e2; margin: 50px auto; max-width: 600px; }
        .mh-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .mh-card { background: #ffffff; border: 1px solid #d9f2e2; border-radius: 12px; padding: 25px 20px; box-shadow: 0 3px 10px rgba(0,0,0,.04); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; text-align: left; }
        .mh-card:hover { transform: translateY(-5px); box-shadow: 0 6px 15px rgba(0,0,0,.08); }
        .mh-card h4 { color: #000000 !important; font-weight: 700; margin-bottom: 12px; font-size: 1.2rem; line-height: 1.3; }
        .mh-card p { color: #000000 !important; line-height: 1.6; margin: 0; font-size: 1rem; font-weight: 400; }
        .mh-cta { display: flex; justify-content: center; gap: 16px; margin-top: 40px; flex-wrap: wrap; }
        .mh-cta button { background: #009e5a; color: #fff; border: none; padding: 14px 28px; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600; transition: background 0.2s ease; }
        .mh-cta button:hover { background: #007a4d; }
        .mh-chip { display: inline-flex; gap: 8px; align-items: center; background: #e8f8f0; color: #007a4d; padding: 6px 12px; border-radius: 999px; border: 1px solid #d9f2e2; font-weight: 700; font-size: 12px; margin-bottom: 10px; }
        .mh-chip-green { display: inline-flex; gap: 8px; align-items: center; background: #e8f8f0; color: #007a4d; padding: 6px 12px; border-radius: 999px; border: 1px solid #d9f2e2; font-weight: 700; font-size: 12px; margin-bottom: 10px; }
        .mh-ico { width: 18px; height: 18px; color: #007a4d; flex: 0 0 18px; }
        .mh-ico-green { width: 18px; height: 18px; color: #007a4d; flex: 0 0 18px; }
        @media (max-width: 768px) {
          .mh-title { font-size: 1.8rem; }
          .mh-subtitle { font-size: 1.4rem; }
          .mh-section-title { font-size: 1.4rem; }
          .mh-desc { font-size: 1rem; }
          .mh-sub { font-size: 1rem; }
        }
        
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
          width: min(380px, calc(100vw - 40px));
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
        
        /* Modal Recursos */
        .recursos-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        
        .recursos-modal-content {
          position: relative;
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          background: linear-gradient(180deg, #0b3332, #0d3b3a);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }
        
        .recursos-modal-scroll {
          max-height: 90vh;
          overflow-y: auto;
          padding: 20px;
        }
        
        .recursos-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(25, 194, 158, 0.3);
          color: #19c29e;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
          backdrop-filter: blur(8px);
        }
        
        .recursos-modal-close:hover {
          background: rgba(25, 194, 158, 0.2);
          border-color: #19c29e;
          transform: rotate(90deg);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 900px) {
          .landing-container { padding: 16px; }
          .landing-header { 
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 12px 0;
          }
          .landing-brand { width: 100%; }
          .landing-brand .title { font-size: 22px; }
          .landing-nav { 
            flex-wrap: wrap;
            gap: 8px;
            width: 100%;
            justify-content: flex-start;
          }
          .landing-nav a, .landing-btn { 
            padding: 10px 16px;
            font-size: 14px;
            white-space: nowrap;
            flex: 0 0 auto;
          }
          
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
          
          .recursos-modal-content {
            max-width: 100%;
            border-radius: 16px;
          }
          
          .recursos-modal-close {
            width: 40px;
            height: 40px;
            top: 12px;
            right: 12px;
          }
        }
        
        @media (max-width: 640px) {
          .landing-header { gap: 12px; }
          .landing-brand .title { font-size: 20px; }
          .landing-nav { 
            gap: 6px;
            flex-direction: column;
            width: 100%;
          }
          .landing-nav a, .landing-btn { 
            width: 100%;
            text-align: center;
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
            onClick={() => setLocation("/login")}
            data-testid="button-entrar"
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
            <button 
              className="landing-btn" 
              onClick={() => setRecursosModalOpen(true)}
              data-testid="button-conhecer-recursos"
            >
              Conhecer recursos
            </button>
          </div>
          
          {/* Hidden audio element */}
          <audio ref={audioRef} preload="auto">
            <source src="/audio/clarice_ligacao.mp3?v=2" type="audio/mpeg" />
            Seu navegador não suporta áudio.
          </audio>
        </section>

        {/* ===================== MÉDICOHELP - SEÇÃO DESTAQUE ===================== */}
        <section className="mh-wrap" aria-label="O que é MédicoHelp">
          <div className="mh-container">
            
            <h2 className="mh-title">O QUE É O <span>MédicoHelp</span></h2>
            <p className="mh-desc">
              Plataforma médica feita por médicos, para médicos. 
              Centraliza o atendimento, auxilia em decisões clínicas e agiliza seu trabalho.
            </p>

            <div className="mh-blocks">
              <div className="mh-block" onClick={() => setLocation("/")} data-testid="block-clinico">
                <h3>🩺 Modo Clínico</h3>
                <p>História clínica estruturada (SOAP ou personalizada), interpretação de exames e geração automática de relatórios.</p>
              </div>
              <div className="mh-block" onClick={() => setLocation("/")} data-testid="block-evidencias">
                <h3>📚 Evidências</h3>
                <p>Base científica integrada — diretrizes, protocolos e fundamentos teóricos revisados para cada decisão médica.</p>
              </div>
              <div className="mh-block" onClick={() => setLocation("/medprime")} data-testid="block-medprime">
                <h3>💊 MedPrime</h3>
                <p>Acesso rápido à posologia segura, cálculo automático de dose e alertas de gestação, pediatria e função renal.</p>
              </div>
            </div>

            <h2 className="mh-subtitle">🧩 RECURSOS PRINCIPAIS</h2>
            <ul className="mh-list">
              <li>📋 História Clínica Automatizada</li>
              <li>🗣️ Modo Voz — converse diretamente com a Dra. Clarice</li>
              <li>📎 Upload de exames e laudos com leitura automática</li>
              <li>💬 Geração de condutas e prescrições com validação Memed</li>
              <li>🧠 Calculadoras clínicas integradas</li>
              <li>👩‍⚕️ Modo avançado com fundamentação teórica</li>
            </ul>

            <h2 className="mh-subtitle">🚀 EM BREVE</h2>
            <p className="mh-desc">
              Especialidades avançadas (gestantes, lactantes, pediatria e emergência),
              vídeoatendimento médico pela plataforma, geração de relatórios inteligentes e integração completa com o PosologiaCerta.
            </p>

            <div className="mh-cta">
              <button onClick={() => setLocation("/register")} data-testid="button-abrir-historia">Abrir História Clínica</button>
              <button onClick={handleAudioCall} data-testid="button-falar-clarice">Falar com a Dra. Clarice</button>
            </div>

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

      {/* Modal Conhecer Recursos */}
      {recursosModalOpen && (
        <div 
          className="recursos-modal-overlay"
          onClick={() => setRecursosModalOpen(false)}
        >
          <div 
            className="recursos-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="recursos-modal-close"
              onClick={() => setRecursosModalOpen(false)}
              data-testid="button-close-recursos"
              aria-label="Fechar modal de recursos"
            >
              <X size={28} />
            </button>
            
            <div className="recursos-modal-scroll">
              <HeroClarice />
              <FeaturesSection />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
