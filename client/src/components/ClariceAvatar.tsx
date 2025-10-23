export default function ClariceAvatar() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(4,16,18,0.95)',
        border: '1px solid #00e699',
        borderRadius: '24px',
        padding: '10px 16px',
        boxShadow: '0 4px 20px rgba(0,230,153,0.35)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        pointerEvents: 'auto',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid="clarice-avatar"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,230,153,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,230,153,0.35)';
      }}
    >
      <img
        src="/clarice.png"
        alt="Dra. Clarice"
        style={{
          width: 48,
          height: 48,
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
        <div style={{ fontWeight: '700', color: '#00e699', fontSize: '14px', lineHeight: '1.2' }}>
          Dra. Clarice
        </div>
        <div style={{ fontSize: '12px', color: '#b0e0e6', opacity: 0.9, lineHeight: '1.2', marginTop: '2px' }}>
          Assistente Médica IA
        </div>
      </div>
    </div>
  )
}
