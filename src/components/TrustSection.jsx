import React from 'react';
import { Accessibility, CreditCard, ShieldCheck, Check } from 'lucide-react';
import { TRUST_PILLARS } from '../data/trustData';

export default function TrustSection() {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Accessibility':
        return <Accessibility size={28} strokeWidth={2} />;
      case 'CreditCard':
        return <CreditCard size={28} strokeWidth={2} />;
      case 'ShieldCheck':
        return <ShieldCheck size={28} strokeWidth={2} />;
      default:
        return <Check size={28} />;
    }
  };

  return (
    <section id="confianza" style={{ padding: 'clamp(4rem, 8vw, 6rem) 0', backgroundColor: '#fafafa', borderBottom: '1px solid #09090b' }}>
      <div className="editorial-container">
        {/* Section Header */}
        <div style={{ marginBottom: '3rem' }}>
          <div className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#71717a', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            [02] ESTÁNDARES DEL ESTABLECIMIENTO
          </div>
          <h2 className="font-headline" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            CONFIANZA & ACCESIBILIDAD
          </h2>
        </div>

        {/* 3 Pillars Grid: safe responsive columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
          {TRUST_PILLARS.map((pillar, i) => (
            <div 
              key={pillar.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #09090b',
                padding: 'clamp(1.75rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
                  <div 
                    style={{ 
                      width: 48, 
                      height: 48, 
                      backgroundColor: '#09090b', 
                      color: '#ffffff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    {getIcon(pillar.iconName)}
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa' }}>
                    0{i + 1}
                  </span>
                </div>

                <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                  {pillar.subtitle}
                </div>

                <h3 className="font-headline" style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', letterSpacing: '-0.02em', color: '#09090b', marginBottom: '0.85rem', lineHeight: 1.15 }}>
                  {pillar.title}
                </h3>

                <p style={{ fontSize: '0.9375rem', color: '#3f3f46', lineHeight: 1.55, textWrap: 'pretty' }}>
                  {pillar.description}
                </p>
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e4e4e7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 6, height: 6, backgroundColor: '#09090b' }}></span>
                <span className="font-mono" style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  GARANTÍA JOAO STUDIO
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
