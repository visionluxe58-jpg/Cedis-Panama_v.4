-- ==============================================================================
-- SCHEMA SUPABASE: TABLAS ADICIONALES (BD_Encargados, Despachos, Auditoria_Kardex, Catalogo)
-- Ejecuta este script en el SQL Editor de Supabase
-- ==============================================================================

-- 1. TABLA: BD_Encargados (Asesores y Colaboradores)
CREATE TABLE IF NOT EXISTS public.bd_encargados (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    sucursal TEXT DEFAULT '',
    departamento TEXT DEFAULT '',
    cargo TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    correo TEXT DEFAULT '',
    datos_completos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: Despachos (Historial de Despachos Físicos)
CREATE TABLE IF NOT EXISTS public.despachos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id TEXT DEFAULT '',
    codigo_repuesto TEXT DEFAULT '',
    descripcion TEXT DEFAULT '',
    cantidad_despachada NUMERIC DEFAULT 0,
    fecha_despacho TEXT DEFAULT '',
    sucursal TEXT DEFAULT '',
    cliente TEXT DEFAULT '',
    colaborador TEXT DEFAULT '',
    datos_completos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: Auditoria_Kardex (Trazabilidad y Movimientos de Inventario)
CREATE TABLE IF NOT EXISTS public.auditoria_kardex (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha TEXT DEFAULT '',
    tipo_movimiento TEXT DEFAULT '',
    codigo_repuesto TEXT DEFAULT '',
    descripcion TEXT DEFAULT '',
    cantidad NUMERIC DEFAULT 0,
    saldo_anterior NUMERIC DEFAULT 0,
    saldo_nuevo NUMERIC DEFAULT 0,
    responsable TEXT DEFAULT '',
    motivo TEXT DEFAULT '',
    datos_completos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: Catalogo_Modelos (Modelos Changan)
CREATE TABLE IF NOT EXISTS public.catalogo_modelos (
    id SERIAL PRIMARY KEY,
    modelo TEXT DEFAULT '',
    codigo TEXT DEFAULT '',
    datos_completos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PERMISOS ROW LEVEL SECURITY (RLS)
ALTER TABLE public.bd_encargados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_kardex ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico bd_encargados" ON public.bd_encargados FOR ALL USING (true);
CREATE POLICY "Publico despachos" ON public.despachos FOR ALL USING (true);
CREATE POLICY "Publico auditoria_kardex" ON public.auditoria_kardex FOR ALL USING (true);
CREATE POLICY "Publico catalogo_modelos" ON public.catalogo_modelos FOR ALL USING (true);

-- 6. HABILITAR TIEMPO REAL
ALTER PUBLICATION supabase_realtime ADD TABLE public.bd_encargados;
ALTER PUBLICATION supabase_realtime ADD TABLE public.despachos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auditoria_kardex;
