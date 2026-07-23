import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado (standalone)
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isAppStandalone);

    if (isAppStandalone) return;

    // Detecta se é iOS (Safari não suporta o evento beforeinstallprompt automático)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // No iOS, se não estiver standalone, a gente mostra o banner depois de uns segundos pra não ser intrusivo
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: Escuta o evento de instalação
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px', // Acima da barra de navegação, se houver
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '400px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      padding: '1rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#f0f9ff', padding: '0.5rem', borderRadius: '12px' }}>
             <Download size={24} color="#0369a1" />
          </div>
          <div>
            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 'bold' }}>Instalar App</h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Tenha acesso rápido e sem internet</p>
          </div>
        </div>
        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}>
          <X size={18} />
        </button>
      </div>

      {isIOS ? (
        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569' }}>
          Para instalar, toque em <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> <strong>Compartilhar</strong> na barra do Safari e depois em <strong>Adicionar à Tela de Início</strong>.
        </div>
      ) : (
        <button 
          onClick={handleInstallClick}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            background: '#0ea5e9', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Instalar Agora
        </button>
      )}

      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}
      </style>
    </div>
  );
}
