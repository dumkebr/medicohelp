// client/components/ChatComposer.jsx (v2)
import React, { useRef, useState } from "react";
import CallOverlay from "./CallOverlay";

export default function ChatComposer({ onSend, claricePhotoSrc = "/client/assets/clarice.png" }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const pcRef = useRef(null);
  const micStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  function ensureSpeechRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    return SR ? new SR() : null;
  }
  function startDictation() {
    if (isRecording) return;
    const r = ensureSpeechRecognition();
    if (!r) { alert("Navegador sem suporte ao reconhecimento de voz. Use Chrome."); return; }
    recognitionRef.current = r;
    r.lang = "pt-BR"; r.interimResults = true; r.continuous = true;
    r.onresult = (event) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
      }
      if (final) setText((prev) => (prev ? prev + " " : "") + final);
    };
    r.onerror = () => stopDictation();
    r.onend = () => setIsRecording(false);
    r.start(); setIsRecording(true);
  }
  function stopDictation() { try { recognitionRef.current?.stop(); } catch {} setIsRecording(false); }
  function toggleDictation() { isRecording ? stopDictation() : startDictation(); }

  function handleSend() {
    const msg = text.trim(); if (!msg) return;
    onSend?.(msg); setText("");
  }
  function onKeyDown(e){ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); handleSend(); } }

  async function startCall() {
    try {
      setIsConnecting(true);
      const ticket = await fetch("/session").then(r=>r.json());
      if(!ticket?.client_secret?.value){ setIsConnecting(false); alert("Falha ao obter token efêmero."); return; }
      const key = ticket.client_secret.value;
      const model = ticket.model || "gpt-4o-realtime-preview";

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      pc.ontrack = (evt)=> remoteAudio.srcObject = evt.streams[0];
      remoteAudioRef.current = remoteAudio;

      micStream.getTracks().forEach(t=> pc.addTrack(t, micStream));

      pc.createDataChannel("oai-events");

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/sdp" },
        body: offer.sdp
      });
      if(!sdpResp.ok){ const txt = await sdpResp.text(); throw new Error("Negociação WebRTC falhou: " + txt); }
      const answerSdp = await sdpResp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setIsConnecting(false);
      setIsCalling(true);
    } catch(e){
      console.error(e);
      alert("Não foi possível iniciar a chamada: " + e.message);
      setIsConnecting(false);
      await hangup();
    }
  }

  async function hangup(){
    try {
      setIsCalling(false);
      setIsConnecting(false);
      pcRef.current?.getSenders().forEach(s=>{ try{ s.track?.stop(); }catch{} });
      pcRef.current?.close();
      micStreamRef.current?.getTracks().forEach(t=>{ try{ t.stop(); }catch{} });
      pcRef.current=null; micStreamRef.current=null;
      if(remoteAudioRef.current) remoteAudioRef.current.srcObject=null;
    } catch(e){ console.warn("Erro no hangup:", e); }
  }

  function toggleCall(){ return (isCalling ? hangup() : startCall()); }

  const overlayVisible = isConnecting || isCalling;
  const overlayStatus = isConnecting ? "Ligando para Dra. Clarice..." : "Em chamada com Dra. Clarice";

  return (
    <div className="w-full flex items-end gap-2">
      <CallOverlay visible={overlayVisible} status={overlayStatus} photoSrc={claricePhotoSrc} onClose={()=>{}} />

      <div className="relative flex-1">
        <textarea
          value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={onKeyDown}
          placeholder="Escreva aqui... (ou toque no microfone para ditar)"
          className="w-full min-h-[48px] max-h-40 p-3 pr-12 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
        />
        <button
          type="button" onClick={toggleDictation}
          className={`absolute right-2 bottom-2 p-2 rounded-full ${isRecording ? "bg-red-600 text-white" : "bg-gray-200 text-gray-800"}`}
          title={isRecording ? "Parar ditado" : "Ditado por voz"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z"/>
          </svg>
        </button>
      </div>

      <button onClick={handleSend} className="px-4 h-[48px] rounded-2xl bg-emerald-600 text-white shadow hover:opacity-90" title="Enviar mensagem">
        Enviar
      </button>

      <button onClick={toggleCall} className={`h-[48px] px-4 rounded-2xl shadow flex items-center gap-2 ${isCalling || isConnecting ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`} title={isCalling || isConnecting ? "Encerrar chamada de voz" : "Ligar p/ Dra. Clarice"}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
          <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 19h4v-1h-4v1zM7 4v14h10V4H7z"/>
        </svg>
        <span>{isCalling || isConnecting ? "Encerrar voz" : "Ligar p/ Dra. Clarice"}</span>
      </button>
    </div>
  );
}