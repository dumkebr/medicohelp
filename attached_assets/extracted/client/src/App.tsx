
import "./styles/theme.css?ver=2025-10-23-08";
import Mascote from "./components/Mascote";

export default function App() {
  return (
    <main>
      <header>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <img src="/logo-medicohelp-horizontal.svg?v=2025-10-23-08" alt="MédicoHelp" height={40} />
        </div>
      </header>

      <section className="hero">
        <Mascote speaking={false} />
        <div>
          <h1>Olá, eu sou a Dra. Clarice 👩‍⚕️</h1>
          <p>Sua aliada inteligente na decisão clínica</p>
          <div style={{display:'flex',gap:12}}>
            <button className="btn-primary">Modo Clínico</button>
            <button className="btn-outline">Evidências</button>
          </div>
        </div>
      </section>
    </main>
  );
}
