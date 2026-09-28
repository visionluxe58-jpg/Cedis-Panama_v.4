-- ==============================================================================
-- SCHEMA SUPABASE: CEDIS CHANGAN PANAMÁ - SISTEMA DE PEDIDOS ESPECIALES
-- Ejecuta este script en el "SQL Editor" de tu proyecto de Supabase
-- ==============================================================================

-- 1. Tabla de Pedidos (Cabecera)
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT UNIQUE NOT NULL,
    sucursal TEXT NOT NULL,
    colaborador TEXT NOT NULL,
    tipo_pedido TEXT DEFAULT 'Taller',
    cliente TEXT NOT NULL,
    modelo_changan TEXT NOT NULL,
    vin TEXT NOT NULL,
    placa TEXT DEFAULT '',
    no_cotizacion TEXT DEFAULT '',
    observaciones TEXT DEFAULT '',
    estado TEXT DEFAULT 'TRANSMITIDO', -- TRANSMITIDO, ASIGNADO, DESPACHADO, ANULADO
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Líneas de Pedido (Detalle de Repuestos)
CREATE TABLE IF NOT EXISTS public.lineas_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
    folio TEXT NOT NULL,
    codigo_repuesto TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    motivo TEXT DEFAULT '',
    transporte TEXT DEFAULT 'Aereo', -- Aereo, Maritimo
    peso_unitario_kg NUMERIC DEFAULT 0,
    es_dgr BOOLEAN DEFAULT false,
    estatus_linea TEXT DEFAULT 'Pendiente', -- Pendiente, Asignado, Despachado, Sin Stock
    cantidad_asignada INTEGER DEFAULT 0,
    cantidad_despachada INTEGER DEFAULT 0,
    contenedor_asignado TEXT DEFAULT '',
    pallet_asignado TEXT DEFAULT '',
    package_no TEXT DEFAULT '',
    ubicacion_cedis TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar seguridad a nivel de filas (Row Level Security - RLS)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineas_pedido ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para permitir lectura y escritura pública anónima (Asesores y Admin)
CREATE POLICY "Permitir lectura publica de pedidos" 
ON public.pedidos FOR SELECT USING (true);

CREATE POLICY "Permitir insercion publica de pedidos" 
ON public.pedidos FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizacion publica de pedidos" 
ON public.pedidos FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura publica de lineas" 
ON public.lineas_pedido FOR SELECT USING (true);

CREATE POLICY "Permitir insercion publica de lineas" 
ON public.lineas_pedido FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizacion publica de lineas" 
ON public.lineas_pedido FOR UPDATE USING (true);

-- 5. Habilitar Realtime para que los cambios se reflejen en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lineas_pedido;

-- 6. Insertar algunos pedidos iniciales de demostración
INSERT INTO public.pedidos (folio, sucursal, colaborador, tipo_pedido, cliente, modelo_changan, vin, placa, no_cotizacion, estado)
VALUES 
('PED-VL-101', 'Villa Lucre', 'Leidys Perez', 'Taller', 'María González', 'CS35 Plus', 'LS5A3ABR8NA000001', 'AB1234', 'COT-2024-001', 'TRANSMITIDO'),
('PED-TM-102', 'Tumba Muerto', 'Ulisses Urriola', 'Mostrador', 'Juan Rodríguez', 'CS55 Plus', 'LS5A3ABR8NA000002', 'CD5678', 'COT-2024-002', 'TRANSMITIDO')
ON CONFLICT (folio) DO NOTHING;

INSERT INTO public.lineas_pedido (folio, codigo_repuesto, descripcion, cantidad, motivo, transporte, estatus_linea, cantidad_asignada, cantidad_despachada)
VALUES
('PED-VL-101', '1422020-KC01', 'Filtro de aceite motor', 10, 'Mantenimiento preventivo', 'Aereo', 'Asignado', 10, 5),
('PED-TM-102', '2213010-B01', 'Pastillas de freno delanteras', 8, 'Desgaste normal', 'Aereo', 'Despachado', 8, 8)
ON CONFLICT DO NOTHING;
