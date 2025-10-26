import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const hasShownBefore = localStorage.getItem('pwa-prompt-dismissed');
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!hasShownBefore && !isInstalled) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('📱 PWA instalado com sucesso!');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div
      data-testid="pwa-install-prompt"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(380px, calc(100vw - 40px))',
        background: 'linear-gradient(135deg, #0c4540 0%, #084842 100%)',
        border: '3px solid #00A79D',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 167, 157, 0.4), 0 0 0 1px rgba(255,255,255,.05) inset',
        zIndex: 10001,
        animation: 'slideUp 0.4s ease-out'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <button
        onClick={handleDismiss}
        data-testid="button-dismiss-pwa"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#c9d7d4',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
      >
        <X size={18} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
        >
          <img
            src="/clarice.png"
            alt="Dra. Clarice"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              objectFit: 'cover'
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 800, 
            color: '#f3f7f6',
            lineHeight: 1.2
          }}>
            Instalar MédicoHelp
          </h3>
          <p style={{ 
            margin: '4px 0 0', 
            fontSize: '13px', 
            color: '#c9d7d4',
            lineHeight: 1.4
          }}>
            Acesse o app rapidamente pela tela inicial
          </p>
        </div>
      </div>

      <div style={{ 
        fontSize: '14px', 
        lineHeight: 1.6, 
        color: '#c9d7d4',
        marginBottom: '16px'
      }}>
        ✨ <strong style={{ color: '#00A79D' }}>Use como app nativo:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
          <li>Acesso rápido pela tela inicial</li>
          <li>Funciona offline após primeira visita</li>
          <li>Tela cheia (sem barra do navegador)</li>
        </ul>
      </div>

      <button
        onClick={handleInstall}
        data-testid="button-install-pwa"
        style={{
          width: '100%',
          background: '#00A79D',
          color: '#042c28',
          border: 'none',
          borderRadius: '12px',
          padding: '14px 20px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(0, 167, 157, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#008a7d';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#00A79D';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Download size={20} />
        Instalar Agora
      </button>

      <p style={{
        margin: '10px 0 0',
        fontSize: '11px',
        color: '#a0bbb5',
        textAlign: 'center'
      }}>
        Você pode desinstalar a qualquer momento
      </p>
    </div>
  );
}
