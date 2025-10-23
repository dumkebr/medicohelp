
import Mascote from "../components/Mascote";
import { useState } from "react";

export default function ChatPanel(){
  const [messages, setMessages] = useState([
    { who:"ai", text:"Beleza, Doutor. Vamos direto ao ponto: como posso ajudar?" }
  ]);
  const [text, setText] = useState("");

  async function send(){
    if(!text.trim()) return;
    const user = {who:"user", text};
    setMessages(m=>[...m, user]);
    setText("");
    // aqui você pluga no /api/chat se quiser (já tem proxy)
  }

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

      <div className="container grid">
        <aside className="sidebar card">
          <h3>Dra. Clarice</h3>
          <div className="small">Médica veterana, direta e acolhedora.</div>
          <div style={{marginTop:12}}><Mascote speaking={false}/></div>
        </aside>

        <section className="chat card">
          <div className="msgs">
            {messages.map((m,i)=>(
              <div key={i} className={"bubble "+(m.who==="user"?"user":"ai")}>{m.text}</div>
            ))}
          </div>
          <div className="inputbar">
            <input
              placeholder="Descreva o caso clínico..."
              value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && send()}
            />
            <button className="btn btn-primary" onClick={send}>Enviar</button>
          </div>
        </section>
      </div>
    </div>
  );
}
