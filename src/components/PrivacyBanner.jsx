import React, { useState, useEffect } from 'react';
import { ShieldCheck, Settings, Check, X } from 'lucide-react';

export default function PrivacyBanner({ onNavigateToLegal }) {
  const [showBanner, setShowBanner] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('joao_privacy_consent');
      if (!saved) {
        setShowBanner(true);
      } else {
        setPreferences(JSON.parse(saved));
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    saveConsent(allAccepted);
  };

  const handleRejectNonEssential = () => {
    const onlyNecessary = { necessary: true, analytics: false, marketing: false };
    saveConsent(onlyNecessary);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShowConfigModal(false);
  };

  const saveConsent = (consentData) => {
    try {
      localStorage.setItem('joao_privacy_consent', JSON.stringify({
        ...consentData,
        timestamp: new Date().toISOString()
      }));
    } catch {
      // ignore
    }
    setPreferences(consentData);
    setShowBanner(false);
  };

  if (!showBanner && !showConfigModal) return null;

  return (
    <>
      {/* FLOATING MINIMALIST PRIVACY & COOKIES BANNER */}
      {showBanner && !showConfigModal && (
        <aside
          role="region"
          aria-label="Aviso de Cookies y Privacidad"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#09090b',
            color: '#ffffff',
            borderTop: '2px solid #27272a',
            padding: '1.15rem 1.5rem',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.25)'
          }}
        >
          <div 
            className="editorial-container" 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '1.25rem' 
            }}
          >
            {/* Text & Legal Notice */}
            <div style={{ flex: '1 1 500px', maxWidth: '850px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <ShieldCheck size={16} style={{ color: '#22c55e' }} />
                <span className="font-mono" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', color: '#a1a1aa', textTransform: 'uppercase' }}>
                  Aviso Legal y Privacidad (RGPD / LSSI-CE)
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, color: '#d4d4d8', margin: 0 }}>
                Utilizamos cookies técnicas necesarias para gestionar tus citas y compras de forma segura. Opcionalmente usamos cookies analíticas anónimas para mejorar el servicio.{' '}
                <button
                  type="button"
                  onClick={() => onNavigateToLegal('politica-cookies')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#ffffff',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  Leer Política de Cookies
                </button>.
              </p>
            </div>

            {/* Action Buttons */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: '0.65rem' 
              }}
              className="font-mono"
            >
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#d4d4d8',
                  border: '1px solid #3f3f46',
                  padding: '0.55rem 0.9rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Settings size={13} />
                <span>CONFIGURAR</span>
              </button>

              <button
                type="button"
                onClick={handleRejectNonEssential}
                style={{
                  backgroundColor: '#18181b',
                  color: '#ffffff',
                  border: '1px solid #52525b',
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.04em'
                }}
              >
                SOLO ESENCIALES
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#09090b',
                  border: '1px solid #ffffff',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.04em'
                }}
              >
                ACEPTAR TODAS
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* DETAILED CONFIGURATION MODAL */}
      {showConfigModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowConfigModal(false)}
          role="dialog"
          aria-modal="true"
          style={{ zIndex: 10000 }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '580px', backgroundColor: '#ffffff', border: '2px solid #09090b' }}
          >
            {/* Header */}
            <div 
              style={{ 
                backgroundColor: '#09090b', 
                color: '#ffffff', 
                padding: '1.25rem 1.5rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
            >
              <div>
                <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#a1a1aa', letterSpacing: '0.08em' }}>
                  CENTRO DE PREFERENCIAS RGPD
                </span>
                <h3 className="font-headline" style={{ fontSize: '1.35rem', margin: 0, letterSpacing: '-0.02em' }}>
                  CONFIGURACIÓN DE PRIVACIDAD Y COOKIES
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '0.25rem' }}
                aria-label="Cerrar configuración"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#52525b', lineHeight: 1.5, margin: 0 }}>
                En cumplimiento de la legislación española y europea, puedes activar o desactivar las cookies según tus preferencias. Las cookies técnicas son obligatorias para el funcionamiento de la web.
              </p>

              {/* 1. Técnicas / Esenciales */}
              <div style={{ border: '1px solid #e4e4e7', padding: '1rem', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#09090b' }}>
                    1. COOKIES TÉCNICAS Y ESENCIALES
                  </span>
                  <span className="font-mono" style={{ fontSize: '0.6875rem', backgroundColor: '#e4e4e7', padding: '0.15rem 0.45rem', fontWeight: 700 }}>
                    SIEMPRE ACTIVAS
                  </span>
                </div>
                <p style={{ fontSize: '0.78125rem', color: '#71717a', margin: 0, lineHeight: 1.4 }}>
                  Imprescindibles para que puedas reservar citas, interactuar con el catálogo y mantener la sesión segura. No recopilan información publicitaria.
                </p>
              </div>

              {/* 2. Analíticas */}
              <div style={{ border: '1px solid #e4e4e7', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#09090b' }}>
                    2. COOKIES DE MEDICIÓN Y ANÁLISIS
                  </span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.45rem' }} className="font-mono">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#09090b', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {preferences.analytics ? 'ACTIVADAS' : 'DESACTIVADAS'}
                    </span>
                  </label>
                </div>
                <p style={{ fontSize: '0.78125rem', color: '#71717a', margin: 0, lineHeight: 1.4 }}>
                  Nos permiten conocer de forma 100% anónima qué servicios o productos son los más demandados en Huelva para optimizar la web.
                </p>
              </div>

              {/* 3. Marketing */}
              <div style={{ border: '1px solid #e4e4e7', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#09090b' }}>
                    3. COOKIES DE PERSONALIZACIÓN Y MARKETING
                  </span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.45rem' }} className="font-mono">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#09090b', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {preferences.marketing ? 'ACTIVADAS' : 'DESACTIVADAS'}
                    </span>
                  </label>
                </div>
                <p style={{ fontSize: '0.78125rem', color: '#71717a', margin: 0, lineHeight: 1.4 }}>
                  Permiten recordar tus preferencias de estilo de corte y ofertas especiales en barbería y perfumería.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div 
              style={{ 
                padding: '1.25rem 1.5rem', 
                borderTop: '1px solid #e4e4e7', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '0.75rem' 
              }}
              className="font-mono"
            >
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="btn-outline-brutal"
                style={{ padding: '0.65rem 1rem', fontSize: '0.75rem' }}
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="btn-solid-black"
                style={{ padding: '0.65rem 1.35rem', fontSize: '0.75rem' }}
              >
                <Check size={14} />
                <span>GUARDAR PREFERENCIAS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
