/**
 * Cliente Supabase - Conexión Centralizada en Tiempo Real
 * CEDIS Changan Panamá (Mapeo 1:1 con Google Sheets)
 */

import { createClient } from '@supabase/supabase-js';
import type { FilaRastreador, DPLManifiesto, DPLDetalle } from '../../domain/models/types';

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
 * Obtiene todas las filas de matriz_pedidos para el Panel de Administrador y Rastreador
 */
export async function obtenerFilasAdminSupabase(): Promise<FilaRastreador[]> {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('matriz_pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error cargando matriz_pedidos:', error);
      return [];
    }

    return data.map((item: any) => ({
      lineaId: item.id,
      pedidoId: item.pedido_id,
      codigoRepuesto: item.codigo_repuesto,
      descripcionOficial: item.descripcion_oficial,
      cantidadSolicitada: item.cantidad_solicitada || 0,
      cantidadAsignada: item.cantidad_asignada || 0,
      cantidadDespachada: item.cantidad_despachada || 0,
      estatusLinea: item.estatus_linea || 'Pendiente',
      contenedorAsignado: item.contenedor_asignado || '',
      palletAsignado: item.pallet_asignado || '',
      packageNo: item.package_no || '',
      ubicacionCedis: item.ubicacion_cedis || '',
      sucursal: item.sucursal || 'Desconocida',
      colaborador: item.colaborador || 'Asesor',
      cliente: item.cliente || 'Consumidor Final',
      modeloChangan: item.modelo_changan || 'No especificado',
      numeroOR: item.cotizacion_numero_or || '',
      vin: item.vin || '',
    }));
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
    const { data, error } = await supabase
      .from('dpl_manifiestos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((m: any) => ({
      contenedorId: m.contenedor_id,
      proveedor: m.proveedor || '',
      fechaArribo: m.fecha_arribo || '',
      poReferencia: m.po_referencia || '',
      tipoTransporte: m.tipo_transporte || '',
      totalPiezas: m.total_piezas || 0,
      skusUnicos: m.skus_unicos || 0,
      totalPallets: m.total_pallets || 0,
      estado: m.estado || 'EN TRÁNSITO',
      creadoPor: m.creado_por || '',
      creadoEn: m.creado_en || '',
      blReferencia: m.bl_referencia || '',
    }));
  } catch {
    return [];
  }
}

/**
 * Obtiene el detalle de inventario DPL
 */
export async function obtenerDetalleInventarioSupabase(): Promise<DPLDetalle[]> {
  if (!supabase || !isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('dpl_detalle')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      inventarioId: d.inventario_id,
      contenedorId: d.contenedor_id,
      palletCaseNo: d.pallet_case_no || '',
      packageNo: d.package_no || '',
      codigoRepuesto: d.codigo_repuesto,
      descripcion: d.descripcion,
      cantidadTotal: d.cantidad_total || 0,
      cantidadAsignada: d.cantidad_asignada || 0,
      cantidadDespachada: d.cantidad_despachada || 0,
      saldoDisponible: d.saldo_disponible || 0,
      ubicacionCedis: d.ubicacion_cedis || '',
    }));
  } catch {
    return [];
  }
}

/**
 * Se suscribe en tiempo real a matriz_pedidos
 */
export function suscribirCambiosPedidosSupabase(onNuevoPedido: () => void): () => void {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel('cambios_matriz_admin')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matriz_pedidos' },
      () => {
        onNuevoPedido();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
