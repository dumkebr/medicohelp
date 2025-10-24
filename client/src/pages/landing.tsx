import { useState, useRef } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [audioButtonText, setAudioButtonText] = useState("📞 Ligar para a Dra. Clarice");
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleAudioCall = () => {
    setAudioButtonText("🔔 Ligando para a Dra. Clarice...");
    
    setTimeout(() => {
      setAudioButtonText("📞 Conversando com Dra. Clarice");
      
      if (audioRef.current) {
        audioRef.current.src = "/audio/alo_doutor.mp3";
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
        
        /* Clarice Card */
        .clarice-card { display: flex; align-items: center; gap: 32px; background: linear-gradient(135deg, #0a3834 0%, #0c4540 100%); border-radius: 24px; padding: 40px; margin: 60px auto; max-width: 900px; box-shadow: 0 20px 60px rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.08); position: relative; overflow: hidden; }
        .clarice-card::before { content: ''; position: absolute; top: -50%; right: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(31,183,166,0.15) 0%, transparent 70%); border-radius: 50%; }
        .clarice-card-image { width: 280px; height: 280px; border-radius: 50%; object-fit: cover; border: 4px solid var(--teal); box-shadow: 0 10px 40px rgba(31,183,166,.3); flex-shrink: 0; background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%); }
        .clarice-card-content { flex: 1; z-index: 1; }
        .clarice-card-badge { display: inline-block; background: rgba(31,183,166,.2); border: 1px solid var(--teal); color: var(--teal); padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .clarice-card h2 { font-size: 32px; font-weight: 800; margin: 0 0 12px; line-height: 1.2; }
        .clarice-card p { font-size: 17px; line-height: 1.6; color: var(--muted); margin: 0 0 10px; }
        .clarice-card-highlight { color: var(--teal); font-weight: 700; }
        
        .landing-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .landing-card { background: var(--bg-2); padding: 20px; border-radius: var(--radius); box-shadow: var(--shadow); }
        .landing-card h3 { margin: 0 0 8px; }
        .landing-bullets { line-height: 1.7; color: var(--muted); }
        .landing-section { padding: 40px 0; }
        .landing-kicker { color: var(--teal); text-transform: uppercase; font-size: 12px; letter-spacing: 0.18em; }
        .landing-section h2 { margin: 6px 0 8px; font-size: 28px; }
        .landing-footer { padding: 26px 0; color: var(--muted); font-size: 14px; border-top: 1px solid rgba(255,255,255,.1); margin-top: 30px; }
        .landing-list { margin: 0; padding-left: 18px; color: var(--muted); }
        
        @media (max-width: 900px) {
          .landing-grid-3 { grid-template-columns: 1fr; }
          .landing-hero h1 { font-size: clamp(24px, 5vw, 40px); }
          .clarice-card { flex-direction: column; text-align: center; padding: 30px 20px; }
          .clarice-card-image { width: 200px; height: 200px; }
          .clarice-card h2 { font-size: 26px; }
          .clarice-card p { font-size: 16px; }
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
          <a href="/termo-confidencialidade">Confidencialidade</a>
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
          <h1>Decisão clínica rápida, do jeito tradicional Feita por médicos, para médicos.</h1>
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
            <source src="/audio/alo_doutor.mp3" type="audio/mpeg" />
            Seu navegador não suporta áudio.
          </audio>
        </section>

        {/* Clarice Presentation Card */}
        <div className="landing-container">
          <div className="clarice-card">
            <img 
              src="/assets/clarice-hero.png" 
              alt="Dra. Clarice - Assistente Médica IA" 
              className="clarice-card-image"
              data-testid="img-clarice-hero"
            />
            <div className="clarice-card-content">
              <span className="clarice-card-badge">🤖 Powered by GPT-5</span>
              <h2>Conheça a Dra. Clarice</h2>
              <p>
                Sua <span className="clarice-card-highlight">assistente médica inteligente</span> disponível 24/7, 
                treinada com conhecimento médico atualizado e pronta para apoiar suas decisões clínicas.
              </p>
              <p>
                💡 <strong>Respostas em segundos</strong> — Condutas objetivas, evidências científicas e 
                ferramentas práticas para o dia a dia médico.
              </p>
              <p style={{ marginTop: '16px', fontSize: '15px', fontStyle: 'italic' }}>
                "Do plantão ao consultório, a Dra. Clarice está sempre ao seu lado — 
                <span className="clarice-card-highlight"> sem julgamentos, sem pressa, com toda a medicina que você precisa.</span>"
              </p>
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
            <a className="landing-btn" href="/termo-confidencialidade">Ler termo</a>
          </div>
        </section>

        {/* Contato */}
        <section className="landing-section">
          <span className="landing-kicker">Contato</span>
          <h2>Fale com a equipe</h2>
          <p className="landing-bullets">
            WhatsApp: <strong>+55 44 9106-5757</strong> · E-mail: <strong>sic@medicohelp.com.br</strong>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-container landing-footer">
        © 2025 MédicoHelp · Desenvolvido por Dr. Clairton Luis Dumke (CRM PR 53866) · <a href="/privacidade">Privacidade</a>
      </footer>
    </div>
  );
}
