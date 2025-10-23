interface MascoteProps {
  speaking?: boolean;
  className?: string;
}

export default function Mascote({ speaking = false, className = "" }: MascoteProps) {
  const source = speaking ? "/clarice-talking.webm" : "/clarice-idle.webm";
  const fallback = speaking ? "/clarice-talking-fallback.png" : "/clarice-idle-fallback.png";

  return (
    <div className={`w-[280px] ${className}`}>
      <video
        src={source}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-auto rounded-2xl block"
        onError={(e) => {
          const target = e.currentTarget;
          const img = document.createElement('img');
          img.src = fallback;
          img.alt = 'Dra. Clarice';
          img.className = 'w-full rounded-2xl';
          target.parentNode?.replaceChild(img, target);
        }}
      />
    </div>
  );
}
