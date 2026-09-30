-- ==============================================================================
-- INSERTAR 80 HISTÓRICOS DE DESPACHOS EN SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- ==============================================================================

-- 1. Asegurar columnas compatibles
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS numero_guia TEXT DEFAULT '';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS sucursal_destino TEXT DEFAULT '';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS transportista TEXT DEFAULT '';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS placa_vehiculo TEXT DEFAULT '';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS despachador_cedis TEXT DEFAULT '';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS total_piezas NUMERIC DEFAULT 1;
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS total_lineas NUMERIC DEFAULT 1;
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS estado_entrega TEXT DEFAULT 'DESPACHADO';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS lineas_json TEXT DEFAULT '[]';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS cliente TEXT DEFAULT '';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS codigo_repuesto TEXT DEFAULT '';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '';
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS cantidad_despachada NUMERIC DEFAULT 1;
ALTER TABLE public.despachos ADD COLUMN IF NOT EXISTS observaciones TEXT DEFAULT '';

-- 2. Inserciones de las 80 líneas
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-143', 'PED-CV-143', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001113500', '[{"codigoRepuesto":"PK201189-0201","descripcionOficial":"LATCH SWITCH,CARGO DOOR","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ABDIEL RODRIGUEZ","sucursal":"Costa Verde"}]', 'ABDIEL RODRIGUEZ', 'PK201189-0201', 'LATCH SWITCH,CARGO DOOR', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-142', 'PED-CV-142', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001113500', '[{"codigoRepuesto":"PK201189-0201","descripcionOficial":"LATCHSWITCH,CARGO","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"AMERICA MARINA RIVAS","sucursal":"Costa Verde"}]', 'AMERICA MARINA RIVAS', 'PK201189-0201', 'LATCHSWITCH,CARGO', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2111', 'PED-VL-2111', 'Villa Lucre', 'Edwin Blanco', 'CEDIS-MOSTRADOR',
    'Edwin Blanco', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [DESPACHADO A SUCURSAL]. Trazabilidad y seguimiento en vivo transmitido al asesor Edwin Blanco. | 2606M00000SF0005 / P0001169960', '[{"codigoRepuesto":"S111F270909-0301","descripcionOficial":"COVER ASSY, COMPRESSOR","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ANDRES EDUARDO BARRIA","sucursal":"Villa Lucre"}]', 'ANDRES EDUARDO BARRIA', 'S111F270909-0301', 'COVER ASSY, COMPRESSOR', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CH-001', 'PED-CH-001', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | CEDIS / P001', '[{"codigoRepuesto":"CD569F270803-0103-AA","descripcionOficial":"FR DOOR TRIM ASSY,LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ANEL CUBILLA/GARANTIA","sucursal":"Chiriquí"}]', 'ANEL CUBILLA/GARANTIA', 'CD569F270803-0103-AA', 'FR DOOR TRIM ASSY,LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-419', 'PED-VL-419', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2606M00000SF0039 / P0001182720', '[{"codigoRepuesto":"C857F271306-0400","descripcionOficial":"REAR WHEEL ARCH ASSEMBLY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ANGEL HOWARD","sucursal":"Villa Lucre"}]', 'ANGEL HOWARD', 'C857F271306-0400', 'REAR WHEEL ARCH ASSEMBLY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-139', 'PED-CV-139', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001132451', '[{"codigoRepuesto":"PC201189-0202","descripcionOficial":"LATCHSWITCH,CARGO","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ANGELA PATRICIA AYARZA ROBINSON","sucursal":"Costa Verde"}]', 'ANGELA PATRICIA AYARZA ROBINSON', 'PC201189-0202', 'LATCHSWITCH,CARGO', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-C50-005', 'PED-C50-005', 'Calle 50', 'Edilson Uribe', 'CEDIS-MOSTRADOR',
    'Edilson Uribe', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Repuestos embalados, etiquetados y despachados en ruta a la sucursal. | 2606M00000SF0039 / P0001180476', '[{"codigoRepuesto":"C318F270902-0400-AA","descripcionOficial":"RR WHEEL TRIM ASSY,FR-RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ARNULFO BERNAL OLMEDO","sucursal":"Calle 50"}]', 'ARNULFO BERNAL OLMEDO', 'C318F270902-0400-AA', 'RR WHEEL TRIM ASSY,FR-RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-2026-4404', 'PED-2026-4404', 'Tumba Muerto', 'Ulises Barria', 'CEDIS-MOSTRADOR',
    'Ulises Barria', '2026-09-15 23:57', 4, 1, 'DESPACHADO',
    'Guía de despacho #GD-9941 entregada a ruta logística hacia Tumba Muerto. | 2606M00000SF0005 / P001', '[{"codigoRepuesto":"S111F260204-1504","descripcionOficial":"SHOCK ABSORBER ASSY, RR","cantidadSolicitada":4,"cantidadDespachada":4,"estatusLinea":"DESPACHADO","cliente":"Car Rental Panamá Express","sucursal":"Tumba Muerto"}]', 'Car Rental Panamá Express', 'S111F260204-1504', 'SHOCK ABSORBER ASSY, RR', 4
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-2026-4404', 'PED-2026-4404', 'Tumba Muerto', 'Ulises Barria', 'CEDIS-MOSTRADOR',
    'Ulises Barria', '2026-09-15 23:57', 4, 1, 'DESPACHADO',
    'Guía de despacho #GD-9941 entregada a ruta logística hacia Tumba Muerto. | 2606M00000SF0005 / P001', '[{"codigoRepuesto":"B511F260302-1200","descripcionOficial":"BRAKE SHOE ASSY, RR-RH","cantidadSolicitada":4,"cantidadDespachada":4,"estatusLinea":"DESPACHADO","cliente":"Car Rental Panamá Express","sucursal":"Tumba Muerto"}]', 'Car Rental Panamá Express', 'B511F260302-1200', 'BRAKE SHOE ASSY, RR-RH', 4
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-032', 'PED-VL-032', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001132451', '[{"codigoRepuesto":"S203F250101-0201","descripcionOficial":"DRIVESHAFT ASSY,LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"CARLOS CABALLERO","sucursal":"Chiriquí"}]', 'CARLOS CABALLERO', 'S203F250101-0201', 'DRIVESHAFT ASSY,LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-033', 'PED-VL-033', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001128869', '[{"codigoRepuesto":"S203F270501-0102","descripcionOficial":"WINDSHIELD GLASS ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"CARLOS CABALLERO","sucursal":"Villa Lucre"}]', 'CARLOS CABALLERO', 'S203F270501-0102', 'WINDSHIELD GLASS ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CH-2242', 'PED-CH-2242', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Pedido transmitido desde Chiriquí. Colaborador responsable: Nivardo Gutiérrez. | 2604M00000SL0066 / P0001132451', '[{"codigoRepuesto":"PC201164-0801","descripcionOficial":"VENTILADOR A/A","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"CINDY MONTENEGRO","sucursal":"Chiriquí"}]', 'CINDY MONTENEGRO', 'PC201164-0801', 'VENTILADOR A/A', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CH-2242', 'PED-CH-2242', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Pedido transmitido desde Chiriquí. Colaborador responsable: Nivardo Gutiérrez. | 2604M00000SL0066 / P0001132451', '[{"codigoRepuesto":"PC201164-0701","descripcionOficial":"VENTILADOR A/A","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"CINDY MONTENEGRO","sucursal":"Chiriquí"}]', 'CINDY MONTENEGRO', 'PC201164-0701', 'VENTILADOR A/A', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-117', 'PED-VL-117', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Asignación automática desde contenedor 2604M00000SL0066 (Marítimo). Cantidad asignada: 1 unidad(es) • Pallet(s) / CASE NO: [P0001121617]. | 2604M00000SL0066 / P0001121617', '[{"codigoRepuesto":"PC201134-0101","descripcionOficial":"CUBRE POLVO FR-LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Cliente Changan","sucursal":"Villa Lucre"}]', 'Cliente Changan', 'PC201134-0101', 'CUBRE POLVO FR-LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CH-2103', 'PED-CH-2103', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [DESPACHADO A SUCURSAL]. Trazabilidad y seguimiento en vivo transmitido al asesor Nivardo Gutiérrez. | 2608M00000EA0115 / P0001257463', '[{"codigoRepuesto":"CD569F280104-0500-AB","descripcionOficial":"COOLING FAN ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ENRIQUE CHEN","sucursal":"Chiriquí"}]', 'ENRIQUE CHEN', 'CD569F280104-0500-AB', 'COOLING FAN ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-C50-001', 'PED-C50-001', 'Calle 50', 'Edilson Uribe', 'CEDIS-MOSTRADOR',
    'Edilson Uribe', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [DESPACHADO A SUCURSAL]. Trazabilidad y seguimiento en vivo transmitido al asesor Edilson Uribe. | 2606M00000SF0005 / P0001174384', '[{"codigoRepuesto":"NE15T003-2010-AA","descripcionOficial":"WATER PUMP ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"EZRA GADELOFF BASSAN","sucursal":"Calle 50"}]', 'EZRA GADELOFF BASSAN', 'NE15T003-2010-AA', 'WATER PUMP ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2098', 'PED-VL-2098', 'Villa Lucre', 'Edwin Blanco', 'CEDIS-MOSTRADOR',
    'Edwin Blanco', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [C211F280104-0401] en Pallet [P0001181018] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (stock físico agotado (0 un. disponibles en pallet)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2606M00000SF0039 / P001', '[{"codigoRepuesto":"S111F270501-0102-AC","descripcionOficial":"WINDSHIELD GLASS ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"FANNY ANAIS TUNON CARABALLO DE TROY","sucursal":"Villa Lucre"}]', 'FANNY ANAIS TUNON CARABALLO DE TROY', 'S111F270501-0102-AC', 'WINDSHIELD GLASS ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-C50-2074', 'PED-C50-2074', 'Calle 50', 'Edilson Uribe', 'CEDIS-MOSTRADOR',
    'Edilson Uribe', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Ajuste individual de repuesto en pedido: 1 despachados, 0 pendientes. Estatus orden: [DESPACHADO]. | 2606M00000SF0005 / P0001157200', '[{"codigoRepuesto":"EA012-1100","descripcionOficial":"COMPRESSOR ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"HAKOL GROUP, S.A","sucursal":"Calle 50"}]', 'HAKOL GROUP, S.A', 'EA012-1100', 'COMPRESSOR ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-042', 'PED-CV-042', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-16 14:44', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [C201108-3000] en Pallet [P0001162143] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (stock físico agotado (0 un. disponibles en pallet)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P001', '[{"codigoRepuesto":"B511F270102-0200-A","descripcionOficial":"FR FENDER, RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Harold cubilla","sucursal":"Costa Verde"}]', 'Harold cubilla', 'B511F270102-0200-A', 'FR FENDER, RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-033', 'PED-CV-033', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2608M00000EA0115 / P0001257463', '[{"codigoRepuesto":"B511F270702-1203","descripcionOficial":"RADIATOR BRACKET WELDING RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"HAROLD CUBILLA","sucursal":"Costa Verde"}]', 'HAROLD CUBILLA', 'B511F270702-1203', 'RADIATOR BRACKET WELDING RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-035', 'PED-CV-035', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2606M00000SF0039 / P0001182528', '[{"codigoRepuesto":"B511F271301-0200","descripcionOficial":"FR BUMPER","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"HAROLD CUBILLA","sucursal":"Costa Verde"}]', 'HAROLD CUBILLA', 'B511F271301-0200', 'FR BUMPER', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-037', 'PED-CV-037', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2605M00000SL0158 / P0001158444', '[{"codigoRepuesto":"B511F210501-0100","descripcionOficial":"AIR CLEANER ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"HAROLD CUBILLA","sucursal":"Costa Verde"}]', 'HAROLD CUBILLA', 'B511F210501-0100', 'AIR CLEANER ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-041', 'PED-CV-041', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 10, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [C201108-3000] en Pallet [P0001162143] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (stock físico agotado (0 un. disponibles en pallet)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2606M00000SF0039 / P001', '[{"codigoRepuesto":"C201108-3000","descripcionOficial":"CLIP","cantidadSolicitada":10,"cantidadDespachada":10,"estatusLinea":"DESPACHADO","cliente":"HAROLD CUBILLA","sucursal":"Costa Verde"}]', 'HAROLD CUBILLA', 'C201108-3000', 'CLIP', 10
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-2026-4405', 'PED-2026-4405', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Repuesto recibido en mesón. Cliente notificado para retiro. | 2608M00000EA0115 / P001', '[{"codigoRepuesto":"EA15010-0702","descripcionOficial":"EXHAUST MANIFOLD & CONVERTER ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Ing. Fernando De Gracia","sucursal":"Villa Lucre"}]', 'Ing. Fernando De Gracia', 'EA15010-0702', 'EXHAUST MANIFOLD & CONVERTER ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-C50-003', 'PED-C50-003', 'Calle 50', 'Edilson Uribe', 'CEDIS-MOSTRADOR',
    'Edilson Uribe', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [RECOLECTADO]. Trazabilidad y seguimiento en vivo transmitido al asesor Edilson Uribe. | 2604M00000SL0066 / P0001132451', '[{"codigoRepuesto":"PC201189-0202","descripcionOficial":"CERRADURA DE VAGON","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ISIS MIGAR","sucursal":"Calle 50"}]', 'ISIS MIGAR', 'PC201189-0202', 'CERRADURA DE VAGON', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2152', 'PED-VL-2152', 'Villa Lucre', 'Edwin Blanco', 'CEDIS-MOSTRADOR',
    'Edwin Blanco', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [EN RECOLECCIÓN]. Trazabilidad y seguimiento en vivo transmitido al asesor Edwin Blanco. | CEDIS / P001', '[{"codigoRepuesto":"S203F270902-0600","descripcionOficial":"FR WHEEL TRIM ASSY, RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ISIS QUINTERO","sucursal":"Villa Lucre"}]', 'ISIS QUINTERO', 'S203F270902-0600', 'FR WHEEL TRIM ASSY, RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-140', 'PED-CV-140', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001132451', '[{"codigoRepuesto":"PC201189-0202","descripcionOficial":"LATCHSWITCH,CARGO","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"JIMMY LAU LIU","sucursal":"Costa Verde"}]', 'JIMMY LAU LIU', 'PC201189-0202', 'LATCHSWITCH,CARGO', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-078', 'PED-CV-078', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2608M00000EA0115 / P0001257463', '[{"codigoRepuesto":"CD569F280104-0500-AB","descripcionOficial":"COOLING FAN ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"JORGE OSCAR ARAUZ GUERRA","sucursal":"Costa Verde"}]', 'JORGE OSCAR ARAUZ GUERRA', 'CD569F280104-0500-AB', 'COOLING FAN ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-173', 'PED-CV-173', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-16 14:44', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2606M00000SF0005 / P0001163185', '[{"codigoRepuesto":"S202F270108-0400","descripcionOficial":"DRIVING ROD ASSY,BACK DOOR LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Jose Miguel Chen You","sucursal":"Costa Verde"}]', 'Jose Miguel Chen You', 'S202F270108-0400', 'DRIVING ROD ASSY,BACK DOOR LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CH-2201', 'PED-CH-2201', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Asignación automática desde contenedor 2604M00000SL0066 (Marítimo). Cantidad asignada: 1 unidad(es) • Pallet(s) / CASE NO: [P0001130043]. | 2604M00000SL0066 / P0001130043', '[{"codigoRepuesto":"PC201131-0201","descripcionOficial":"BUMPER DELANTERO","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"KEVIN PATIÑO","sucursal":"Chiriquí"}]', 'KEVIN PATIÑO', 'PC201131-0201', 'BUMPER DELANTERO', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CH-2215', 'PED-CH-2215', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Caso aseguradora | 2604M00000SL0066 / P0001121617', '[{"codigoRepuesto":"PC201134-0101-A1","descripcionOficial":"LINNING FR LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"KEVIN PATIÑO","sucursal":"Chiriquí"}]', 'KEVIN PATIÑO', 'PC201134-0101-A1', 'LINNING FR LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-141', 'PED-CV-141', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001113500', '[{"codigoRepuesto":"PK201189-0201","descripcionOficial":"LATCHSWITCH,CARGO","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"LAURA EDITH RODRIGUEZ MOJICA","sucursal":"Costa Verde"}]', 'LAURA EDITH RODRIGUEZ MOJICA', 'PK201189-0201', 'LATCHSWITCH,CARGO', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-158', 'PED-CV-158', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 2, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [ESPERANDO ENVÍO]. Trazabilidad y seguimiento en vivo transmitido al asesor Arquimedes Jordan. | 2606M00000SF0039 / P001', '[{"codigoRepuesto":"S111F260204-1504","descripcionOficial":"ABSORBER ASSY, RR SHOCK","cantidadSolicitada":2,"cantidadDespachada":2,"estatusLinea":"DESPACHADO","cliente":"LEONICIO DE LA FLOR ALBA","sucursal":"Costa Verde"}]', 'LEONICIO DE LA FLOR ALBA', 'S111F260204-1504', 'ABSORBER ASSY, RR SHOCK', 2
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-052', 'PED-CV-052', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [S111F271303-0604] en Pallet [P0001189804] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (ajuste de inventario / merma (3 un. dadas de baja)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P001', '[{"codigoRepuesto":"S111F271303-0302","descripcionOficial":"RR BUMPER DOWN BODY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Liliy Cortes","sucursal":"Costa Verde"}]', 'Liliy Cortes', 'S111F271303-0302', 'RR BUMPER DOWN BODY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-052', 'PED-CV-052', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [S111F271303-0604] en Pallet [P0001189804] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (ajuste de inventario / merma (3 un. dadas de baja)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P001', '[{"codigoRepuesto":"S111F270204-0102","descripcionOficial":"RR COLLISION BEAM ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Liliy Cortes","sucursal":"Costa Verde"}]', 'Liliy Cortes', 'S111F270204-0102', 'RR COLLISION BEAM ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-052', 'PED-CV-052', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [S111F271303-0604] en Pallet [P0001189804] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (ajuste de inventario / merma (3 un. dadas de baja)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P001', '[{"codigoRepuesto":"S111F280503-0501","descripcionOficial":"RR FOG LAMP,RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Liliy Cortes","sucursal":"Costa Verde"}]', 'Liliy Cortes', 'S111F280503-0501', 'RR FOG LAMP,RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-052', 'PED-CV-052', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [S111F271303-0604] en Pallet [P0001189804] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (ajuste de inventario / merma (3 un. dadas de baja)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P001', '[{"codigoRepuesto":"S111F280503-0402-A","descripcionOficial":"FARO ANTINIEBLA RR, LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Liliy Cortes","sucursal":"Costa Verde"}]', 'Liliy Cortes', 'S111F280503-0402-A', 'FARO ANTINIEBLA RR, LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-052', 'PED-CV-052', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [S111F271303-0604] en Pallet [P0001189804] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (ajuste de inventario / merma (3 un. dadas de baja)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P001', '[{"codigoRepuesto":"S111F280706-0202","descripcionOficial":"REVERSING RADAR SENSOR ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Liliy Cortes","sucursal":"Costa Verde"}]', 'Liliy Cortes', 'S111F280706-0202', 'REVERSING RADAR SENSOR ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-052', 'PED-CV-052', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [S111F271303-0604] en Pallet [P0001189804] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (ajuste de inventario / merma (3 un. dadas de baja)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P001', '[{"codigoRepuesto":"S111F271303-0604","descripcionOficial":"RR BUMPER DOWN BODY GARNISH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Liliy Cortes","sucursal":"Costa Verde"}]', 'Liliy Cortes', 'S111F271303-0604', 'RR BUMPER DOWN BODY GARNISH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-057', 'PED-CV-057', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 2, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | CEDIS / P001', '[{"codigoRepuesto":"S111F280706-0202","descripcionOficial":"REVERSING RADAR SENSOR ASSY","cantidadSolicitada":2,"cantidadDespachada":2,"estatusLinea":"DESPACHADO","cliente":"Lily Cortés","sucursal":"Costa Verde"}]', 'Lily Cortés', 'S111F280706-0202', 'REVERSING RADAR SENSOR ASSY', 2
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-057', 'PED-CV-057', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2606M00000SF0039 / P0001162143', '[{"codigoRepuesto":"S111F280503-0402-A","descripcionOficial":"FARO ANTINIEBLA RR, LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Lily Cortés","sucursal":"Costa Verde"}]', 'Lily Cortés', 'S111F280503-0402-A', 'FARO ANTINIEBLA RR, LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-057', 'PED-CV-057', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2606M00000SF0039 / P0001162143', '[{"codigoRepuesto":"S111F280503-0501","descripcionOficial":"RR FOG LAMP,RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Lily Cortés","sucursal":"Costa Verde"}]', 'Lily Cortés', 'S111F280503-0501', 'RR FOG LAMP,RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-057', 'PED-CV-057', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2606M00000SF0039 / P0001182528', '[{"codigoRepuesto":"S111F270204-0102","descripcionOficial":"RR COLLISION BEAM ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Lily Cortés","sucursal":"Costa Verde"}]', 'Lily Cortés', 'S111F270204-0102', 'RR COLLISION BEAM ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-057', 'PED-CV-057', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2606M00000SF0039 / P0001189804', '[{"codigoRepuesto":"S111F271303-0604","descripcionOficial":"RR BUMPER DOWN BODY GARNISH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Lily Cortés","sucursal":"Costa Verde"}]', 'Lily Cortés', 'S111F271303-0604', 'RR BUMPER DOWN BODY GARNISH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-057', 'PED-CV-057', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001119087', '[{"codigoRepuesto":"S111F271303-0302","descripcionOficial":"RR BUMPER DOWN BODY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"Lily Cortés","sucursal":"Costa Verde"}]', 'Lily Cortés', 'S111F271303-0302', 'RR BUMPER DOWN BODY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-138', 'PED-CV-138', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001132451', '[{"codigoRepuesto":"PC201175-0801","descripcionOficial":"FR DOOR, SEAL RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"LIZETH DIAZ VALVERDE","sucursal":"Costa Verde"}]', 'LIZETH DIAZ VALVERDE', 'PC201175-0801', 'FR DOOR, SEAL RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-C50-2098', 'PED-C50-2098', 'Calle 50', 'Edilson Uribe', 'CEDIS-MOSTRADOR',
    'Edilson Uribe', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [S202F271806-0100] en Pallet [P0001258989] (Contenedor 2608M00000EA0115) no cuenta con stock físico disponible en bodega (ajuste de inventario / merma (1 un. dadas de baja)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2606M00000SF0039 / P001', '[{"codigoRepuesto":"S202F271806-0100","descripcionOficial":"WIPER ASSY,RR WINDOW","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"MAXIMILIANO MURILLO","sucursal":"Calle 50"}]', 'MAXIMILIANO MURILLO', 'S202F271806-0100', 'WIPER ASSY,RR WINDOW', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2233', 'PED-VL-2233', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [EN CEDIS]. Trazabilidad y seguimiento en vivo transmitido al asesor Leidys Perez. | CEDIS / P001', '[{"codigoRepuesto":"PC201193-0301","descripcionOficial":"HINGE ASSY, RR DOOR, UPR-LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"MOISES ROMERO","sucursal":"Villa Lucre"}]', 'MOISES ROMERO', 'PC201193-0301', 'HINGE ASSY, RR DOOR, UPR-LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2233', 'PED-VL-2233', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [EN CEDIS]. Trazabilidad y seguimiento en vivo transmitido al asesor Leidys Perez. | CEDIS / P001', '[{"codigoRepuesto":"PC201193-0501","descripcionOficial":"HINGE ASSY, RR DOOR, LWR-LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"MOISES ROMERO","sucursal":"Villa Lucre"}]', 'MOISES ROMERO', 'PC201193-0501', 'HINGE ASSY, RR DOOR, LWR-LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2233', 'PED-VL-2233', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [EN CEDIS]. Trazabilidad y seguimiento en vivo transmitido al asesor Leidys Perez. | CEDIS / P001', '[{"codigoRepuesto":"P201F270502-1501","descripcionOficial":"RR DOOR GLASS REGULATOR ASSY (LEFT)","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"MOISES ROMERO","sucursal":"Villa Lucre"}]', 'MOISES ROMERO', 'P201F270502-1501', 'RR DOOR GLASS REGULATOR ASSY (LEFT)', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-438', 'PED-VL-438', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cliente en espera de pieza | 2604M00000SL0066 / P0001113500', '[{"codigoRepuesto":"PK201189-0201","descripcionOficial":"LATCH SWITCH, CARGO (MANIGUETA)","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"NATURAL WOODWORK, IN","sucursal":"Villa Lucre"}]', 'NATURAL WOODWORK, IN', 'PK201189-0201', 'LATCH SWITCH, CARGO (MANIGUETA)', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2085', 'PED-VL-2085', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 2, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [ESPERANDO ENVÍO]. Trazabilidad y seguimiento en vivo transmitido al asesor Leidys Perez. | 2608M00000EA0115 / P001', '[{"codigoRepuesto":"S302F260502-0301","descripcionOficial":"MOUNT CUSHION ASSY,RR","cantidadSolicitada":2,"cantidadDespachada":2,"estatusLinea":"DESPACHADO","cliente":"NUBIA HERNANDEZ","sucursal":"Villa Lucre"}]', 'NUBIA HERNANDEZ', 'S302F260502-0301', 'MOUNT CUSHION ASSY,RR', 2
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2085', 'PED-VL-2085', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [ESPERANDO ENVÍO]. Trazabilidad y seguimiento en vivo transmitido al asesor Leidys Perez. | 2608M00000EA0115 / P0001258989', '[{"codigoRepuesto":"S202F271806-0100","descripcionOficial":"WIPER ASSY,RR WINDOW","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"NUBIA HERNANDEZ","sucursal":"Villa Lucre"}]', 'NUBIA HERNANDEZ', 'S202F271806-0100', 'WIPER ASSY,RR WINDOW', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-413', 'PED-VL-413', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001128869', '[{"codigoRepuesto":"S203F270501-0102","descripcionOficial":"WINDSHIELD GLASS ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"OCAR MIRANDA","sucursal":"Villa Lucre"}]', 'OCAR MIRANDA', 'S203F270501-0102', 'WINDSHIELD GLASS ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-C50-2094', 'PED-C50-2094', 'Calle 50', 'Edilson Uribe', 'CEDIS-MOSTRADOR',
    'Edilson Uribe', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'ES UN CLIENTE DE GARANTIA QUE TIENE ESPERANDO DESDE EL 7/7/2026 | CEDIS / P001', '[{"codigoRepuesto":"S202F271806-0100","descripcionOficial":"WIPER ASSY,RR WINDOW","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"PEDRO MIRANDA","sucursal":"Calle 50"}]', 'PEDRO MIRANDA', 'S202F271806-0100', 'WIPER ASSY,RR WINDOW', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2084', 'PED-VL-2084', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico masivo actualizado a [DESPACHADO] desde la Matriz Central. | 2608M00000EA0115 / P0001258989', '[{"codigoRepuesto":"S203F271301-1900","descripcionOficial":"FR BUMPER LOWER GRILL GARNISH ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"RAFAEL BERGUIDO MADRID","sucursal":"Villa Lucre"}]', 'RAFAEL BERGUIDO MADRID', 'S203F271301-1900', 'FR BUMPER LOWER GRILL GARNISH ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-030', 'PED-VL-030', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001128827', '[{"codigoRepuesto":"PC201131-0501","descripcionOficial":"PORTA PLACA","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"SEGUROS FEDPA/YARIEL BIRMINGHAN","sucursal":"Chiriquí"}]', 'SEGUROS FEDPA/YARIEL BIRMINGHAN', 'PC201131-0501', 'PORTA PLACA', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-039', 'PED-VL-039', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2606M00000SF0039 / P0001173266', '[{"codigoRepuesto":"C212F271301-0500","descripcionOficial":"ACC COVER  PLATE","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"SURA/ USBEIKA ROJAS","sucursal":"Villa Lucre"}]', 'SURA/ USBEIKA ROJAS', 'C212F271301-0500', 'ACC COVER  PLATE', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CH-014', 'PED-CH-014', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [C212F271301-0500] en Pallet [P0001173266] (Contenedor 2606M00000SF0039) no cuenta con stock físico disponible en bodega (stock físico agotado (0 un. disponibles en pallet)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2606M00000SF0039 / P0001173266', '[{"codigoRepuesto":"C212F271301-0500","descripcionOficial":"ACC COVER PLATE","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"SURA/STEPHANIE QUINTERO","sucursal":"Chiriquí"}]', 'SURA/STEPHANIE QUINTERO', 'C212F271301-0500', 'ACC COVER PLATE', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-182', 'PED-CV-182', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [A301037-0112-AA] en Pallet [P0001126241] (Contenedor 2604M00000SL0066) no cuenta con stock físico disponible en bodega (stock físico agotado (0 un. disponibles en pallet)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P0001132365', '[{"codigoRepuesto":"S301053-0502","descripcionOficial":"TPMS SENSOR ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"TELECOMUNICACIONES DIGITAL, S,A","sucursal":"Costa Verde"}]', 'TELECOMUNICACIONES DIGITAL, S,A', 'S301053-0502', 'TPMS SENSOR ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-182', 'PED-CV-182', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [A301037-0112-AA] en Pallet [P0001126241] (Contenedor 2604M00000SL0066) no cuenta con stock físico disponible en bodega (stock físico agotado (0 un. disponibles en pallet)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P0001128191', '[{"codigoRepuesto":"A301107-2701","descripcionOficial":"CENTER VENT WITH PANEL ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"TELECOMUNICACIONES DIGITAL, S,A","sucursal":"Costa Verde"}]', 'TELECOMUNICACIONES DIGITAL, S,A', 'A301107-2701', 'CENTER VENT WITH PANEL ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-182', 'PED-CV-182', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [A301037-0112-AA] en Pallet [P0001126241] (Contenedor 2604M00000SL0066) no cuenta con stock físico disponible en bodega (stock físico agotado (0 un. disponibles en pallet)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P0001132451', '[{"codigoRepuesto":"A301038-0200-AB","descripcionOficial":"LAMP ASSY REAR COMBINATION RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"TELECOMUNICACIONES DIGITAL, S,A","sucursal":"Costa Verde"}]', 'TELECOMUNICACIONES DIGITAL, S,A', 'A301038-0200-AB', 'LAMP ASSY REAR COMBINATION RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-182', 'PED-CV-182', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [A301037-0112-AA] en Pallet [P0001126241] (Contenedor 2604M00000SL0066) no cuenta con stock físico disponible en bodega (stock físico agotado (0 un. disponibles en pallet)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P0001128827', '[{"codigoRepuesto":"A301038-0100-AB","descripcionOficial":"LAMP ASSY REAR COMBINATION LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"TELECOMUNICACIONES DIGITAL, S,A","sucursal":"Costa Verde"}]', 'TELECOMUNICACIONES DIGITAL, S,A', 'A301038-0100-AB', 'LAMP ASSY REAR COMBINATION LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-2200', 'PED-CV-2200', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    '🚚 Estatus logístico actualizado a [DESCARGANDO DE CONTENEDOR]. Trazabilidad y seguimiento en vivo transmitido al asesor Arquimedes Jordan. | 2604M00000SL0066 / P0001126241', '[{"codigoRepuesto":"A301037-0112-AA","descripcionOficial":"FR COMBINATION LAMP LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"TELECOMUNICACIONES DIGITAL, S,A","sucursal":"Costa Verde"}]', 'TELECOMUNICACIONES DIGITAL, S,A', 'A301037-0112-AA', 'FR COMBINATION LAMP LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-2201', 'PED-CV-2201', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'ENVIADO | 2604M00000SL0066 / P0001126241', '[{"codigoRepuesto":"A301037-0212-AA","descripcionOficial":"FR COMBINATION LAMP I ,RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"TELECOMUNICACIONES DIGITAL, S,A","sucursal":"Costa Verde"}]', 'TELECOMUNICACIONES DIGITAL, S,A', 'A301037-0212-AA', 'FR COMBINATION LAMP I ,RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-2202', 'PED-CV-2202', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'ENVIADO | CEDIS / P001', '[{"codigoRepuesto":"A301038-0100-AB","descripcionOficial":"LAMP ASSY REAR COMBINATION LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"TELECOMUNICACIONES DIGITAL, S,A","sucursal":"Costa Verde"}]', 'TELECOMUNICACIONES DIGITAL, S,A', 'A301038-0100-AB', 'LAMP ASSY REAR COMBINATION LH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-2203', 'PED-CV-2203', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'ENVIADO | CEDIS / P001', '[{"codigoRepuesto":"A301038-0200-AB","descripcionOficial":"LAMP ASSY REAR COMBINATION RH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"TELECOMUNICACIONES DIGITAL, S,A","sucursal":"Costa Verde"}]', 'TELECOMUNICACIONES DIGITAL, S,A', 'A301038-0200-AB', 'LAMP ASSY REAR COMBINATION RH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CV-2204', 'PED-CV-2204', 'Costa Verde', 'Arquimedes Jordan', 'CEDIS-MOSTRADOR',
    'Arquimedes Jordan', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Asignación automática desde contenedor 2604M00000SL0066 (Marítimo). Cantidad asignada: 1 unidad(es) • Pallet(s) / CASE NO: [P0001128191]. | 2604M00000SL0066 / P0001128191', '[{"codigoRepuesto":"A301107-2701","descripcionOficial":"CENTER VENT WITH PANEL ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"TELECOMUNICACIONES DIGITAL, S,A","sucursal":"Costa Verde"}]', 'TELECOMUNICACIONES DIGITAL, S,A', 'A301107-2701', 'CENTER VENT WITH PANEL ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2234', 'PED-VL-2234', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Asignación automática desde contenedor 2604M00000SL0066 (Marítimo). Cantidad asignada: 1 unidad(es) • Pallet(s) / CASE NO: [P0001132249]. | 2604M00000SL0066 / P0001132249', '[{"codigoRepuesto":"S203F270806-0401","descripcionOficial":"BACK DOOR HANDLE BOX","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F270806-0401', 'BACK DOOR HANDLE BOX', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2235', 'PED-VL-2235', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'ENVIADO | 2604M00000SL0066 / P0001130043', '[{"codigoRepuesto":"S203F270906-0100-AA","descripcionOficial":"BACK DOOR TRIM ASSY","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F270906-0100-AA', 'BACK DOOR TRIM ASSY', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2236', 'PED-VL-2236', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'ENVIADO | 2604M00000SL0066 / P0001133265', '[{"codigoRepuesto":"S203F270501-0400","descripcionOficial":"GLASS ASSY BACK","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F270501-0400', 'GLASS ASSY BACK', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2237', 'PED-VL-2237', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'ENVIADO | CEDIS / P001', '[{"codigoRepuesto":"S203F270806-0301","descripcionOficial":"MOLDING ASSY RR BACK","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F270806-0301', 'MOLDING ASSY RR BACK', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2238', 'PED-VL-2238', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Asignación automática desde contenedor 2604M00000SL0066 (Marítimo). Cantidad asignada: 1 unidad(es) • Pallet(s) / CASE NO: [P0001127239]. | 2604M00000SL0066 / P0001127239', '[{"codigoRepuesto":"S203F271303-0900","descripcionOficial":"RR BIMPER UPR","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F271303-0900', 'RR BIMPER UPR', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-2239', 'PED-VL-2239', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-15 23:57', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001128191', '[{"codigoRepuesto":"S203F270801-1000","descripcionOficial":"BACK DOORSILL GARNISH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F270801-1000', 'BACK DOORSILL GARNISH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-CH-021', 'PED-CH-021', 'Chiriquí', 'Nivardo Gutiérrez', 'CEDIS-MOSTRADOR',
    'Nivardo Gutiérrez', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'Asignación automática desde contenedor 2604M00000SL0066 (Marítimo). Cantidad asignada: 1 unidad(es) • Pallet(s) / CASE NO: [P0001130043]. | 2604M00000SL0066 / P0001132249', '[{"codigoRepuesto":"S203F270806-0401","descripcionOficial":"BACK DOOR HANDLE BOX","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Chiriquí"}]', 'YULENIS VEGA/ SURA', 'S203F270806-0401', 'BACK DOOR HANDLE BOX', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-015', 'PED-VL-015', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001132243', '[{"codigoRepuesto":"S203F270108-0300","descripcionOficial":"LATCH DOOR LOCK","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F270108-0300', 'LATCH DOOR LOCK', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-017', 'PED-VL-017', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | CEDIS / P001', '[{"codigoRepuesto":"S203F270806-0301","descripcionOficial":"MOLDING ASSY RR BACK","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F270806-0301', 'MOLDING ASSY RR BACK', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-020', 'PED-VL-020', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'Cargado vía archivo Excel masivo | 2604M00000SL0066 / P0001127239', '[{"codigoRepuesto":"S203F271303-0900","descripcionOficial":"RR BIMPER UPR","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F271303-0900', 'RR BIMPER UPR', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-VL-083', 'PED-VL-083', 'Villa Lucre', 'Leidys Perez', 'CEDIS-MOSTRADOR',
    'Leidys Perez', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    '⚠️ Desasignación automática de integridad: El repuesto [S203F271303-0900] en Pallet [P0001127239] (Contenedor 2604M00000SL0066) no cuenta con stock físico disponible en bodega (stock físico agotado (0 un. disponibles en pallet)). El pedido queda en estado PENDIENTE en espera de nuevo DPL con unidades disponibles. | 2604M00000SL0066 / P0001128191', '[{"codigoRepuesto":"S203F270801-1000","descripcionOficial":"BACK DOORSILL GARNISH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"YULENIS VEGA/ SURA","sucursal":"Villa Lucre"}]', 'YULENIS VEGA/ SURA', 'S203F270801-1000', 'BACK DOORSILL GARNISH', 1
  ) ON CONFLICT DO NOTHING;
INSERT INTO public.despachos (
    numero_guia, pedido_id, sucursal_destino, transportista, placa_vehiculo, 
    despachador_cedis, fecha_despacho, total_piezas, total_lineas, estado_entrega, 
    observaciones, lineas_json, cliente, codigo_repuesto, descripcion, cantidad_despachada
  ) VALUES (
    'ACTA-PED-TM-2103', 'PED-TM-2103', 'Tumba Muerto', 'Ulises Barria', 'CEDIS-MOSTRADOR',
    'Ulises Barria', '2026-09-17 15:49', 1, 1, 'DESPACHADO',
    'Asignación automática desde contenedor 2606M00000SF0005 (Marítimo). Cantidad asignada: 1 unidad(es) • Pallet(s) / CASE NO: [P0001157200]. | 2606M00000SF0005 / P001', '[{"codigoRepuesto":"CD569F270502-0700-AA","descripcionOficial":"WINDOW  REGULATOR ASSY, RR FLOOR, LH","cantidadSolicitada":1,"cantidadDespachada":1,"estatusLinea":"DESPACHADO","cliente":"ZHAOHUAN ZHONG","sucursal":"Tumba Muerto"}]', 'ZHAOHUAN ZHONG', 'CD569F270502-0700-AA', 'WINDOW  REGULATOR ASSY, RR FLOOR, LH', 1
  ) ON CONFLICT DO NOTHING;