import React, { useState } from 'react';
import { MapPin, ArrowUpRight, Copy, Check } from 'lucide-react';

export default function LocationSection({ onOpenBooking }) {
  const [copied, setCopied] = useState(false);
  const address = "Av. Alcalde Federico Molina Orta, 4, 21007, Huelva";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="ubicacion" style={{ padding: 'clamp(4rem, 8vw, 6rem) 0', backgroundColor: '#fafafa', borderBottom: '1px solid #09090b' }}>
      <div className="editorial-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '2.5rem' }}>
          {/* Left Column: Info */}
          <div>
            <div className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#71717a', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              [04] LOCALIZACIÓN & HORARIOS
            </div>
            <h2 className="font-headline" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '1.75rem' }}>
              VEN A VISITARNOS
            </h2>

            <div style={{ borderTop: '1px solid #09090b', paddingTop: '1.5rem', marginBottom: '1.75rem' }}>
              <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '0.35rem' }}>DIRECCIÓN COMPLETA</div>
              <div style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', fontWeight: 600, color: '#09090b', marginBottom: '0.85rem', textWrap: 'pretty' }}>
                {address}
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline-brutal"
                  style={{ padding: '0.65rem 1.15rem', fontSize: '0.75rem', flex: '1 1 auto' }}
                >
                  <MapPin size={14} />
                  <span>ABRIR EN GOOGLE MAPS</span>
                  <ArrowUpRight size={14} />
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-outline-brutal"
                  style={{ padding: '0.65rem 1.15rem', fontSize: '0.75rem', flex: '1 1 auto' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? '¡COPIADA!' : 'COPIAR DIRECCIÓN'}</span>
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '0.35rem' }}>HORARIO DE APERTURA</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#09090b' }}>Lunes a Viernes</div>
                <div className="font-mono" style={{ fontSize: '0.8125rem', color: '#3f3f46' }}>09:30 - 14:00</div>
                <div className="font-mono" style={{ fontSize: '0.8125rem', color: '#3f3f46' }}>16:30 - 20:30</div>
                
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#09090b', marginTop: '0.75rem' }}>Sábados</div>
                <div className="font-mono" style={{ fontSize: '0.8125rem', color: '#3f3f46' }}>09:30 - 14:30</div>
              </div>

              <div>
                <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '0.35rem' }}>ATENCIÓN AL CLIENTE</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#09090b' }}>João Peluquero</div>
                <div className="font-mono" style={{ fontSize: '0.8125rem', color: '#3f3f46', marginBottom: '0.85rem' }}>Huelva Centro</div>
                <button
                  onClick={() => onOpenBooking(null)}
                  className="btn-solid-black"
                  style={{ padding: '0.65rem 1rem', fontSize: '0.75rem', width: '100%' }}
                >
                  PEDIR CITA
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Brutalist Map Card */}
          <div 
            style={{ 
              border: '1px solid #09090b', 
              backgroundColor: '#ffffff', 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: '340px',
              width: '100%'
            }}
          >
            <div 
              className="font-mono" 
              style={{ 
                backgroundColor: '#09090b', 
                color: '#ffffff', 
                padding: '0.65rem 1rem', 
                fontSize: '0.75rem', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>UBICACIÓN · HUELVA</span>
              <span style={{ color: '#4ade80', whiteSpace: 'nowrap' }}>● GPS ACTIVO</span>
            </div>

            {/* Embedded Interactive Map */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: '260px', width: '100%' }}>
              <iframe
                title="Mapa de ubicación Joao Peluquero's"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(100%) contrast(110%)', minHeight: '260px' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src="https://maps.google.com/maps?q=Av.+Alcalde+Federico+Molina+Orta,+4,+21007,+Huelva&t=&z=16&ie=UTF8&iwloc=&output=embed"
              ></iframe>
            </div>

            <div 
              style={{ 
                padding: '1rem', 
                borderTop: '1px solid #09090b', 
                backgroundColor: '#fafafa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
                ZONA ISLA CHICA · FÁCIL ACCESO
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono"
                style={{ fontSize: '0.75rem', color: '#09090b', fontWeight: 700, textDecoration: 'underline' }}
              >
                CÓMO LLEGAR →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
