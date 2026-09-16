import React from 'react';
import { Star, MapPin, ArrowRight, Shield, CheckCircle2, Clock } from 'lucide-react';

export default function Hero({ onOpenBooking }) {
  const address = "Av. Alcalde Federico Molina Orta, 4, 21007, Huelva";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <section 
      style={{ 
        borderBottom: '1px solid #09090b', 
        paddingTop: 'clamp(3rem, 6vw, 5rem)', 
        paddingBottom: 'clamp(3.5rem, 7vw, 5.5rem)',
        backgroundColor: '#ffffff'
      }}
    >
      <div className="editorial-container">
        {/* Badges Ribbon: fully responsive wrapping */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', marginBottom: '2.25rem' }}>
          {/* Main Requested Badge */}
          <div className="tech-badge" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#facc15' }}>
              <Star size={13} fill="#facc15" strokeWidth={0} />
            </span>
            <span style={{ textWrap: 'balance' }}>VALORACIÓN 4.8/5 BASADA EN 80 RESEÑAS</span>
          </div>

          <div className="tech-badge-subtle">
            <Shield size={12} style={{ flexShrink: 0 }} />
            <span>CITA ONLINE EN DIRECTO</span>
          </div>

          <div className="tech-badge-subtle">
            <Clock size={12} style={{ flexShrink: 0 }} />
            <span>SIN ESPERAS INNECESARIAS</span>
          </div>
        </div>

        {/* Hero Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'clamp(2.5rem, 5vw, 4rem)', alignItems: 'end' }}>
          <div>
            {/* Streetwear Tag Ribbon */}
            <div 
              className="font-mono" 
              style={{ 
                fontSize: '0.8125rem', 
                fontWeight: 800, 
                color: '#09090b', 
                letterSpacing: '0.12em', 
                marginBottom: '1rem',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ display: 'inline-block', width: 8, height: 8, backgroundColor: '#000000' }}></span>
              <span>[ ESTUDIO URBANO DE CORTE & BARBA ]</span>
            </div>

            {/* Massive Hero Title with Anti-Word-Split Guarantee */}
            <h1 className="hero-massive-title">
              <span className="hero-title-nowrap">JOAO</span>{' '}
              <span className="hero-title-nowrap">PELUQUERO’S</span>
            </h1>

            {/* Brutalist Accent Bar */}
            <div style={{ width: '70px', height: '5px', backgroundColor: '#000000', marginBottom: '1.75rem' }}></div>

            {/* Address with Icon & Link */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '2.25rem' }}>
              <MapPin size={19} style={{ color: '#09090b', flexShrink: 0, marginTop: '0.15rem' }} />
              <a 
                href={mapsUrl}
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#27272a', 
                  fontSize: 'clamp(1rem, 2vw, 1.125rem)', 
                  textDecoration: 'underline', 
                  textUnderlineOffset: '4px',
                  fontWeight: 600,
                  lineHeight: 1.4
                }}
              >
                {address}
              </a>
            </div>

            {/* Call to Action Buttons (100% responsive, zero cuts) */}
            <div className="hero-actions-container">
              <button
                onClick={() => onOpenBooking(null)}
                className="hero-btn-primary"
              >
                <span>PEDIR CITA</span>
                <ArrowRight size={18} />
              </button>

              <a
                href="#servicios"
                className="hero-btn-secondary"
              >
                VER SERVICIOS
              </a>
            </div>
          </div>

          {/* Right Column: Editorial Technical Data Block */}
          <div 
            style={{ 
              border: '2px solid #09090b', 
              padding: 'clamp(1.5rem, 4vw, 2.25rem)', 
              backgroundColor: '#fafafa',
              width: '100%'
            }}
          >
            <div className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b', borderBottom: '1px solid #09090b', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>DATOS TÉCNICOS DEL ESPACIO</span>
              <span>HUELVA · 21007</span>
            </div>

            <p style={{ fontSize: '0.9375rem', color: '#27272a', lineHeight: 1.6, marginBottom: '1.5rem', textWrap: 'pretty' }}>
              Especialistas en degradados milimétricos, corte urbano, arreglo de barba a navaja clásica y decoloraciones de alto impacto. Sin rodeos: calidad técnica, puntualidad estricta y trato cercano.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', borderTop: '1px solid #e4e4e7', paddingTop: '1.25rem' }}>
              <div>
                <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a' }}>HORARIO SEMANAL</div>
                <div className="font-headline" style={{ fontSize: '1.125rem', marginTop: '0.2rem' }}>09:30 — 20:30</div>
                <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#a1a1aa' }}>Lunes a Sábado</div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a' }}>LOCALIZACIÓN</div>
                <div className="font-headline" style={{ fontSize: '1.125rem', marginTop: '0.2rem' }}>ISLA CHICA</div>
                <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#a1a1aa' }}>Huelva Centro</div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e4e4e7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} style={{ color: '#09090b', flexShrink: 0 }} />
              <span className="font-mono" style={{ fontSize: '0.725rem', fontWeight: 600 }}>CONFIRMACIÓN INMEDIATA POR WHATSAPP & BD</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
