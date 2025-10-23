export default function ClariceAvatarDebug() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#00e699',
        border: '3px solid #fff',
        borderRadius: '20px',
        padding: '12px 16px',
        boxShadow: '0 0 30px rgba(0,230,153,0.8)',
        zIndex: 9999,
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#000',
      }}
      data-testid="clarice-avatar-debug"
    >
      🩺 DRA. CLARICE AQUI!
    </div>
  )
}
