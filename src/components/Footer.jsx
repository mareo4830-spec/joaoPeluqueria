import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function Footer({ onOpenBooking, onNavigateToLegal }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLegalClick = (e, slug) => {
    e.preventDefault();
    if (onNavigateToLegal) {
      onNavigateToLegal(slug);
    } else {
      window.location.hash = `#${slug}`;
    }
  };

  return (
    <footer style={{ backgroundColor: '#09090b', color: '#ffffff', borderTop: '1px solid #09090b', paddingTop: 'clamp(3rem, 6vw, 5rem)', paddingBottom: '2.5rem' }}>
      <div className="editorial-container">
        {/* Massive Streetwear Brand Marquee */}
        <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 'clamp(2rem, 5vw, 3rem)', marginBottom: '3rem' }}>
          <div 
            className="font-headline" 
            style={{ 
              fontSize: 'clamp(2.25rem, 8vw, 6rem)', 
              letterSpacing: '-0.04em', 
              lineHeight: 0.95, 
              color: '#ffffff',
              textWrap: 'balance',
              wordBreak: 'normal',
              hyphens: 'none'
            }}
          >
            JOAO PELUQUERO’S
          </div>
          <div className="font-mono" style={{ fontSize: '0.8125rem', color: '#a1a1aa', marginTop: '0.85rem', letterSpacing: '0.06em', textWrap: 'pretty' }}>
            BARBERÍA JUVENIL & URBANA · HUELVA · AV. ALCALDE FEDERICO MOLINA ORTA, 4
          </div>
        </div>

        {/* Links Grid: safe responsive wrapping */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '2.5rem', marginBottom: '3.5rem' }} className="font-mono">
          <div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 700, marginBottom: '1rem' }}>
              // NAVEGACIÓN
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem' }}>
              <li><a href="#servicios" style={{ color: '#d4d4d8', textDecoration: 'none' }}>[01] CARTA DE SERVICIOS</a></li>
              <li><a href="#productos" style={{ color: '#d4d4d8', textDecoration: 'none' }}>[02] CATÁLOGO PRODUCTOS</a></li>
              <li><a href="#confianza" style={{ color: '#d4d4d8', textDecoration: 'none' }}>[03] CONFIANZA & ACCESO</a></li>
              <li><a href="#resenas" style={{ color: '#d4d4d8', textDecoration: 'none' }}>[04] OPINIONES REALES</a></li>
              <li><a href="#ubicacion" style={{ color: '#d4d4d8', textDecoration: 'none' }}>[05] UBICACIÓN & HORARIOS</a></li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 700, marginBottom: '1rem' }}>
              // GESTIÓN DE CITAS
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', lineHeight: 1.5, marginBottom: '1rem', textWrap: 'pretty' }}>
              Pide tu cita en menos de 60 segundos sin llamadas ni registros obligatorios.
            </p>
            <button
              onClick={() => onOpenBooking(null)}
              style={{
                background: '#ffffff',
                color: '#09090b',
                border: 'none',
                padding: '0.75rem 1.25rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              PEDIR CITA AHORA →
            </button>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 700, marginBottom: '1rem' }}>
              // HORARIOS & ATENCIÓN
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', lineHeight: 1.6, textWrap: 'pretty' }}>
              Lunes a Viernes: 09:30 - 13:30 / 16:30 - 20:30<br />
              Sábados: 09:30 - 14:00<br />
              <span style={{ color: '#ffffff' }}>Atención personalizada con cita previa.</span>
            </p>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 700, marginBottom: '1rem' }}>
              // LOCALIZACIÓN & CONTACTO
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#d4d4d8', lineHeight: 1.6 }}>
              Av. Alcalde Federico Molina Orta, 4<br />
              21007 Huelva, España<br />
              <span style={{ color: '#71717a' }}>37°15'36.4"N 6°56'42.2"W</span><br />
              <span style={{ color: '#a1a1aa', marginTop: '0.4rem', display: 'inline-block' }}>Tel: 600 00 00 00</span>
            </div>
          </div>
        </div>

        {/* Legal Links Row (RGPD & LSSI-CE) */}
        <div 
          style={{ 
            borderTop: '1px solid #18181b', 
            paddingTop: '1.5rem', 
            paddingBottom: '1.5rem',
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1.25rem 2rem', 
            alignItems: 'center' 
          }} 
          className="font-mono"
        >
          <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 700 }}>
            // LEGALIDAD (ESPAÑA & UE):
          </span>
          <a
            href="/aviso-legal"
            onClick={(e) => handleLegalClick(e, 'aviso-legal')}
            style={{ color: '#a1a1aa', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#a1a1aa'}
          >
            Aviso Legal (LSSI)
          </a>
          <a
            href="/politica-privacidad"
            onClick={(e) => handleLegalClick(e, 'politica-privacidad')}
            style={{ color: '#a1a1aa', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#a1a1aa'}
          >
            Política de Privacidad (RGPD)
          </a>
          <a
            href="/politica-cookies"
            onClick={(e) => handleLegalClick(e, 'politica-cookies')}
            style={{ color: '#a1a1aa', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#a1a1aa'}
          >
            Política de Cookies
          </a>
          <a
            href="/terminos-condiciones"
            onClick={(e) => handleLegalClick(e, 'terminos-condiciones')}
            style={{ color: '#a1a1aa', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#a1a1aa'}
          >
            Términos y Condiciones
          </a>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid #27272a', paddingTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} className="font-mono">
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
            © {new Date().getFullYear()} JOAO PELUQUERO’S. TODOS LOS DERECHOS RESERVADOS.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
              DISEÑO BRUTALISTA HALLMARK
            </span>
            <button
              onClick={scrollToTop}
              aria-label="Volver arriba"
              style={{
                background: 'transparent',
                border: '1px solid #3f3f46',
                color: '#ffffff',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
