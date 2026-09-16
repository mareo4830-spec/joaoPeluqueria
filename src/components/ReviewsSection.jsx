import React from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { CLIENT_REVIEWS } from '../data/trustData';

export default function ReviewsSection() {
  return (
    <section id="resenas" style={{ padding: 'clamp(4rem, 8vw, 6rem) 0', backgroundColor: '#ffffff', borderBottom: '1px solid #09090b' }}>
      <div className="editorial-container">
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', gap: '1.25rem' }}>
          <div>
            <div className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#71717a', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              [03] REPUTACIÓN URBANA
            </div>
            <h2 className="font-headline" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              OPINIONES DE CLIENTES
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="tech-badge" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>
              <span style={{ color: '#facc15' }}>★</span>
              <span>4.8 / 5.0 EN GOOGLE</span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
              80+ RESEÑAS TOTALES
            </span>
          </div>
        </div>

        {/* Responsive Reviews Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: '1.5rem' }}>
          {CLIENT_REVIEWS.map((rev) => (
            <article 
              key={rev.id}
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
                {/* Star rating row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {[...Array(rev.rating)].map((_, idx) => (
                      <Star key={idx} size={15} fill="#09090b" strokeWidth={0} />
                    ))}
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a' }}>
                    {rev.date}
                  </span>
                </div>

                {/* Primary Requested Quote */}
                <blockquote 
                  className="font-headline" 
                  style={{ 
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)', 
                    color: '#09090b', 
                    letterSpacing: '-0.02em', 
                    lineHeight: 1.2,
                    marginBottom: '1rem',
                    textTransform: 'uppercase',
                    textWrap: 'balance'
                  }}
                >
                  “{rev.quote}”
                </blockquote>

                <p style={{ fontSize: '0.9375rem', color: '#3f3f46', lineHeight: 1.5, marginBottom: '1.75rem', textWrap: 'pretty' }}>
                  {rev.text}
                </p>
              </div>

              {/* Author & Verified status */}
              <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#09090b' }}>
                    {rev.author}
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#71717a' }}>
                    {rev.service}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span className="font-mono" style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#16a34a' }}>
                    VERIFICADO
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
