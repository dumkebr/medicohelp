interface MascoteProps {
  speaking?: boolean;
  className?: string;
}

export default function Mascote({ speaking = false, className = "" }: MascoteProps) {
  return (
    <div className={className} style={{ width: 260, textAlign: "center" }}>
      <img 
        src="/dra-clarice-3d.png?v=2025-10-23" 
        alt="Dra. Clarice - Sua aliada inteligente"
        data-speaking={speaking ? "true" : "false"}
        className={speaking ? "mascote-speaking" : "mascote-idle"}
        style={{ 
          width: "100%", 
          borderRadius: 16
        }}
      />
    </div>
  );
}
