import { useLocation } from 'wouter';

declare global {
  interface Window {
    MedicoHelp?: {
      navigate?: (route: string) => void;
      openVoice?: () => void;
      openUploader?: () => void;
      createHistory?: (o?: { mode?: string }) => void;
    };
  }
}

export default function HeroClarice() {
  const [, setLocation] = useLocation();

  const go = (route: string) => {
    if (window.MedicoHelp?.navigate) return window.MedicoHelp.navigate(route);
    setLocation(route);
  };

  return (
    <section className="mh-hero">
      <div className="mh-container mh-hero-grid">
        <div className="mh-hero-copy">
          <div className="mh-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v6M7 4.5A9 9 0 1 0 21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            CONHEÇA A DRA. CLARICE
          </div>
          <h1>Assistente médica inteligente — 24/7, direta e confiável</h1>
          <p className="mh-lead">
            Condutas objetivas, evidências clínicas e ferramentas que agilizam seu plantão.
            Envie exames, descreva lesões, gere SOAP e acione a voz da Dra. Clarice quando precisar.
          </p>

          <div className="mh-cta">
            <button 
              className="mh-btn" 
              onClick={() => go('/recursos')}
              data-testid="button-comecar"
            >
              Começar agora
            </button>
            <button 
              className="mh-btn ghost" 
              onClick={() => (window.MedicoHelp?.openVoice ? window.MedicoHelp.openVoice() : go('/'))}
              data-testid="button-ligar-clarice"
            >
              Ligar para a Dra. Clarice
            </button>
            <button 
              className="mh-btn ghost" 
              onClick={() => (window.MedicoHelp?.openUploader ? window.MedicoHelp.openUploader() : go('/'))}
              data-testid="button-enviar-exame"
            >
              Enviar exame
            </button>
          </div>

          <ul className="mh-hero-points">
            <li>Interpretação de imagens (RX, USG, TC, RM) e dermatologia com descrição clínica.</li>
            <li>Histórias clínicas no formato <b>SOAP</b> ou personalizadas, prontas para o prontuário.</li>
            <li>Calculadoras integradas e módulo <b>MedPrime</b> para doses e scores.</li>
          </ul>
        </div>

        <div className="mh-hero-clarice">
          <img src="/assets/clarice.png" alt="Dra. Clarice" />
        </div>
      </div>
    </section>
  );
}
