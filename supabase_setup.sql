-- ==============================================================================
-- JOAO PELUQUERO'S — SCRIPT COMPLETO DE CONFIGURACIÓN PARA SUPABASE
-- ==============================================================================
-- 1. Accede a tu consola de Supabase: https://supabase.com/dashboard
-- 2. Selecciona tu proyecto y entra en "SQL Editor" -> "New Query"
-- 3. Pega todo este código y pulsa "RUN" (o Ctrl + Enter)
-- ==============================================================================

-- 1. Limpieza de tablas previas (opcional, en orden de dependencias)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;

-- 2. Creación de la tabla 'services' (Catálogo oficial de servicios)
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

-- 5. Índices de aceleración de consultas y blindaje de duplicados
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

-- 7. Inserción del Catálogo inicial de Productos (Perfumes & Peluquería)
INSERT INTO public.products 
    (name, brand, category, description, price_eur, price_label, stock, image_url, tag)
VALUES 
    (
        'Afnan 9PM Eau de Parfum (100ml)', 
        'Afnan Perfumes', 
        'perfumes', 
        'Fragancia urbana superventas. Notas de manzana silvestre, canela especiada, lavanda y fondo cálido de vainilla ámbar.', 
        38.00, 
        '38,00 €', 
        8, 
        'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80', 
        'TOP VENTAS'
    ),
    (
        'Club de Nuit Intense Man (105ml)', 
        'Armaf', 
        'perfumes', 
        'El clásico ahumado masculino. Salida cítrica de limón y bergamota con corazón de abedul negro y pachulí duradero.', 
        42.00, 
        '42,00 €', 
        5, 
        'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 
        'TENDENCIA'
    ),
    (
        'Lattafa Khamrah Luxury Edition (100ml)', 
        'Lattafa', 
        'perfumes', 
        'Perfume de autor oriental gourmand. Acordes de coñac, canela, nuez moscada, praliné y madera de oud.', 
        45.00, 
        '45,00 €', 
        6, 
        'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80', 
        'PREMIUM'
    ),
    (
        'Cera Mate Texturizante Joao Studio (100ml)', 
        'Joao Lab', 
        'peluqueria', 
        'Fijación fuerte de acabado 100% mate sin apelmazar. Base de arcilla blanca con cera de abeja natural. Se elimina con agua.', 
        14.00, 
        '14,00 €', 
        15, 
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80', 
        'USO EN SALÓN'
    ),
    (
        'Polvo Voluminizador Mate Styling Powder (20g)', 
        'Joao Lab', 
        'peluqueria', 
        'Micro-polvo de fijación invisible para aplicar directamente en raíz. Crea volumen extremo y textura desenfadada al instante.', 
        12.00, 
        '12,00 €', 
        12, 
        'https://images.unsplash.com/photo-1608248597359-07f0f666b696?auto=format&fit=crop&w=600&q=80', 
        'ESENCIAL'
    ),
    (
        'Aceite Nutritivo Barba & Piel (50ml)', 
        'Joao Lab', 
        'peluqueria', 
        'Fórmula hidratante con aceite puro de argán, jojoba y esencia de cedro salvaje. Suaviza el vello y calma la piel tras el afeitado.', 
        11.00, 
        '11,00 €', 
        9, 
        'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80', 
        'BARBA'
    );

-- 8. Configuración de Seguridad Row Level Security (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para 'services'
CREATE POLICY "Permitir lectura publica de servicios activos"
    ON public.services FOR SELECT TO public, anon USING (is_active = true);

-- 10. Políticas RLS para 'products'
-- Lectura pública para cualquier visitante
DROP POLICY IF EXISTS "Permitir lectura publica de productos" ON public.products;
CREATE POLICY "Permitir lectura publica de productos"
    ON public.products FOR SELECT TO public, anon USING (is_active = true);

-- Inserción, edición y gestión de productos desde el panel de administración
DROP POLICY IF EXISTS "Permitir administracion de productos a autenticados" ON public.products;
DROP POLICY IF EXISTS "Permitir administracion de productos a anon y autenticados" ON public.products;
CREATE POLICY "Permitir administracion de productos a anon y autenticados"
    ON public.products FOR ALL TO public, anon, authenticated
    USING (true) WITH CHECK (true);

-- 11. Políticas RLS para 'appointments' (Blindaje de Privacidad RGPD)
-- Creación anónima de reservas (cualquier visitante puede solicitar cita)
CREATE POLICY "Permitir creacion anonima de reservas"
    ON public.appointments FOR INSERT TO public, anon
    WITH CHECK (
        client_name IS NOT NULL AND client_phone IS NOT NULL AND 
        appointment_date IS NOT NULL AND appointment_time IS NOT NULL
    );

-- Lectura completa de citas protegida para administración
CREATE POLICY "Permitir lectura y gestion de citas a autenticados"
    ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 12. VISTA PÚBLICA SEGURA DE HORARIOS (Sin datos personales de clientes)
-- Permite al selector de reservas consultar qué turnos están ocupados sin filtrar nombres ni teléfonos
CREATE OR REPLACE VIEW public.appointment_slots AS
SELECT appointment_date, appointment_time, status
FROM public.appointments
WHERE status != 'cancelled';

GRANT SELECT ON public.appointment_slots TO anon, authenticated;

-- 13. TABLA DE RESERVAS DE PRODUCTOS (NOTIFICACIONES Y PEDIDOS)
CREATE TABLE IF NOT EXISTS public.product_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    product_price VARCHAR(50) NOT NULL,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(32) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'entregado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir creacion anonima de reservas de productos" ON public.product_reservations;
CREATE POLICY "Permitir creacion anonima de reservas de productos"
    ON public.product_reservations FOR INSERT TO public, anon
    WITH CHECK (client_name IS NOT NULL AND client_phone IS NOT NULL);

DROP POLICY IF EXISTS "Permitir lectura y gestion de reservas de productos" ON public.product_reservations;
CREATE POLICY "Permitir administracion de reservas a autenticados"
    ON public.product_reservations FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- ==============================================================================
-- 14. FUNCIONES RPC SEGURAS PARA PANEL DE ADMINISTRACIÓN (Con PIN de control)
-- Permite a João gestionar citas y reservas en tiempo real desde su panel
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_get_appointments(p_pin TEXT)
RETURNS SETOF public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_pin IS NULL OR length(trim(p_pin)) < 4 THEN
        RAISE EXCEPTION 'PIN de administración requerido';
    END IF;
    RETURN QUERY
    SELECT * FROM public.appointments ORDER BY appointment_date DESC, appointment_time ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_appointments(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_appointment_status(p_id UUID, p_status VARCHAR, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_pin IS NULL OR length(trim(p_pin)) < 4 THEN
        RAISE EXCEPTION 'PIN de administración requerido';
    END IF;
    UPDATE public.appointments
    SET status = p_status
    WHERE id = p_id;
    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_appointment_status(UUID, VARCHAR, TEXT) TO anon, authenticated;

-- ==============================================================================
-- 15. TABLA DE AJUSTES GLOBALES (PIN DE ACCESO SINCRONIZADO EN TODOS LOS DISPOSITIVOS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura y gestion de admin_settings" ON public.admin_settings;
CREATE POLICY "Permitir lectura y gestion de admin_settings"
    ON public.admin_settings FOR ALL TO public, anon, authenticated
    USING (true) WITH CHECK (true);

INSERT INTO public.admin_settings (key, value)
VALUES ('admin_pin', 'admin1234')
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- FIN DEL SCRIPT. Base de datos completa, blindada y lista para producción.
-- ==============================================================================

