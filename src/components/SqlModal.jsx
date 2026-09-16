import React, { useState } from 'react';
import { X, Copy, Check, Database } from 'lucide-react';

export default function SqlModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlCode = `-- ==============================================================================
-- JOAO PELUQUERO'S — SCRIPT COMPLETO DE CONFIGURACIÓN PARA SUPABASE
-- ==============================================================================
-- 1. Accede a tu consola de Supabase: https://supabase.com/dashboard
-- 2. Selecciona tu proyecto o crea uno nuevo gratuito.
-- 3. Entra en el menú lateral en "SQL Editor" -> "New Query".
-- 4. Pega todo este código y pulsa "RUN" (o Ctrl + Enter).
-- ==============================================================================

-- 1. Limpieza de tablas previas (en orden de dependencias)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;

-- 2. Creación de la tabla 'services' (Catálogo oficial de cortes)
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    duration_min INTEGER NOT NULL,
    duration_label VARCHAR(32) NOT NULL,
    price_eur NUMERIC(6, 2) NOT NULL,
    price_label VARCHAR(32) NOT NULL,
    category VARCHAR(64) DEFAULT 'corte',
    tag VARCHAR(32),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Creación de la tabla 'products' (Perfumes & Productos de Peluquería)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) DEFAULT 'Joao Lab',
    category VARCHAR(50) NOT NULL CHECK (category IN ('perfumes', 'peluqueria')),
    description TEXT,
    price_eur NUMERIC(6, 2) NOT NULL,
    price_label VARCHAR(32) NOT NULL,
    stock INTEGER DEFAULT 10,
    image_url TEXT,
    tag VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Creación de la tabla 'appointments' (Reservas de clientes)
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name VARCHAR(120) NOT NULL,
    service_price VARCHAR(32) NOT NULL,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    notes TEXT,
    status VARCHAR(32) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Índices para acelerar búsquedas y blindar duplicados
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
-- Garantiza que NUNCA puedan existir dos citas activas en la misma fecha y hora (salvo si se cancela)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_appointment ON public.appointments(appointment_date, appointment_time) WHERE status != 'cancelled';
CREATE INDEX idx_services_active ON public.services(is_active);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(is_active);

-- 6. Inserción de los Servicios oficiales
INSERT INTO public.services 
    (slug, name, description, duration_min, duration_label, price_eur, price_label, category, tag, display_order)
VALUES 
    ('corte-caballero', 'Corte caballero', 'Corte clásico o degradado a tijera y máquina con lavado y asesoría.', 30, '30min', 12.00, '12,00 €', 'corte', 'ESENCIAL', 1),
    ('corte-y-barba', 'Corte y barba', 'Corte integral con perfilado, ritual de toalla caliente y cuidado de barba.', 50, '50min', 18.00, '18,00 €', 'combo', 'POPULAR', 2),
    ('corte-premium', 'Corte premium', 'Corte de autor, diseño de barba, tratamiento capilar y facial exprés.', 60, '1h', 25.00, '25,00 €', 'premium', 'FIRMA JOAO', 3),
    ('recorte-de-barba', 'Recorte de barba', 'Rebaje, simetría, perfilado a navaja tradicional y aceites esenciales.', 20, '20min', 8.00, '8,00 €', 'barba', 'EXPRÉS', 4),
    ('mechas', 'Mechas', 'Efectos de luz, reflejos o mechas platinadas urbanas con matización.', 120, '2h', 45.00, '45,00 €', 'color', 'COLOR', 5),
    ('decoloracion-completa', 'Decoloración completa', 'Aclarado global, fondo blanco o tonos fantasía con protección capilar plex.', 180, '3h', 60.00, '60,00 €', 'color', 'EXTREMO', 6);

-- 7. Inserción de Productos (Perfumes & Peluquería)
INSERT INTO public.products 
    (name, brand, category, description, price_eur, price_label, stock, image_url, tag)
VALUES 
    ('Afnan 9PM Eau de Parfum (100ml)', 'Afnan Perfumes', 'perfumes', 'Fragancia urbana superventas. Notas de manzana silvestre, canela y vainilla ámbar.', 38.00, '38,00 €', 8, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80', 'TOP VENTAS'),
    ('Club de Nuit Intense Man (105ml)', 'Armaf', 'perfumes', 'El clásico ahumado masculino. Salida cítrica con corazón de abedul negro y pachulí.', 42.00, '42,00 €', 5, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 'TENDENCIA'),
    ('Lattafa Khamrah Luxury Edition (100ml)', 'Lattafa', 'perfumes', 'Perfume oriental gourmand. Acordes de coñac, canela, nuez moscada y praliné.', 45.00, '45,00 €', 6, 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80', 'PREMIUM'),
    ('Cera Mate Texturizante Joao Studio (100ml)', 'Joao Lab', 'peluqueria', 'Fijación fuerte de acabado 100% mate sin apelmazar. Base de arcilla blanca.', 14.00, '14,00 €', 15, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80', 'USO EN SALÓN'),
    ('Polvo Voluminizador Mate Styling Powder (20g)', 'Joao Lab', 'peluqueria', 'Micro-polvo de fijación invisible para aplicar en raíz. Crea volumen extremo.', 12.00, '12,00 €', 12, 'https://images.unsplash.com/photo-1608248597359-07f0f666b696?auto=format&fit=crop&w=600&q=80', 'ESENCIAL'),
    ('Aceite Nutritivo Barba & Piel (50ml)', 'Joao Lab', 'peluqueria', 'Fórmula con argán, jojoba y cedro salvaje. Suaviza el vello y calma la piel.', 11.00, '11,00 €', 9, 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80', 'BARBA');

-- 8. Seguridad Row Level Security (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS
CREATE POLICY "Permitir lectura publica de servicios"
    ON public.services FOR SELECT TO public, anon USING (is_active = true);

CREATE POLICY "Permitir lectura publica de productos"
    ON public.products FOR SELECT TO public, anon USING (is_active = true);

CREATE POLICY "Permitir administracion de productos a autenticados"
    ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Privacidad RGPD en citas (solo creación anónima)
CREATE POLICY "Permitir creacion anonima de reservas"
    ON public.appointments FOR INSERT TO public, anon
    WITH CHECK (
        client_name IS NOT NULL AND client_phone IS NOT NULL AND 
        appointment_date IS NOT NULL AND appointment_time IS NOT NULL
    );

CREATE POLICY "Permitir lectura de citas a autenticados"
    ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. Vista pública segura de disponibilidad (solo fecha y hora)
CREATE OR REPLACE VIEW public.appointment_slots AS
SELECT appointment_date, appointment_time, status
FROM public.appointments
WHERE status != 'cancelled';

GRANT SELECT ON public.appointment_slots TO anon, authenticated;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div 
          style={{ 
            backgroundColor: '#09090b', 
            color: '#ffffff', 
            padding: '1.25rem 1.75rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Database size={20} />
            <div>
              <div className="font-headline" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                SCRIPT SQL PARA SUPABASE
              </div>
              <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#a1a1aa', marginTop: '0.15rem' }}>
                TABLAS SERVICES + PRODUCTS + APPOINTMENTS + RLS
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal SQL"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Instructions Banner */}
        <div 
          style={{ 
            backgroundColor: '#fafafa', 
            padding: '1rem 1.75rem', 
            borderBottom: '1px solid #09090b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
          className="font-mono"
        >
          <div style={{ fontSize: '0.75rem', color: '#27272a' }}>
            <strong>PASOS RÁPIDOS:</strong> 1. Abre Supabase → 2. SQL Editor → 3. Pega este código → 4. Ejecuta "RUN".
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="btn-solid-black"
            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '¡COPIADO AL PORTAPAPELES!' : 'COPIAR SCRIPT SQL'}
          </button>
        </div>

        {/* Code View Area */}
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
          <div 
            style={{ 
              backgroundColor: '#09090b', 
              color: '#f4f4f5', 
              padding: '1.25rem', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              maxHeight: '420px',
              overflowY: 'auto',
              border: '1px solid #27272a',
              whiteSpace: 'pre-wrap'
            }}
          >
            {sqlCode}
          </div>

          <div style={{ marginTop: '1.25rem', padding: '1rem', border: '1px solid #e4e4e7', backgroundColor: '#fafafa' }} className="font-mono">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b', marginBottom: '0.35rem' }}>
              VARIABLES DE ENTORNO EN .env
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#52525b' }}>
              Pega tu URL y anon key de Supabase en el archivo <code>.env</code>:
            </div>
            <pre style={{ marginTop: '0.5rem', padding: '0.65rem', background: '#e4e4e7', fontSize: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co{'\n'}
              VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #09090b', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#fafafa' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-outline-brutal"
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.8125rem' }}
          >
            CERRAR VENTANA
          </button>
        </div>
      </div>
    </div>
  );
}
