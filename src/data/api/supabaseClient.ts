/**
 * Cliente Supabase - Conexión Centralizada en Tiempo Real
 * CEDIS Changan Panamá
 */

import { createClient } from '@supabase/supabase-js';
import type { FilaRastreador } from '../../domain/models/types';

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
 * Genera el siguiente folio correlativo para una sucursal consultando la base de datos
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
      .from('pedidos')
      .select('folio')
      .ilike('folio', `${prefix}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      return `${prefix}101`;
    }

    let maxNum = 100;
    for (const item of data) {
      const parts = item.folio.split('-');
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
 * Guarda un pedido completo con sus líneas de repuesto en Supabase
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
    // Modo demo si no está conectado
    return { ok: true, folio: payload.folio, timestamp };
  }

  try {
    // 1. Insertar Cabecera en la tabla pedidos
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        folio: payload.folio,
        sucursal: payload.sucursal,
        colaborador: payload.colaborador,
        tipo_pedido: payload.tipoPedido,
        cliente: payload.cliente,
        modelo_changan: payload.modeloChangan,
        vin: payload.vin,
        placa: payload.placa || '',
        no_cotizacion: payload.noCotizacion || '',
        observaciones: payload.observaciones || '',
        estado: 'TRANSMITIDO',
      })
      .select('id')
      .single();

    if (pedidoError) {
      console.error('Error al insertar cabecera de pedido:', pedidoError);
      return { ok: false, folio: payload.folio, timestamp, error: pedidoError.message };
    }

    const pedidoId = pedidoData.id;

    // 2. Insertar Detalle en la tabla lineas_pedido
    const lineasToInsert = payload.lineas.map((linea) => ({
      pedido_id: pedidoId,
      folio: payload.folio,
      codigo_repuesto: linea.codigoRepuesto,
      descripcion: linea.descripcion,
      cantidad: linea.cantidad || 1,
      motivo: linea.motivo || '',
      transporte: linea.transporte || 'Aereo',
      peso_unitario_kg: linea.pesoUnitarioKg || 0,
      es_dgr: linea.esDGR || false,
      estatus_linea: 'Pendiente',
      cantidad_asignada: 0,
      cantidad_despachada: 0,
    }));

    const { error: lineasError } = await supabase
      .from('lineas_pedido')
      .insert(lineasToInsert);

    if (lineasError) {
      console.error('Error al insertar líneas de pedido:', lineasError);
      return { ok: false, folio: payload.folio, timestamp, error: lineasError.message };
    }

    return { ok: true, folio: payload.folio, timestamp };
  } catch (err: any) {
    console.error('Error general en guardarPedidoSupabase:', err);
    return { ok: false, folio: payload.folio, timestamp, error: err.message };
  }
}

/**
 * Obtiene todas las filas de pedidos para el Panel de Administrador y Rastreador
 */
export async function obtenerFilasAdminSupabase(): Promise<FilaRastreador[]> {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data: lineas, error: lineasError } = await supabase
      .from('lineas_pedido')
      .select(`
        id,
        folio,
        codigo_repuesto,
        descripcion,
        cantidad,
        cantidad_asignada,
        cantidad_despachada,
        estatus_linea,
        contenedor_asignado,
        pallet_asignado,
        package_no,
        ubicacion_cedis,
        created_at,
        pedidos!inner (
          sucursal,
          colaborador,
          cliente,
          modelo_changan,
          vin,
          no_cotizacion
        )
      `)
      .order('created_at', { ascending: false });

    if (lineasError || !lineas) {
      console.error('Error al cargar pedidos para admin:', lineasError);
      return [];
    }

    // Mapear al modelo de dominio FilaRastreador
    return lineas.map((item: any) => {
      const p = item.pedidos || {};
      return {
        lineaId: item.id,
        pedidoId: item.folio,
        codigoRepuesto: item.codigo_repuesto,
        descripcionOficial: item.descripcion,
        cantidadSolicitada: item.cantidad || 0,
        cantidadAsignada: item.cantidad_asignada || 0,
        cantidadDespachada: item.cantidad_despachada || 0,
        estatusLinea: item.estatus_linea || 'Pendiente',
        contenedorAsignado: item.contenedor_asignado || '',
        palletAsignado: item.pallet_asignado || '',
        packageNo: item.package_no || '',
        ubicacionCedis: item.ubicacion_cedis || '',
        sucursal: p.sucursal || 'Desconocida',
        colaborador: p.colaborador || 'Asesor',
        cliente: p.cliente || 'Consumidor Final',
        modeloChangan: p.modelo_changan || 'No especificado',
        numeroOR: p.no_cotizacion || '',
        vin: p.vin || '',
      };
    });
  } catch (err) {
    console.error('Error obteniendo filas de admin:', err);
    return [];
  }
}

/**
 * Se suscribe en tiempo real a las tablas de pedidos y líneas
 */
export function suscribirCambiosPedidosSupabase(onNuevoPedido: () => void): () => void {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel('cambios_pedidos_admin')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pedidos' },
      () => {
        onNuevoPedido();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lineas_pedido' },
      () => {
        onNuevoPedido();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
