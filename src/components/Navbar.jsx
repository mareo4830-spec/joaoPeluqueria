import React, { useState, useEffect } from 'react';
import { Scissors, Calendar, Lock, Clock } from 'lucide-react';

export default function Navbar({ onOpenBooking, onNavigateToAdmin, onNavigateToCitas }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem('joao_admin_logged') === 'true';
    } catch {
      return false;
    }
  });

  // Keep admin state synced across tabs or actions
  useEffect(() => {
    const checkAdmin = () => {
      try {
        setIsAdmin(localStorage.getItem('joao_admin_logged') === 'true');
      } catch {
        setIsAdmin(false);
      }
    };
    window.addEventListener('storage', checkAdmin);
    window.addEventListener('focus', checkAdmin);
    return () => {
      window.removeEventListener('storage', checkAdmin);
      window.removeEventListener('focus', checkAdmin);
    };
  }, []);

  return (
    <header className="border-b-solid" style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#ffffff' }}>
      {/* Top Utility Ticker */}
      <div 
        style={{ 
          backgroundColor: '#09090b', 
          color: '#ffffff', 
          padding: '0.35rem clamp(0.75rem, 2vw, 1.5rem)', 
          fontSize: 'clamp(0.65rem, 1.8vw, 0.725rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        className="font-mono"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
            ABIERTO HOY · HUELVA
          </span>
          <span style={{ color: '#71717a' }} className="sm-inline">|</span>
          <span style={{ color: '#a1a1aa' }} className="sm-inline">
            AV. ALCALDE FEDERICO MOLINA ORTA, 4
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginLeft: 'auto', flexShrink: 0 }}>
          {/* Botón Citas: SOLO VISIBLE SI ESTÁ COMO ADMIN */}
          {isAdmin && (
            <button
              type="button"
              onClick={onNavigateToCitas}
              title="Ver Agenda de Citas del Peluquero (/citas)"
              aria-label="Ver Citas del Peluquero"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: '1px solid #22c55e',
                padding: '0.2rem 0.6rem',
                fontSize: '0.6875rem',
                fontFamily: 'monospace',
                fontWeight: 800,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                borderRadius: '2px',
                lineHeight: 1,
                boxShadow: '0 1px 4px rgba(34, 197, 94, 0.35)'
              }}
            >
              <Calendar size={11} strokeWidth={2.5} />
              <span>CITAS</span>
            </button>
          )}

          <span style={{ color: '#d4d4d8', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }} className="sm-inline">
            CITAS ONLINE 24/7
          </span>
          
          {/* Botón en la esquina superior derecha para entrar a /admin */}
          <button
            type="button"
            onClick={onNavigateToAdmin}
            title="Acceso Administración (/admin)"
            aria-label="Acceso Administración"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              backgroundColor: '#18181b',
              color: '#a1a1aa',
              border: '1px solid #27272a',
              padding: '0.2rem 0.45rem',
              fontSize: '0.625rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.15s ease',
              lineHeight: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#71717a';
              e.currentTarget.style.backgroundColor = '#27272a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a1a1aa';
              e.currentTarget.style.borderColor = '#27272a';
              e.currentTarget.style.backgroundColor = '#18181b';
            }}
          >
            <Lock size={10} strokeWidth={2.5} />
            <span>ADMIN</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="editorial-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', gap: '1rem' }}>
          {/* Brand */}
          <a 
            href="#" 
            style={{ textDecoration: 'none', color: '#09090b', display: 'flex', alignItems: 'center', gap: '0.65rem' }}
          >
            <div 
              style={{ 
                width: 38, 
                height: 38, 
                backgroundColor: '#09090b', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Scissors size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-headline" style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.5rem)', letterSpacing: '-0.03em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                JOAO PELUQUERO’S
              </div>
              <div className="font-mono" style={{ fontSize: '0.625rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.15rem' }}>
                HUELVA · 21007
              </div>
            </div>
          </a>

          {/* Desktop Nav Items */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="desktop-nav">
            <a href="#servicios" className="font-mono" style={{ textDecoration: 'none', color: '#27272a', fontSize: '0.8125rem', fontWeight: 600 }}>
              [01] SERVICIOS
            </a>
            <a href="#productos" className="font-mono" style={{ textDecoration: 'none', color: '#27272a', fontSize: '0.8125rem', fontWeight: 600 }}>
              [02] PRODUCTOS
            </a>
            <a href="#confianza" className="font-mono" style={{ textDecoration: 'none', color: '#27272a', fontSize: '0.8125rem', fontWeight: 600 }}>
              [03] CONFIANZA
            </a>
            <a href="#resenas" className="font-mono" style={{ textDecoration: 'none', color: '#27272a', fontSize: '0.8125rem', fontWeight: 600 }}>
              [04] RESEÑAS
            </a>
            <a href="#ubicacion" className="font-mono" style={{ textDecoration: 'none', color: '#27272a', fontSize: '0.8125rem', fontWeight: 600 }}>
              [05] UBICACIÓN
            </a>
          </nav>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Botón Citas: SOLO VISIBLE SI ESTÁ COMO ADMIN */}
            {isAdmin && (
              <button
                type="button"
                onClick={onNavigateToCitas}
                className="font-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  backgroundColor: '#09090b',
                  color: '#ffffff',
                  border: '2px solid #09090b',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <Clock size={15} style={{ color: '#22c55e' }} />
                <span>CITAS</span>
              </button>
            )}

            <button
              onClick={() => onOpenBooking(null)}
              className="btn-solid-black"
              style={{ padding: '0.65rem 1.15rem', fontSize: '0.75rem', flexShrink: 0 }}
            >
              <Calendar size={14} />
              <span>PEDIR CITA</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
