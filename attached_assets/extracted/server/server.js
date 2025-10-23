import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import OpenAI from 'openai'

const app = express()
app.use(cors())
app.use(express.json())

// Health
app.get('/api/health', (_, res)=>res.json({ok:true}))

// Simple no-key weather using wttr.in
app.get('/api/weather', async (req, res)=>{
  const city = encodeURIComponent(req.query.city || 'Terra Rica, PR')
  try{
    const r = await fetch(`https://wttr.in/${city}?format=j1`)
    const j = await r.json()
    const area = j.nearest_area?.[0]?.areaName?.[0]?.value || 'Terra Rica'
    const cond = j.current_condition?.[0]
    const temp = cond?.temp_C
    const desc = cond?.weatherDesc?.[0]?.value
    const precip = cond?.precipMM
    const text = `Tempo em ${area}: ${desc}, ${temp}°C, precipitação ${precip} mm (fonte: wttr.in).`
    res.json({text})
  }catch(e){
    res.status(500).json({text:'Não consegui consultar o tempo agora.'})
  }
})

// OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

async function chatCompletion(messages){
  if(!openai){
    // Fallback offline for demo
    const last = messages[messages.length-1]?.content || ''
    return { content: `(DEMO) Resposta simulada para: ${last.slice(0,180)}...` }
  }
  const resp = await openai.chat.completions.create({
    model: 'gpt-5',
    messages,
    temperature: 0.2
  })
  return resp.choices[0].message
}

// General (liberado)
app.post('/api/chat/general', async (req, res)=>{
  const prompt = req.body?.prompt || ''
  const system = `Você é a Dra. Clarice. Responda de forma direta e tradicional. Você pode falar sobre qualquer assunto.`
  try{
    const message = await chatCompletion([
      {role:'system', content: system},
      {role:'user', content: prompt}
    ])
    res.json({reply: message.content})
  }catch(e){
    res.status(500).json({error: 'Falha ao consultar o modelo.'})
  }
})

// Clinical focused
app.post('/api/chat/clinical', async (req, res)=>{
  const prompt = req.body?.prompt || ''
  const system = `Você é a Dra. Clarice no Modo Clínico. Foque em diagnóstico, conduta e segurança do paciente. Seja objetiva e sem floreios. Chame o médico de Dr. Clairton quando apropriado.`
  try{
    const message = await chatCompletion([
      {role:'system', content: system},
      {role:'user', content: prompt}
    ])
    res.json({reply: message.content})
  }catch(e){
    res.status(500).json({error: 'Falha ao consultar o modelo.'})
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>console.log(`Server on http://localhost:${PORT}`))