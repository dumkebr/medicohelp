export default function ClariceAvatar() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(4,16,18,0.95)',
        border: '1px solid #00e699',
        borderRadius: '20px',
        padding: '8px 12px',
        boxShadow: '0 0 15px rgba(0,230,153,0.4)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
      data-testid="clarice-avatar"
    >
      <img
        src="/clarice.png"
        alt="Dra. Clarice"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #00e699',
        }}
        onError={(e) => {
          console.error('Erro ao carregar imagem da Dra. Clarice');
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <div>
        <div style={{ fontWeight: '700', color: '#00e699', fontSize: '15px' }}>
          Dra. Clarice
        </div>
        <div style={{ fontSize: '13px', color: '#d2f7ff' }}>
          Assistente Médica Inteligente
        </div>
      </div>
    </div>
  )
}
