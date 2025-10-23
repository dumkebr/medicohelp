
import "../styles/theme.css?ver=2025-10-23-10";
import Mascote from "../components/Mascote";
import { useState } from "react";
import { sendChat } from "../services/chat";

type Msg = { who:"user"|"ai"; text:string };

export default function Atendimento(){
  const [tab,setTab] = useState<"clinico"|"evidencias">("clinico");
  const [messages,setMessages] = useState<Msg[]>([
    { who:"ai", text:"Beleza, Doutor. Vamos direto ao ponto: como posso ajudar?" }
  ]);
  const [text,setText] = useState("");

  async function onSend(){
    if(!text.trim()) return;
    const user = { who:"user", text };
    setMessages(m=>[...m, user]);
    setText("");
    try{
      const reply = await sendChat([
        { role:"system", content:"Você é a Dra. Clarice, médica veterana, direta e tradicional, tom acolhedor. Responda com objetividade." },
        { role:"user", content:text }
      ]);
      setMessages(m=>[...m, { who:"ai", text: reply }]);
    }catch(e:any){
      setMessages(m=>[...m, { who:"ai", text:"[Falha na API] "+(e?.message||"") }]);
    }
  }

  return (
    <div>
      <header className="header">
        <div className="container navbar">
          <div className="logo-row">
            <img src="/logo-medicohelp-horizontal.svg?v=2025-10-23-10" height={40} alt="MédicoHelp"/>
          </div>
          <div className="small">Sua aliada inteligente na decisão clínica</div>
        </div>
      </header>

      <div className="container">
        <div className="tabs card" style={{display:"flex",gap:12}}>
          <button className={"btn "+(tab==="clinico"?"btn-primary":"btn-outline")} onClick={()=>setTab("clinico")}>Clínico</button>
          <button className={"btn "+(tab==="evidencias"?"btn-primary":"btn-outline")} onClick={()=>setTab("evidencias")}>Fundamentação teórica</button>
        </div>

        <div className="grid">
          <aside className="sidebar card">
            <h3 style={{marginTop:0}}>Dra. Clarice</h3>
            <div className="small">Médica veterana, direta, acolhedora.</div>
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
                placeholder={tab==="clinico"?"Descreva o caso clínico...":"Pergunte sobre evidências..."}
                value={text}
                onChange={e=>setText(e.target.value)}
                onKeyDown={e=>e.key==="Enter" && onSend()}
              />
              <button className="btn btn-primary" onClick={onSend}>Enviar</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
