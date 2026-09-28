-- ==============================================================================
-- SCHEMA COMPLETO SUPABASE: CEDIS CHANGAN PANAMÁ
-- Reemplaza la estructura anterior en el "SQL Editor" de Supabase
-- ==============================================================================

-- 1. TABLA PRINCIPAL: MATRIZ DE PEDIDOS (Idéntica a la hoja Matriz_Central)
CREATE TABLE IF NOT EXISTS public.matriz_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id TEXT NOT NULL,
    tipo_pedido TEXT DEFAULT 'Taller Mecánico',
    fecha_creacion TEXT DEFAULT '',
    sucursal TEXT NOT NULL,
    colaborador TEXT NOT NULL,
    cliente TEXT NOT NULL,
    modelo_changan TEXT NOT NULL,
    vin TEXT NOT NULL,
    cotizacion_numero_or TEXT DEFAULT '',
    codigo_repuesto TEXT NOT NULL,
    descripcion_oficial TEXT NOT NULL,
    cantidad_solicitada INTEGER DEFAULT 1,
    cantidad_asignada INTEGER DEFAULT 0,
    cantidad_despachada INTEGER DEFAULT 0,
    estatus_linea TEXT DEFAULT 'Pendiente', -- Pendiente, COMPROMETIDO, Asignado, Despachado, Sin Stock
    contenedor_asignado TEXT DEFAULT '',
    pallet_asignado TEXT DEFAULT '',
    package_no TEXT DEFAULT '',
    ubicacion_cedis TEXT DEFAULT '',
    motivo TEXT DEFAULT '',
    transporte TEXT DEFAULT 'Aereo',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA DPL: MANIFIESTOS DE CONTENEDORES (Hoja DPL_Manifiestos)
CREATE TABLE IF NOT EXISTS public.dpl_manifiestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contenedor_id TEXT UNIQUE NOT NULL,
    proveedor TEXT DEFAULT 'Changan China Parts',
    fecha_arribo TEXT DEFAULT '',
    po_referencia TEXT DEFAULT '',
    tipo_transporte TEXT DEFAULT 'Marítimo 40HQ',
    total_piezas INTEGER DEFAULT 0,
    skus_unicos INTEGER DEFAULT 0,
    total_pallets INTEGER DEFAULT 0,
    estado TEXT DEFAULT 'EN TRÁNSITO', -- EN TRÁNSITO, ADUANA, RECIBIDO
    creado_por TEXT DEFAULT 'Admin',
    creado_en TEXT DEFAULT '',
    bl_referencia TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA DPL: INVENTARIO EN BODEGA / CONTENEDOR (Hoja DPL_Detalle)
CREATE TABLE IF NOT EXISTS public.dpl_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventario_id TEXT NOT NULL,
    contenedor_id TEXT NOT NULL,
    pallet_case_no TEXT DEFAULT '',
    package_no TEXT DEFAULT '',
    codigo_repuesto TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad_total INTEGER DEFAULT 0,
    cantidad_asignada INTEGER DEFAULT 0,
    cantidad_despachada INTEGER DEFAULT 0,
    saldo_disponible INTEGER DEFAULT 0,
    ubicacion_cedis TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA DE ASESORES / ENCARGADOS (Hoja BD_Encargados)
CREATE TABLE IF NOT EXISTS public.bd_encargados (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    sucursal TEXT NOT NULL,
    departamento TEXT DEFAULT 'Taller / Mostrador',
    cargo TEXT DEFAULT 'Ejecutivo de Venta',
    telefono TEXT DEFAULT '',
    correo TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.matriz_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpl_manifiestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpl_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_encargados ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS PÚBLICAS DE LECTURA Y ESCRITURA
CREATE POLICY "Lectura matriz_pedidos" ON public.matriz_pedidos FOR SELECT USING (true);
CREATE POLICY "Insercion matriz_pedidos" ON public.matriz_pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion matriz_pedidos" ON public.matriz_pedidos FOR UPDATE USING (true);
CREATE POLICY "Borrado matriz_pedidos" ON public.matriz_pedidos FOR DELETE USING (true);

CREATE POLICY "Lectura dpl_manifiestos" ON public.dpl_manifiestos FOR SELECT USING (true);
CREATE POLICY "Insercion dpl_manifiestos" ON public.dpl_manifiestos FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion dpl_manifiestos" ON public.dpl_manifiestos FOR UPDATE USING (true);

CREATE POLICY "Lectura dpl_detalle" ON public.dpl_detalle FOR SELECT USING (true);
CREATE POLICY "Insercion dpl_detalle" ON public.dpl_detalle FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion dpl_detalle" ON public.dpl_detalle FOR UPDATE USING (true);

CREATE POLICY "Lectura bd_encargados" ON public.bd_encargados FOR SELECT USING (true);
CREATE POLICY "Insercion bd_encargados" ON public.bd_encargados FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion bd_encargados" ON public.bd_encargados FOR UPDATE USING (true);

-- 7. HABILITAR TIEMPO REAL (WEBSOCKETS)
ALTER PUBLICATION supabase_realtime ADD TABLE public.matriz_pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dpl_manifiestos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dpl_detalle;
