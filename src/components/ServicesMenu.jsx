import React from 'react';
import { Clock, ArrowUpRight } from 'lucide-react';

export default function ServicesMenu({ services, onSelectService }) {
  return (
    <section id="servicios" style={{ padding: 'clamp(4rem, 8vw, 6rem) 0', backgroundColor: '#ffffff', borderBottom: '1px solid #09090b' }}>
      <div className="editorial-container">
        {/* Section Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', gap: '1.5rem' }}>
          <div>
            <div className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#71717a', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              [01] MENÚ DE SERVICIOS
            </div>
            <h2 className="font-headline" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              CARTA TÉCNICA DE CORTE
            </h2>
          </div>

          <p className="font-mono" style={{ fontSize: '0.8125rem', color: '#71717a', maxWidth: '380px', textTransform: 'uppercase', lineHeight: 1.5 }}>
            Diseño súper limpio. Tarifas transparentes sin costes ocultos. Pulsa en PEDIR CITA para reservar tu turno.
          </p>
        </div>

        {/* Editorial Clean Service List (Full responsive layout) */}
        <div className="services-list-container">
          {services.map((item, index) => (
            <div
              key={item.id || index}
              className="service-item-row"
            >
              {/* Left: Index + Title + Description */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                    0{index + 1}
                  </span>
                  <h3 className="font-headline" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)', color: '#09090b', fontWeight: 800 }}>
                    {item.name}
                  </h3>
                  {item.tag && (
                    <span 
                      className="font-mono" 
                      style={{ 
                        fontSize: '0.625rem', 
                        padding: '0.15rem 0.4rem', 
                        backgroundColor: '#f4f4f5', 
                        border: '1px solid #e4e4e7',
                        fontWeight: 700,
                        letterSpacing: '0.04em'
                      }}
                    >
                      {item.tag}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '0.35rem', maxWidth: '580px', lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                )}
              </div>

              {/* Duration Tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} style={{ color: '#71717a', flexShrink: 0 }} />
                <span className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#27272a', whiteSpace: 'nowrap' }}>
                  {item.duration || `${item.duration_min}min`}
                </span>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'right' }}>
                <span className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 1.875rem)', color: '#09090b', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {item.price || (item.price_eur ? `${item.price_eur.toFixed(2).replace('.', ',')} €` : '')}
                </span>
              </div>

              {/* Action Button */}
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectService(item);
                  }}
                  className="btn-solid-black"
                  style={{ 
                    padding: '0.65rem 1.15rem', 
                    fontSize: '0.75rem',
                    letterSpacing: '0.04em',
                    width: '100%'
                  }}
                >
                  <span>PEDIR CITA</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footnote Notice */}
        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} className="font-mono">
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
            * Todos los servicios incluyen asesoría capilar y productos de acabado profesional.
          </span>
          <span style={{ fontSize: '0.75rem', color: '#09090b', fontWeight: 700 }}>
            CANCELACIÓN GRATUITA HASTA 2H ANTES
          </span>
        </div>
      </div>
    </section>
  );
}
