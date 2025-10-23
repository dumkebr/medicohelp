import { Link } from "wouter";
import Mascote from "../components/Mascote";

export default function DemoLandingTeal() {
  return (
    <div>
      <header className="header">
        <div className="container navbar">
          <div className="logo-row">
            <img src="/logo-medicohelp-horizontal.svg?v=2025-10-23-09" height={40} alt="MédicoHelp" />
          </div>
          <div className="small">Sua aliada inteligente na decisão clínica</div>
        </div>
      </header>

      <div className="container">
        <section className="hero">
          <Mascote speaking={false} />
          <div>
            <h1 style={{ marginTop: 0 }}>Olá, eu sou a Dra. Clarice 👩‍⚕️</h1>
            <p>Plataforma clínica inteligente com precisão e praticidade.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/atendimento" className="btn btn-primary" data-testid="button-enter-clinical">
                Entrar no Modo Clínico
              </Link>
              <Link href="/atendimento?tab=evidencias" className="btn btn-outline" data-testid="button-enter-evidence">
                Consultar Evidências
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
