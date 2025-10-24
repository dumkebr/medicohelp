import { useState, useRef } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [showCallModal, setShowCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState("Ligando para Dra. Clarice…");
  const [audioButtonText, setAudioButtonText] = useState("📞 Ligar para a Dra. Clarice");
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleMicClick = () => {
    alert("Microfone: gravar e transcrever (placeholder).");
  };

  const handlePhoneClick = () => {
    setShowCallModal(true);
    setCallStatus("Ligando para Dra. Clarice…");
    setTimeout(() => {
      setCallStatus("Conectado com Dra. Clarice (simulação)");
    }, 1200);
  };

  const handleCloseCall = () => {
    setShowCallModal(false);
    setCallStatus("Ligando para Dra. Clarice…");
  };

  const handleAudioCall = () => {
    console.log("[AUDIO CALL] Button clicked at", Date.now());
    setAudioButtonText("🔔 Ligando para a Dra. Clarice...");
    console.log("[AUDIO CALL] State set to 'Ligando...'");
    
    // Change to "Conversando" after simulated dial time
    const timer1 = setTimeout(() => {
      console.log("[AUDIO CALL] Timeout 1 fired (1800ms) - setting to 'Conversando'");
      setAudioButtonText("📞 Conversando com Dra. Clarice");
      
      // Try to play audio (best effort - may be blocked by browser)
      if (audioRef.current) {
        audioRef.current.src = "/audio/alo_doutor.mp3";
        audioRef.current.load();
        audioRef.current.play().catch((error) => {
          console.log("Audio autoplay blocked (expected in browsers):", error.message);
        });
      }
      
      // Reset button after conversation duration (6 seconds)
      const timer2 = setTimeout(() => {
        console.log("[AUDIO CALL] Timeout 2 fired (6000ms) - resetting to 'Ligar'");
        setAudioButtonText("📞 Ligar para a Dra. Clarice");
      }, 6000);
      console.log("[AUDIO CALL] Timer 2 set (ID:", timer2, ")");
    }, 1800);
    console.log("[AUDIO CALL] Timer 1 set (ID:", timer1, ")");
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
        .landing-brand { display: flex; align-items: center; gap: 14px; }
        .landing-brand .logo-img { height: 44px; width: auto; border-radius: 8px; box-shadow: var(--shadow); }
        .landing-brand .brand-content { display: flex; align-items: center; gap: 12px; }
        .landing-brand .title { font-weight: 700; font-size: 26px; letter-spacing: 0.2px; }
        .landing-brand .heart-icon { height: 32px; width: 32px; }
        .landing-nav { display: flex; gap: 12px; }
        .landing-nav a, .landing-btn { background: transparent; border: 1px solid rgba(255,255,255,.15); padding: 10px 14px; border-radius: 12px; color: var(--text); cursor: pointer; text-decoration: none; display: inline-block; }
        .landing-btn-primary { background: var(--teal); border: none; color: #042c28; font-weight: 700; }
        .landing-btn-primary:hover { background: var(--teal-2); }
        .landing-hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: center; padding: 20px 0 10px; }
        .landing-hero-card { background: var(--bg-2); border-radius: var(--radius); box-shadow: var(--shadow); padding: 24px; }
        .landing-hero h1 { font-size: 40px; line-height: 1.1; margin: 0 0 12px; }
        .landing-hero p { color: var(--muted); font-size: 18px; }
        .landing-cta { margin-top: 16px; display: flex; gap: 12px; }
        .landing-chatbox { margin-top: 14px; background: #0c2b27; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 12px; display: flex; gap: 10px; align-items: center; }
        .landing-chatbox input { flex: 1; background: transparent; border: none; color: var(--text); font-size: 16px; outline: none; }
        .landing-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; background: #0b2522; border: 1px solid rgba(255,255,255,.12); cursor: pointer; }
        .landing-icon-btn:hover { background: #103330; }
        .landing-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .landing-card { background: var(--bg-2); padding: 20px; border-radius: var(--radius); box-shadow: var(--shadow); }
        .landing-card h3 { margin: 0 0 8px; }
        .landing-bullets { line-height: 1.7; color: var(--muted); }
        .landing-section { padding: 40px 0; }
        .landing-kicker { color: var(--teal); text-transform: uppercase; font-size: 12px; letter-spacing: 0.18em; }
        .landing-section h2 { margin: 6px 0 8px; font-size: 28px; }
        .landing-footer { padding: 26px 0; color: var(--muted); font-size: 14px; border-top: 1px solid rgba(255,255,255,.1); margin-top: 30px; }
        .landing-hero-mini { display: flex; gap: 22px; align-items: center; }
        .landing-hero-mini img { height: 220px; border-radius: 16px; box-shadow: var(--shadow); }
        .landing-bubble { background: #0f2f2b; padding: 16px 18px; border-radius: 16px; max-width: 520px; box-shadow: var(--shadow); }
        .landing-badge { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #0f2f2b; border: 1px solid rgba(255,255,255,.12); color: var(--muted); font-size: 12px; margin-right: 6px; }
        .landing-list { margin: 0; padding-left: 18px; color: var(--muted); }
        .landing-notice { background: #0e2623; border-left: 4px solid var(--teal); padding: 12px 14px; border-radius: 8px; color: var(--muted); }
        @media (max-width: 900px) {
          .landing-hero { grid-template-columns: 1fr; }
          .landing-grid-3 { grid-template-columns: 1fr; }
          .landing-hero-mini img { height: 160px; }
        }
      `}</style>

      {/* Header */}
      <header className="landing-container landing-header">
        <div className="landing-brand">
          <img src="/assets/logo_main.png" alt="MédicoHelp logo" className="logo-img" />
          <div className="brand-content">
            <div className="title">MédicoHelp</div>
            <img src="/assets/heart-icon.png" alt="Ícone médico" className="heart-icon" />
          </div>
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
        <section className="landing-hero">
          <div className="landing-hero-card">
            <span className="landing-kicker">Apresentamos a Dra. Clarice</span>
            <h1>Decisão clínica rápida, do jeito tradicional — feita por médicos, para médicos.</h1>
            <p style={{ marginBottom: '12px' }}>A Dra. Clarice apoia sua conduta com respostas objetivas (<strong>Modo Clínico</strong>), explicações baseadas em evidências e ferramentas práticas (<strong>MedPrime</strong>: calculadoras e posologia). Clareza, segurança e medicina de verdade — do jeito que sempre funcionou.</p>
            <p style={{ color: '#1affb8', fontWeight: '600', marginBottom: '16px' }}>
              💬 Sabia que você pode até "ligar" para a Dra. Clarice?<br />
              Clique abaixo e ela te atende pessoalmente!
            </p>
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
              <a className="landing-btn" href="#como-funciona">Como funciona</a>
            </div>
            
            {/* Hidden audio element */}
            <audio ref={audioRef} preload="auto">
              <source src="/audio/alo_doutor.mp3" type="audio/mpeg" />
              Seu navegador não suporta áudio.
            </audio>
            <div className="landing-chatbox" style={{ marginTop: '18px' }}>
              <input placeholder="Digite sua mensagem…" data-testid="input-demo-message" />
              <button 
                className="landing-icon-btn" 
                onClick={handleMicClick}
                title="Falar com a Dra. Clarice (transcrever)"
                data-testid="button-mic"
              >
                🎙️
              </button>
              <button 
                className="landing-icon-btn" 
                onClick={handlePhoneClick}
                title="Ligar para a Dra. Clarice (modo voz)"
                data-testid="button-phone"
              >
                📞
              </button>
            </div>
            <div className="landing-notice" style={{ marginTop: '10px' }}>
              Dica: Modo voz mostra um painel de ligação para a Dra. Clarice (simulação). Integração real pode ser acoplada depois.
            </div>
          </div>
          <div className="landing-hero-mini">
            <img src="/assets/clarice_png.png" alt="Dra. Clarice" />
            <div className="landing-bubble">
              <strong>Olá, eu sou a Dra. Clarice!</strong><br />
              Bem-vindo ao MédicoHelp. Como posso ajudar você hoje?
              <div style={{ marginTop: '10px' }}>
                <span className="landing-badge">Modo Clínico</span>
                <span className="landing-badge">Evidências Clínicas</span>
                <span className="landing-badge">MedPrime</span>
              </div>
            </div>
          </div>
        </section>

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

      {/* Call Modal */}
      {showCallModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.55)',
            backdropFilter: 'blur(2px)',
            zIndex: 10000
          }}
          onClick={handleCloseCall}
        >
          <div 
            style={{
              maxWidth: '520px',
              margin: '8% auto',
              background: '#0c2b27',
              borderRadius: '16px',
              boxShadow: 'var(--shadow)',
              padding: '18px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img 
                src="/assets/clarice_png.png" 
                alt="Dra. Clarice" 
                style={{ height: '96px', borderRadius: '12px' }} 
              />
              <div>
                <div style={{ fontWeight: '700' }}>Ligando para Dra. Clarice…</div>
                <div className="landing-bullets">{callStatus}</div>
              </div>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                className="landing-btn" 
                onClick={handleCloseCall}
                data-testid="button-close-call"
              >
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="landing-container landing-footer">
        © 2025 MédicoHelp · Desenvolvido por Dr. Clairton Luis Dumke (CRM PR 53866) · <a href="/privacidade">Privacidade</a>
      </footer>
    </div>
  );
}
