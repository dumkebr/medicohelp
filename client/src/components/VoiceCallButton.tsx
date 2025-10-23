import { useRef, useState } from "react";
import { Phone, PhoneOff } from "lucide-react";
import CallOverlay from "./CallOverlay";

export default function VoiceCallButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  async function startCall() {
    try {
      setIsConnecting(true);
      
      // 1) Pega token efêmero e configurações
      const ticket = await fetch("/api/voice/session").then(r => r.json());
      if (!ticket?.client_secret?.value) {
        setIsConnecting(false);
        alert("Falha ao obter token efêmero para chamada de voz.");
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
        remoteAudio.srcObject = event.streams[0];
      };
      remoteAudioRef.current = remoteAudio;

      // 5) Adiciona track do microfone ao PC
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

      // 6) DataChannel (opcional) para eventos
      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = (e) => {
        console.log("OAI event:", e.data);
      };

      // 7) Cria oferta local
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 8) Envia SDP para Realtime API e recebe answer
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp"
          },
          body: offer.sdp
        }
      );

      if (!sdpResponse.ok) {
        const txt = await sdpResponse.text();
        throw new Error("Falha ao negociar sessão WebRTC: " + txt);
      }

      const answerSdp = await sdpResponse.text();
      const answer: RTCSessionDescriptionInit = { type: "answer", sdp: answerSdp };
      await pc.setRemoteDescription(answer);

      setIsConnecting(false);
      setIsCalling(true);
    } catch (err: any) {
      console.error("Erro ao iniciar chamada:", err);
      alert("Não foi possível iniciar a chamada de voz: " + err.message);
      setIsConnecting(false);
      await hangup();
    }
  }

  async function hangup() {
    try {
      setIsCalling(false);
      setIsConnecting(false);
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

  const overlayVisible = isConnecting || isCalling;
  const overlayStatus = isConnecting 
    ? "Ligando para Dra. Clarice..." 
    : "Em chamada com Dra. Clarice";

  return (
    <>
      <CallOverlay 
        visible={overlayVisible} 
        status={overlayStatus} 
        photoSrc="/clarice-voice.png"
        onClose={() => {}}
      />
      
      <button
        onClick={isCalling ? hangup : startCall}
        className={`btn ${isCalling || isConnecting ? "btn-outline" : "btn-primary"}`}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8,
          padding: "10px 16px",
          backgroundColor: isCalling || isConnecting ? "transparent" : "var(--brand-500)",
          color: isCalling || isConnecting ? "var(--brand-500)" : "#fff",
          border: isCalling || isConnecting ? "1px solid var(--brand-500)" : "none"
        }}
        title={isCalling ? "Encerrar chamada de voz" : isConnecting ? "Conectando..." : "Ligar para Dra. Clarice"}
        data-testid={isCalling ? "button-hangup" : "button-call"}
        disabled={isConnecting}
      >
        {isCalling ? <PhoneOff size={18} /> : <Phone size={18} />}
        <span>{isConnecting ? "Conectando..." : isCalling ? "Encerrar" : "Ligar"}</span>
      </button>
    </>
  );
}
