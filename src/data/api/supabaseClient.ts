/**
 * Cliente Supabase - Conexión Centralizada en Tiempo Real
 * CEDIS Changan Panamá (Mapeo 1:1 con Google Sheets)
 */

import { createClient } from '@supabase/supabase-js';
import type {
  FilaRastreador,
  DPLManifiesto,
  DPLDetalle,
  DespachoRegistro,
  EncargadoSucursal,
} from '../../domain/models/types';

// Obtención de variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validar si Supabase está configurado con valores reales
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co')
  );
};

// Instancia del cliente de Supabase (con fallback silencioso)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mapa de prefijos de sucursal
const CODIGOS_SUCURSAL: Record<string, string> = {
  'Villa Lucre': 'VL',
  'Tumba Muerto': 'TM',
  'Calle 50': 'C50',
  'Costa Verde': 'CV',
  'Chiriquí': 'CH',
};

/**
 * Genera el siguiente folio correlativo para una sucursal consultando matriz_pedidos
 */
export async function obtenerSiguienteFolioSupabase(sucursal: string): Promise<string> {
  const codigo = CODIGOS_SUCURSAL[sucursal] || 'GEN';
  const prefix = `PED-${codigo}-`;

  if (!supabase || !isSupabaseConfigured()) {
    const random = Math.floor(Math.random() * 900) + 100;
    return `${prefix}${random}`;
  }

  try {
    const { data, error } = await supabase
      .from('matriz_pedidos')
      .select('pedido_id')
      .ilike('pedido_id', `${prefix}%`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data || data.length === 0) {
      return `${prefix}101`;
    }

    let maxNum = 100;
    for (const item of data) {
      const parts = (item.pedido_id || '').split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }

    return `${prefix}${maxNum + 1}`;
  } catch (err) {
    console.error('Error calculando siguiente folio:', err);
    return `${prefix}${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Guarda un pedido completo en la tabla matriz_pedidos (idéntica a Matriz_Central de Google Sheets)
 */
export async function guardarPedidoSupabase(payload: {
  folio: string;
  sucursal: string;
  colaborador: string;
  tipoPedido: string;
  cliente: string;
  modeloChangan: string;
  vin: string;
  placa?: string;
  noCotizacion?: string;
  observaciones?: string;
  lineas: Array<{
    codigoRepuesto: string;
    descripcion: string;
    cantidad: number;
    motivo?: string;
    transporte?: string;
    pesoUnitarioKg?: number;
    esDGR?: boolean;
  }>;
}): Promise<{ ok: boolean; folio: string; timestamp: string; error?: string }> {
  const timestamp = new Date().toISOString();

  if (!supabase || !isSupabaseConfigured()) {
    return { ok: true, folio: payload.folio, timestamp };
  }

  try {
    const guardarOperacion = async () => {
      const fechaActualStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

      // Crear cada fila en matriz_pedidos
      const filasToInsert = payload.lineas.map((linea) => ({
        pedido_id: payload.folio,
        tipo_pedido: payload.tipoPedido || 'Taller Mecánico',
        fecha_creacion: fechaActualStr,
        sucursal: payload.sucursal,
        colaborador: payload.colaborador,
        cliente: payload.cliente,
        modelo_changan: payload.modeloChangan,
        vin: payload.vin,
        cotizacion_numero_or: payload.noCotizacion || '',
        codigo_repuesto: linea.codigoRepuesto,
        descripcion_oficial: linea.descripcion,
        cantidad_solicitada: linea.cantidad || 1,
        cantidad_asignada: 0,
        cantidad_despachada: 0,
        estatus_linea: 'Pendiente',
        contenedor_asignado: '',
        pallet_asignado: '',
        package_no: '',
        ubicacion_cedis: '',
        motivo: linea.motivo || '',
        transporte: linea.transporte || 'Aereo',
      }));

      const { error: insertError } = await supabase
        .from('matriz_pedidos')
        .insert(filasToInsert);

      if (insertError) {
        console.error('Error insertando en matriz_pedidos:', insertError);
        return {
          ok: false,
          folio: payload.folio,
          timestamp,
          error: insertError.message.includes('relation') || insertError.message.includes('does not exist')
            ? 'La tabla "matriz_pedidos" no existe en Supabase. Corre el script SQL en el SQL Editor.'
            : insertError.message,
        };
      }

      return { ok: true, folio: payload.folio, timestamp };
    };

    const timeoutOperacion = new Promise<{ ok: boolean; folio: string; timestamp: string; error?: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          ok: false,
          folio: payload.folio,
          timestamp,
          error: 'Tiempo de espera agotado al conectar con Supabase. Revisa que las tablas existan.',
        });
      }, 7000);
    });

    return await Promise.race([guardarOperacion(), timeoutOperacion]);
  } catch (err: any) {
    console.error('Error general en guardarPedidoSupabase:', err);
    return { ok: false, folio: payload.folio, timestamp, error: err.message };
  }
}

/**
 * Busca de forma insensible a mayúsculas, espacios y acentos
 * para tolerar importaciones directas de CSV o diferencias de esquema en Supabase
 */
export function getField(obj: any, candidates: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = Object.keys(obj);
  for (const candidate of candidates) {
    const normCandidate = candidate.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      const normKey = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      if (normKey === normCandidate && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        return obj[key];
      }
    }
  }
  return undefined;
}

/**
 * Obtiene todas las filas de matriz_pedidos para el Panel de Administrador y Rastreador
 */
export async function obtenerFilasAdminSupabase(): Promise<FilaRastreador[]> {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  try {
    // 1. Intentar cargar desde matriz_pedidos
    let { data, error } = await supabase
      .from('matriz_pedidos')
      .select('*');

    // Fallback a matriz_central si matriz_pedidos falló o está vacía
    if ((error || !data || data.length === 0)) {
      const respCentral = await supabase.from('matriz_central').select('*');
      if (!respCentral.error && respCentral.data && respCentral.data.length > 0) {
        data = respCentral.data;
        error = null;
      }
    }

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        lineaId: String(getField(item, ['linea_id', 'id', 'lineaId']) || `LIN-${Math.random().toString().slice(-6)}`),
        pedidoId: String(getField(item, ['pedido_id', 'id_pedido', 'pedido', 'folio']) || ''),
        codigoRepuesto: String(getField(item, ['codigo_repuesto', 'codigo', 'cod_repuesto', 'part_number']) || ''),
        descripcionOficial: String(getField(item, ['descripcion_oficial', 'descripcion', 'repuesto']) || ''),
        cantidadSolicitada: Number(getField(item, ['cantidad_solicitada', 'cantidad', 'cant_solicitada', 'solicitado'])) || 0,
        cantidadAsignada: Number(getField(item, ['cantidad_asignada', 'asignada', 'cant_asignada'])) || 0,
        cantidadDespachada: Number(getField(item, ['cantidad_despachada', 'despachada', 'cant_despachada'])) || 0,
        estatusLinea: String(getField(item, ['estatus_linea', 'estatus', 'estado']) || 'Pendiente'),
        contenedorAsignado: String(getField(item, ['contenedor_asignado', 'contenedor', 'contenedor_id']) || ''),
        palletAsignado: String(getField(item, ['pallet_asignado', 'pallet', 'pallet_case_no']) || ''),
        packageNo: String(getField(item, ['package_no', 'paquete', 'package']) || ''),
        ubicacionCedis: String(getField(item, ['ubicacion_cedis', 'ubicacion']) || ''),
        sucursal: String(getField(item, ['sucursal', 'sucursal_destino', 'sucursalorigen']) || 'Villa Lucre'),
        colaborador: String(getField(item, ['colaborador', 'asesor', 'creado_por', 'usuario']) || 'Asesor'),
        cliente: String(getField(item, ['cliente', 'nombre_cliente']) || 'Consumidor Final'),
        modeloChangan: String(getField(item, ['modelo_changan', 'modelo', 'vehiculo']) || 'Changan'),
        numeroOR: String(getField(item, ['cotizacion_numero_or', 'numero_or', 'or', 'no_cotizacion', 'cotizacion']) || ''),
        vin: String(getField(item, ['vin', 'chasis']) || ''),
      }));
    }

    // 2. Si las tablas matriz estuvieran vacías, intentar desde lineas_pedido y pedidos
    const { data: lineas, error: lineasError } = await supabase
      .from('lineas_pedido')
      .select(`
        id, folio, codigo_repuesto, descripcion, cantidad,
        cantidad_asignada, cantidad_despachada, estatus_linea,
        contenedor_asignado, pallet_asignado, package_no, ubicacion_cedis,
        pedidos (sucursal, colaborador, cliente, modelo_changan, vin, no_cotizacion)
      `);

    if (!lineasError && lineas && lineas.length > 0) {
      return lineas.map((item: any) => {
        const p = item.pedidos || {};
        return {
          lineaId: String(item.id),
          pedidoId: String(item.folio || ''),
          codigoRepuesto: String(item.codigo_repuesto || ''),
          descripcionOficial: String(item.descripcion || ''),
          cantidadSolicitada: Number(item.cantidad) || 0,
          cantidadAsignada: Number(item.cantidad_asignada) || 0,
          cantidadDespachada: Number(item.cantidad_despachada) || 0,
          estatusLinea: String(item.estatus_linea || 'Pendiente'),
          contenedorAsignado: String(item.contenedor_asignado || ''),
          palletAsignado: String(item.pallet_asignado || ''),
          packageNo: String(item.package_no || ''),
          ubicacionCedis: String(item.ubicacion_cedis || ''),
          sucursal: String(p.sucursal || 'Desconocida'),
          colaborador: String(p.colaborador || 'Asesor'),
          cliente: String(p.cliente || 'Consumidor Final'),
          modeloChangan: String(p.modelo_changan || 'No especificado'),
          numeroOR: String(p.no_cotizacion || ''),
          vin: String(p.vin || ''),
        };
      });
    }

    return [];
  } catch (err) {
    console.error('Error en obtenerFilasAdminSupabase:', err);
    return [];
  }
}

/**
 * Obtiene los manifiestos de contenedores DPL
 */
export async function obtenerManifiestosSupabase(): Promise<DPLManifiesto[]> {
  if (!supabase || !isSupabaseConfigured()) return [];
  try {
    let { data, error } = await supabase
      .from('dpl_manifiestos')
      .select('*');

    if (error || !data || data.length === 0) {
      const respSingular = await supabase.from('dpl_manifiesto').select('*');
      if (!respSingular.error && respSingular.data && respSingular.data.length > 0) {
        data = respSingular.data;
        error = null;
      }
    }

    if (error || !data || data.length === 0) return [];

    return data.map((m: any) => ({
      contenedorId: String(getField(m, ['contenedor_id', 'contenedor', 'id_contenedor', 'container_id']) || ''),
      proveedor: String(getField(m, ['proveedor', 'vendor']) || 'Changan China Parts'),
      fechaArribo: String(getField(m, ['fecha_arribo', 'fecha', 'eta', 'fecha_llegada']) || ''),
      poReferencia: String(getField(m, ['po_referencia', 'po', 'referencia_po']) || ''),
      tipoTransporte: String(getField(m, ['tipo_transporte', 'transporte', 'tipo']) || 'Marítimo 40HQ'),
      totalPiezas: Number(getField(m, ['total_piezas', 'piezas', 'total_items'])) || 0,
      skusUnicos: Number(getField(m, ['skus_unicos', 'skus', 'total_skus'])) || 0,
      totalPallets: Number(getField(m, ['total_pallets', 'pallets', 'bultos'])) || 0,
      estado: (getField(m, ['estado', 'estatus']) || 'EN TRÁNSITO').toUpperCase() as any,
      creadoPor: String(getField(m, ['creado_por', 'usuario']) || 'Admin'),
      creadoEn: String(getField(m, ['creado_en', 'created_at', 'fecha_creacion']) || ''),
      blReferencia: String(getField(m, ['bl_referencia', 'bl', 'bill_of_lading']) || ''),
    }));
  } catch (err) {
    console.error('Error en obtenerManifiestosSupabase:', err);
    return [];
  }
}

/**
 * Obtiene el detalle de inventario DPL
 */
export async function obtenerDetalleInventarioSupabase(): Promise<DPLDetalle[]> {
  if (!supabase || !isSupabaseConfigured()) return [];
  try {
    let { data, error } = await supabase
      .from('dpl_detalle')
      .select('*');

    if (error || !data || data.length === 0) {
      const respPlural = await supabase.from('dpl_detalles').select('*');
      if (!respPlural.error && respPlural.data && respPlural.data.length > 0) {
        data = respPlural.data;
        error = null;
      }
    }

    if (error || !data || data.length === 0) return [];

    return data.map((d: any) => {
      const cantidadTotal = Number(getField(d, ['cantidad_total', 'total', 'cantidad', 'piezas'])) || 0;
      const cantidadAsignada = Number(getField(d, ['cantidad_asignada', 'asignada'])) || 0;
      const saldoDisponible = getField(d, ['saldo_disponible', 'saldo', 'disponible']) !== undefined
        ? Number(getField(d, ['saldo_disponible', 'saldo', 'disponible']))
        : (cantidadTotal - cantidadAsignada);

      return {
        inventarioId: String(getField(d, ['inventario_id', 'id', 'item_id']) || `INV-${Math.random().toString().slice(-6)}`),
        contenedorId: String(getField(d, ['contenedor_id', 'contenedor', 'container_id']) || ''),
        palletCaseNo: String(getField(d, ['pallet_case_no', 'pallet', 'case_no']) || ''),
        packageNo: String(getField(d, ['package_no', 'paquete', 'pkg_no']) || ''),
        codigoRepuesto: String(getField(d, ['codigo_repuesto', 'codigo', 'part_number']) || ''),
        descripcion: String(getField(d, ['descripcion', 'repuesto', 'descripcion_oficial']) || ''),
        cantidadTotal,
        cantidadAsignada,
        cantidadDespachada: Number(getField(d, ['cantidad_despachada', 'despachada'])) || 0,
        saldoDisponible: saldoDisponible >= 0 ? saldoDisponible : 0,
        ubicacionCedis: String(getField(d, ['ubicacion_cedis', 'ubicacion']) || ''),
      };
    });
  } catch (err) {
    console.error('Error en obtenerDetalleInventarioSupabase:', err);
    return [];
  }
}

/**
 * Se suscribe en tiempo real a matriz_pedidos y tablas de inventario
 */
export function suscribirCambiosPedidosSupabase(onActualizar: () => void): () => void {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel('cambios_sistema_admin')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matriz_pedidos' }, () => onActualizar())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dpl_manifiestos' }, () => onActualizar())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dpl_detalle' }, () => onActualizar())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'despachos' }, () => onActualizar())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => onActualizar())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lineas_pedido' }, () => onActualizar())
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Actualiza el estatus y asignación de un pedido en Supabase
 */
export async function actualizarEstatusPedidoSupabase(
  lineaId: string,
  nuevoEstatus: 'Pendiente' | 'En Picking' | 'Asignado' | 'Despachado' | 'Sin Stock',
  extra?: {
    cantidadDespachada?: number;
    contenedorAsignado?: string;
    palletAsignado?: string;
    ubicacionCedis?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return { ok: true };
  }

  try {
    const updateData: Record<string, any> = {
      estatus_linea: nuevoEstatus,
    };

    if (extra?.cantidadDespachada !== undefined) {
      updateData.cantidad_despachada = extra.cantidadDespachada;
    }
    if (extra?.contenedorAsignado) {
      updateData.contenedor_asignado = extra.contenedorAsignado;
    }
    if (extra?.palletAsignado) {
      updateData.pallet_asignado = extra.palletAsignado;
    }
    if (extra?.ubicacionCedis) {
      updateData.ubicacion_cedis = extra.ubicacionCedis;
    }

    // 1. Intentar actualizar en matriz_pedidos
    const { error: errMatriz } = await supabase
      .from('matriz_pedidos')
      .update(updateData)
      .eq('id', lineaId);

    // 2. Si no encontró por id (o fue importada de CSV sin id), intentar por pedido_id
    if (errMatriz) {
      await supabase
        .from('matriz_pedidos')
        .update(updateData)
        .eq('pedido_id', lineaId);
    }

    // 3. También intentar en lineas_pedido por compatibilidad
    await supabase
      .from('lineas_pedido')
      .update(updateData)
      .eq('id', lineaId);

    return { ok: true };
  } catch (err: any) {
    console.error('Error al actualizar estatus en Supabase:', err);
    return { ok: false, error: err.message };
  }
}

const STORAGE_KEY_DESPACHOS = 'cedis_despachos_cache';

/**
 * Guarda un despacho en la tabla despachos de Supabase y en caché local
 */
export async function guardarDespachoSupabase(
  despacho: Omit<DespachoRegistro, 'id'>
): Promise<{ ok: boolean; id: string; error?: string }> {
  const generatedId = `DSP-${Date.now().toString().slice(-6)}`;
  const registroCompleto: DespachoRegistro = {
    ...despacho,
    id: generatedId,
  };

  // Guardar en caché local siempre
  try {
    const local = localStorage.getItem(STORAGE_KEY_DESPACHOS);
    const despachosLocales: DespachoRegistro[] = local ? JSON.parse(local) : [];
    despachosLocales.unshift(registroCompleto);
    localStorage.setItem(STORAGE_KEY_DESPACHOS, JSON.stringify(despachosLocales.slice(0, 100)));
  } catch (e) {
    console.error('Error guardando despacho local:', e);
  }

  if (!supabase || !isSupabaseConfigured()) {
    return { ok: true, id: generatedId };
  }

  try {
    const payload = {
      numero_guia: despacho.numeroGuia,
      pedido_id: despacho.pedidoId,
      sucursal_destino: despacho.sucursalDestino,
      transportista: despacho.transportista,
      placa_vehiculo: despacho.placaVehiculo,
      despachador_cedis: despacho.despachadorCedis,
      fecha_despacho: despacho.fechaDespacho,
      total_piezas: despacho.totalPiezas,
      total_lineas: despacho.totalLineas,
      estado_entrega: despacho.estadoEntrega,
      observaciones: despacho.observaciones || '',
      lineas_json: despacho.lineasJson || '',
    };

    const { data, error } = await supabase
      .from('despachos')
      .insert([payload])
      .select('id')
      .single();

    if (error) {
      console.warn('Tabla despachos no disponible en Supabase, guardado en caché local:', error.message);
      return { ok: true, id: generatedId };
    }

    return { ok: true, id: data?.id || generatedId };
  } catch (err: any) {
    console.error('Error guardando despacho en Supabase:', err);
    return { ok: true, id: generatedId };
  }
}

/**
 * Obtiene el historial de despachos desde Supabase (con fallback a caché local)
 */
export async function obtenerDespachosSupabase(): Promise<DespachoRegistro[]> {
  let despachosLocales: DespachoRegistro[] = [];
  try {
    const local = localStorage.getItem(STORAGE_KEY_DESPACHOS);
    if (local) despachosLocales = JSON.parse(local);
  } catch {
    despachosLocales = [];
  }

  if (!supabase || !isSupabaseConfigured()) {
    return despachosLocales;
  }

  try {
    const { data, error } = await supabase
      .from('despachos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: String(getField(d, ['id', 'despacho_id']) || `DSP-${Math.random().toString().slice(-5)}`),
        numeroGuia: String(getField(d, ['numero_guia', 'guia', 'no_guia']) || 'GUIA-000'),
        pedidoId: String(getField(d, ['pedido_id', 'id_pedido', 'pedido']) || 'PED-GEN'),
        sucursalDestino: String(getField(d, ['sucursal_destino', 'sucursal', 'destino']) || 'Villa Lucre'),
        transportista: String(getField(d, ['transportista', 'chofer', 'conductor']) || 'Transporte CEDIS'),
        placaVehiculo: String(getField(d, ['placa_vehiculo', 'placa', 'unidad']) || 'CAMION-01'),
        despachadorCedis: String(getField(d, ['despachador_cedis', 'despachador', 'usuario']) || 'Admin CEDIS'),
        fechaDespacho: String(getField(d, ['fecha_despacho', 'fecha', 'created_at']) || new Date().toISOString().slice(0, 10)),
        totalPiezas: Number(getField(d, ['total_piezas', 'piezas', 'total_items'])) || 1,
        totalLineas: Number(getField(d, ['total_lineas', 'lineas'])) || 1,
        estadoEntrega: (getField(d, ['estado_entrega', 'estado', 'estatus']) || 'EN TRANSITO').toUpperCase() as any,
        observaciones: String(getField(d, ['observaciones', 'notas']) || ''),
        lineasJson: String(getField(d, ['lineas_json', 'detalle']) || ''),
      }));
    }

    return despachosLocales;
  } catch (err) {
    console.error('Error obteniendo despachos de Supabase:', err);
    return despachosLocales;
  }
}

/**
 * Actualiza la ubicación física o saldo de un repuesto en bodega DPL
 */
export async function actualizarUbicacionRepuestoSupabase(
  inventarioId: string,
  nuevaUbicacion: string,
  nuevoSaldo?: number
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return { ok: true };
  }

  try {
    const updateData: Record<string, any> = {
      ubicacion_cedis: nuevaUbicacion,
    };
    if (nuevoSaldo !== undefined) {
      updateData.saldo_disponible = nuevoSaldo;
    }

    let { error } = await supabase
      .from('dpl_detalle')
      .update(updateData)
      .eq('id', inventarioId);

    if (error) {
      await supabase
        .from('dpl_detalle')
        .update(updateData)
        .eq('inventario_id', inventarioId);
    }

    return { ok: true };
  } catch (err: any) {
    console.error('Error actualizando ubicación en Supabase:', err);
    return { ok: false, error: err.message };
  }
}

// Directorio Oficial de Sucursales y Encargados CEDIS Changan Panamá
const DIRECTORIO_ENCARGADOS_OFICIAL: EncargadoSucursal[] = [
  {
    id: 'ENC-01',
    sucursal: 'Villa Lucre',
    nombre: 'Leidys Perez',
    cargo: 'Jefa de Repuestos & Taller',
    telefono: '+507 277-8899',
    whatsapp: '50762778899',
    correo: 'repuestos.vl@changanpanama.com',
    direccion: 'Vía Tocumen, Entrada Villa Lucre',
    horarioAtencion: 'Lunes a Viernes 7:30 AM - 5:00 PM | Sábados 8:00 AM - 1:00 PM',
  },
  {
    id: 'ENC-02',
    sucursal: 'Tumba Muerto',
    nombre: 'Ulisses Urriola',
    cargo: 'Coordinador de Taller & Garantías',
    telefono: '+507 236-1200',
    whatsapp: '50762361200',
    correo: 'repuestos.tm@changanpanama.com',
    direccion: 'Av. Ricardo J. Alfaro, Frente a Plaza Edison',
    horarioAtencion: 'Lunes a Viernes 7:30 AM - 5:00 PM | Sábados 8:00 AM - 1:00 PM',
  },
  {
    id: 'ENC-03',
    sucursal: 'Calle 50',
    nombre: 'Edilson Uribe',
    cargo: 'Jefe de Servicio y Posventa',
    telefono: '+507 264-5500',
    whatsapp: '50762645500',
    correo: 'repuestos.c50@changanpanama.com',
    direccion: 'Calle 50 y Calle 67 Este, San Francisco',
    horarioAtencion: 'Lunes a Viernes 8:00 AM - 5:00 PM | Sábados 8:00 AM - 12:00 PM',
  },
  {
    id: 'ENC-04',
    sucursal: 'Costa Verde',
    nombre: 'Arquimedes Jordan',
    cargo: 'Encargado de Repuestos La Chorrera',
    telefono: '+507 344-9000',
    whatsapp: '50763449000',
    correo: 'repuestos.cv@changanpanama.com',
    direccion: 'Plaza Uniplaza Costa Verde, Autopista Arraiján - Chorrera',
    horarioAtencion: 'Lunes a Viernes 8:00 AM - 5:00 PM | Sábados 8:00 AM - 1:00 PM',
  },
  {
    id: 'ENC-05',
    sucursal: 'Chiriquí',
    nombre: 'Nivardo Gutierres',
    cargo: 'Administrador Regional David & Provincias Centrales',
    telefono: '+507 775-4300',
    whatsapp: '50767754300',
    correo: 'repuestos.ch@changanpanama.com',
    direccion: 'Vía Interamericana, David, Chiriquí (Junto a Plaza Terronal)',
    horarioAtencion: 'Lunes a Viernes 8:00 AM - 5:00 PM | Sábados 8:00 AM - 1:00 PM',
  },
];

/**
 * Obtiene el directorio de encargados desde Supabase (o el catálogo oficial)
 */
export async function obtenerEncargadosSupabase(): Promise<EncargadoSucursal[]> {
  if (!supabase || !isSupabaseConfigured()) {
    return DIRECTORIO_ENCARGADOS_OFICIAL;
  }

  try {
    const { data, error } = await supabase
      .from('bd_encargados')
      .select('*');

    if (!error && data && data.length > 0) {
      return data.map((enc: any, index: number) => ({
        id: String(getField(enc, ['id', 'encargado_id']) || `ENC-${index + 1}`),
        sucursal: String(getField(enc, ['sucursal', 'nombre_sucursal']) || 'Sucursal Changan'),
        nombre: String(getField(enc, ['nombre', 'colaborador', 'encargado']) || 'Asesor'),
        cargo: String(getField(enc, ['cargo', 'puesto', 'rol']) || 'Encargado de Repuestos'),
        telefono: String(getField(enc, ['telefono', 'celular', 'tel']) || '+507 200-0000'),
        whatsapp: String(getField(enc, ['whatsapp', 'telefono']) || '').replace(/[^0-9]/g, ''),
        correo: String(getField(enc, ['correo', 'email']) || 'repuestos@changanpanama.com'),
        direccion: String(getField(enc, ['direccion', 'ubicacion']) || 'Panamá'),
        horarioAtencion: String(getField(enc, ['horario', 'horario_atencion']) || 'Lunes a Viernes 8:00 AM - 5:00 PM'),
      }));
    }

    return DIRECTORIO_ENCARGADOS_OFICIAL;
  } catch (err) {
    console.error('Error obteniendo encargados de Supabase:', err);
    return DIRECTORIO_ENCARGADOS_OFICIAL;
  }
}

