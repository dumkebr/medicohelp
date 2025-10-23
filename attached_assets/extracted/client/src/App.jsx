import React, { useState, useRef, useEffect } from 'react'
import { Phone, Mic, Paperclip, Send, Download } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function App(){
  const [mode, setMode] = useState('clinico') // 'clinico' | 'teorico'
  const [messages, setMessages] = useState([
    {role:'assistant', content:'Olá, eu sou a Dra. Clarice. Posso ajudar com casos clínicos, dúvidas médicas e também assuntos gerais (clima, tecnologia, etc). É só perguntar!'},
  ])
  const [input, setInput] = useState('')
  const [calling, setCalling] = useState(false)
  const listRef = useRef(null)

  useEffect(()=>{
    listRef.current?.scrollTo({top: listRef.current.scrollHeight, behavior:'smooth'})
  }, [messages])

  async function sendMessage(){
    const text = input.trim()
    if(!text) return
    setMessages(m => [...m, {role:'user', content:text}])
    setInput('')
    const endpoint = mode === 'clinico' ? '/api/chat/clinical' : '/api/chat/general'
    try{
      const res = await fetch(API_BASE + endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: text })
      })
      const data = await res.json()
      setMessages(m => [...m, {role:'assistant', content: data.reply || '(sem resposta)'}])
    }catch(e){
      setMessages(m => [...m, {role:'assistant', content:'Falha ao responder. Verifique o servidor no Replit.'}])
    }
  }

  async function askWeather(){
    const res = await fetch(API_BASE + '/api/weather?city=Terra Rica, PR')
    const data = await res.json()
    setMessages(m => [...m, {role:'assistant', content: data.text }])
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Heart_corazón.svg" width="28" />
          <h1>Médico Help</h1>
        </div>
        <div className="small">A plataforma médica inteligente</div>
        <div className="divider"></div>
        <div className="menuTitle">Menu Principal</div>
        <div className="menuItem">Atendimento médico</div>
        <div className="menuItem">Sobre</div>
        <div className="menuItem">Novo atendimento</div>
        <div className="menuItem">Buscar em atendimentos</div>
        <div className="divider"></div>
        <div className="menuTitle">MedPrime</div>
        <div className="menuItem">Ferramentas Avançadas</div>
        <div className="divider"></div>
        <div className="menuTitle">Gestão de Pacientes</div>
        <div className="menuItem">Novo paciente</div>
        <div className="menuItem">Todos os pacientes</div>
      </aside>

      <main className="main">
        <div className="container">
          <div className="header">
            <div className="brand">
              <h1 className="">MédicoHelp — Assistente</h1>
              <span className="badge">Beta Gratuito</span>
            </div>
            <div className="rightControls">
              {calling && <span className="calling">Ligando para Dra. Clarice…</span>}
              <button className="iconbtn" title="Baixar conversa" onClick={()=>window.print()}><Download size={18}/></button>
            </div>
          </div>

          <div className="tabs">
            <button className={"tab " + (mode==='clinico'?'':'secondary')} onClick={()=>setMode('clinico')}>Modo Clínico</button>
            <button className={"tab " + (mode!=='clinico'?'':'secondary')} onClick={()=>setMode('teorico')}>Fundamentação Teórica</button>
          </div>

          <div className="panel" style={{minHeight: 420}} ref={listRef}>
            {messages.map((m, i)=>(
              <div className={"msg " + (m.role==='user'?'user':'')} key={i}>{m.content}</div>
            ))}
          </div>

          <div className="toolbar">
            <button className="iconbtn" title="Anexar"><Paperclip size={18}/></button>
            <button className="iconbtn" title="Gravar áudio (transcrever)"><Mic size={18}/></button>
            <button className="btn secondary" onClick={askWeather}>Exemplo: Vai chover em Terra Rica?</button>
            <div style={{flex:1}}></div>
            <button className="btn" onClick={()=>{setCalling(true); setTimeout(()=>setCalling(false), 2500)}}><Phone size={18}/> Ligar</button>
          </div>

          <div className="row" style={{marginTop:10}}>
            <input className="input" placeholder="Descreva o caso clínico..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') sendMessage()}}/>
            <button className="btn" onClick={sendMessage}><Send size={18}/> Enviar</button>
          </div>
          <div className="small" style={{marginTop:6}}>Dica: o modo está <b>{mode==='clinico'?'Clínico':'Fundamentação Teórica (geral liberado)'}</b>. </div>
        </div>
      </main>
    </div>
  )
}