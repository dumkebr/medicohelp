// client/VoiceCallButton.jsx
// Botão com ícone de "telefone" que inicia/encerra a chamada de voz em tempo real com a Dra. Clarice.
// React + Tailwind. Coloque este componente na sua UI (ex.: topo do chat).

import React, { useRef, useState } from "react";

export default function VoiceCallButton() {
  const [isCalling, setIsCalling] = useState(false);
  const pcRef = useRef(null);
  const micStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  async function startCall() {
    try {
      // 1) Pega token efêmero e configurações
      const ticket = await fetch("/session").then(r => r.json());
      if (!ticket?.client_secret?.value) {
        alert("Falha ao obter token efêmero para Realtime.");
        return;
      }
      const ephemeralKey = ticket.client_secret.value;
      const model = ticket.model || "gpt-4o-realtime-preview";

      // 2) Captura microfone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      // 3) Cria PeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 4) Reproduz o áudio remoto automaticamente
      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      pc.ontrack = (event) => {
        // stream remoto da OpenAI (voz feminina, conforme backend)
        remoteAudio.srcObject = event.streams[0];
      };
      remoteAudioRef.current = remoteAudio;

      // 5) Adiciona track do microfone ao PC
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

      // 6) DataChannel (opcional) para eventos
      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = (e) => {
        // Logs/diagnósticos do modelo
        // console.log("OAI event:", e.data);
      };

      // 7) Cria oferta local
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 8) Envia SDP para Realtime API e recebe answer
      // O endpoint do Realtime WebRTC aceita o SDP via HTTP POST com Content-Type: application/sdp
      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
        body: offer.sdp
      });

      if (!sdpResponse.ok) {
        const txt = await sdpResponse.text();
        throw new Error("Falha ao negociar sessão WebRTC com Realtime API: " + txt);
      }

      const answerSdp = await sdpResponse.text();
      const answer = { type: "answer", sdp: answerSdp };
      await pc.setRemoteDescription(answer);

      setIsCalling(true);
    } catch (err) {
      console.error("Erro ao iniciar chamada:", err);
      alert("Não foi possível iniciar a chamada de voz: " + err.message);
      await hangup();
    }
  }

  async function hangup() {
    try {
      setIsCalling(false);
      if (pcRef.current) {
        pcRef.current.getSenders().forEach(sender => {
          try { sender.track?.stop(); } catch {}
        });
        pcRef.current.close();
      }
      micStreamRef.current?.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
      pcRef.current = null;
      micStreamRef.current = null;
      if (remoteAudioRef.current) {
        try { remoteAudioRef.current.srcObject = null; } catch {}
      }
    } catch (e) {
      console.warn("Erro no hangup:", e);
    }
  }

  return (
    <button
      onClick={isCalling ? hangup : startCall}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow 
                  ${isCalling ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}
      title={isCalling ? "Encerrar chamada de voz" : "Iniciar chamada de voz da Dra. Clarice"}
    >
      {/* Ícone de telefone (celular) */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
        <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 19h4v-1h-4v1zM7 4v14h10V4H7z"/>
      </svg>
      <span>{isCalling ? "Encerrar voz" : "Ligar p/ Dra. Clarice"}</span>
    </button>
  );
}