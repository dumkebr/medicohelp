export default function ClariceAvatar() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(4,16,18,0.85)',
        border: '1px solid #0b2c33',
        borderRadius: '20px',
        padding: '8px 12px',
        boxShadow: '0 0 10px rgba(0,230,153,0.2)',
        backdropFilter: 'blur(4px)',
        zIndex: 10,
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
