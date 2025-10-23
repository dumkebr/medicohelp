
import Mascote from "../components/Mascote";

export default function Landing(){
  return (
    <div>
      <header className="header">
        <div className="container navbar">
          <div className="logo-row">
            <img src="/logo-medicohelp-horizontal.svg?v=2025-10-23-09" height={40} alt="MédicoHelp"/>
          </div>
          <div className="small">Sua aliada inteligente na decisão clínica</div>
        </div>
      </header>

      <div className="container">
        <section className="hero">
          <Mascote speaking={false}/>
          <div>
            <h1 style={{marginTop:0}}>Olá, eu sou a Dra. Clarice 👩‍⚕️</h1>
            <p>Plataforma clínica inteligente com precisão e praticidade.</p>
            <div style={{display:'flex',gap:12}}>
              <a className="btn btn-primary" href="/#/chat">Entrar no Modo Clínico</a>
              <a className="btn btn-outline" href="/#/chat?tab=evidencias">Consultar Evidências</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
