
export default function Mascote({ speaking = false }) {
  const src = speaking ? "/clarice-talking.webm" : "/clarice-idle.webm";
  const fallback = speaking ? "/clarice-talking-fallback.png" : "/clarice-idle-fallback.png";
  return (
    <div style={{ width: 260 }}>
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: "100%", borderRadius: 16, background: "var(--bg-soft)" }}
        onError={(e) => {
          e.currentTarget.outerHTML = `<img src='${fallback}' alt='Dra Clarice' style='width:100%;border-radius:16px'/>`;
        }}
      />
    </div>
  );
}
