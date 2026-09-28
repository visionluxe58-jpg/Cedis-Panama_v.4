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

// Sanitiza la URL de Supabase eliminando /rest/v1, /storage/v1 o barras finales añadidas por error en Vercel
function sanitizarSupabaseUrl(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '');
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }
}

// Obtención de variables de entorno de Vite sanitizadas
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = sanitizarSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = rawSupabaseAnonKey.trim().replace(/^['"]|['"]$/g, '');

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

  // Guardar SIEMPRE en caché local de inmediato para que el pedido esté visible en el Admin sin demora
  try {
    const local = localStorage.getItem('cedis_pedidos_locales');
    const pedidosLocales: FilaRastreador[] = local ? JSON.parse(local) : [];
    const nuevasFilas: FilaRastreador[] = payload.lineas.map((linea, idx) => ({
      lineaId: `LIN-${Date.now()}-${idx}`,
      pedidoId: payload.folio,
      codigoRepuesto: linea.codigoRepuesto,
      descripcionOficial: linea.descripcion,
      cantidadSolicitada: Number(linea.cantidad) || 1,
      cantidadAsignada: 0,
      cantidadDespachada: 0,
      estatusLinea: 'Pendiente',
      contenedorAsignado: '',
      palletAsignado: '',
      packageNo: '',
      ubicacionCedis: '',
      sucursal: payload.sucursal,
      colaborador: payload.colaborador,
      cliente: payload.cliente,
      modeloChangan: payload.modeloChangan,
      numeroOR: payload.noCotizacion || '',
      vin: payload.vin,
    }));
    const merged = [...nuevasFilas, ...pedidosLocales];
    localStorage.setItem('cedis_pedidos_locales', JSON.stringify(merged.slice(0, 300)));
  } catch (errLocal) {
    console.warn('Error guardando en caché local:', errLocal);
  }

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

      let { error: insertError } = await supabase
        .from('matriz_pedidos')
        .insert(filasToInsert);

      // Fallback a matriz_central
      if (insertError && (insertError.message.includes('relation') || insertError.message.includes('does not exist'))) {
        const respCentral = await supabase.from('matriz_central').insert(filasToInsert);
        if (!respCentral.error) {
          insertError = null;
        }
      }

      // Fallback a pedidos y lineas_pedido
      if (insertError && (insertError.message.includes('relation') || insertError.message.includes('does not exist'))) {
        const { error: errPed } = await supabase.from('pedidos').insert([{
          folio: payload.folio,
          sucursal: payload.sucursal,
          colaborador: payload.colaborador,
          tipo_pedido: payload.tipoPedido,
          cliente: payload.cliente,
          modelo_changan: payload.modeloChangan,
          vin: payload.vin,
          no_cotizacion: payload.noCotizacion || '',
          observaciones: payload.observaciones || '',
        }]);

        if (!errPed) {
          const lineasPedido = payload.lineas.map(l => ({
            folio: payload.folio,
            codigo_repuesto: l.codigoRepuesto,
            descripcion: l.descripcion,
            cantidad: l.cantidad || 1,
            estatus_linea: 'Pendiente',
          }));
          await supabase.from('lineas_pedido').insert(lineasPedido);
          insertError = null;
        }
      }

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
  // Cargar pedidos locales
  let filasLocales: FilaRastreador[] = [];
  try {
    const rawLocal = localStorage.getItem('cedis_pedidos_locales');
    if (rawLocal) {
      filasLocales = JSON.parse(rawLocal);
    }
  } catch {
    filasLocales = [];
  }

  if (!supabase || !isSupabaseConfigured()) {
    return filasLocales;
  }

  try {
    // 1. Intentar cargar desde matriz_pedidos
    let { data, error } = await supabase
      .from('matriz_pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    // Fallback sin order si created_at no existe en tablas importadas de CSV
    if (error) {
      const respSinOrder = await supabase.from('matriz_pedidos').select('*');
      if (!respSinOrder.error && respSinOrder.data) {
        data = respSinOrder.data;
        error = null;
      }
    }

    // Fallback a matriz_central si matriz_pedidos falló o está vacía
    if (error || !data || data.length === 0) {
      const respCentral = await supabase.from('matriz_central').select('*');
      if (!respCentral.error && respCentral.data && respCentral.data.length > 0) {
        data = respCentral.data;
        error = null;
      }
    }

    let filasSupabase: FilaRastreador[] = [];
    if (!error && data && data.length > 0) {
      filasSupabase = data.map((item: any) => {
        const rawEstatus = String(getField(item, ['estatus_linea', 'estatus', 'estado', 'estado_despacho', 'estado_pedido']) || 'Pendiente').trim();
        const cantSolicitada = Number(getField(item, ['cantidad_solicitada', 'cantidad', 'cant_solicitada', 'solicitado'])) || 0;
        const cantDespachada = Number(getField(item, ['cantidad_despachada', 'despachada', 'cant_despachada', 'piezas_despachadas'])) || 0;
        const cantAsignada = Number(getField(item, ['cantidad_asignada', 'asignada', 'cant_asignada'])) || 0;
        const tieneGuia = !!getField(item, ['guia', 'guia_despacho', 'numero_guia', 'acta', 'acta_retiro', 'conduce']);
        const tieneFechaDespacho = !!getField(item, ['fecha_despacho', 'fecha_retiro', 'fecha_entrega']);

        // Detección automática inteligente de si ya fue despachado
        const esDespachado =
          rawEstatus.toUpperCase().includes('DESPACH') ||
          rawEstatus.toUpperCase().includes('ENTREG') ||
          rawEstatus.toUpperCase().includes('RETIR') ||
          (cantDespachada > 0 && cantSolicitada > 0 && cantDespachada >= cantSolicitada) ||
          (cantDespachada > 0 && tieneGuia) ||
          (tieneFechaDespacho && tieneGuia);

        const estatusFinal = esDespachado ? 'Despachado' : (rawEstatus || 'Pendiente');

        return {
          lineaId: String(getField(item, ['linea_id', 'id', 'lineaId']) || `LIN-${Math.random().toString().slice(-6)}`),
          pedidoId: String(getField(item, ['pedido_id', 'id_pedido', 'pedido', 'folio']) || ''),
          codigoRepuesto: String(getField(item, ['codigo_repuesto', 'codigo', 'cod_repuesto', 'part_number']) || ''),
          descripcionOficial: String(getField(item, ['descripcion_oficial', 'descripcion', 'repuesto']) || ''),
          cantidadSolicitada: cantSolicitada,
          cantidadAsignada: esDespachado ? (cantAsignada || cantSolicitada) : cantAsignada,
          cantidadDespachada: esDespachado ? (cantDespachada || cantSolicitada) : cantDespachada,
          estatusLinea: estatusFinal,
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
        };
      });
    }

    // 2. Si las tablas matriz estuvieran vacías, intentar desde lineas_pedido y pedidos
    if (filasSupabase.length === 0) {
      const { data: lineas, error: lineasError } = await supabase
        .from('lineas_pedido')
        .select(`
          id, folio, codigo_repuesto, descripcion, cantidad,
          cantidad_asignada, cantidad_despachada, estatus_linea,
          contenedor_asignado, pallet_asignado, package_no, ubicacion_cedis,
          pedidos (sucursal, colaborador, cliente, modelo_changan, vin, no_cotizacion)
        `);

      if (!lineasError && lineas && lineas.length > 0) {
        filasSupabase = lineas.map((item: any) => {
          const p = item.pedidos || {};
          const rawEstatus = String(item.estatus_linea || 'Pendiente').trim();
          const cantSol = Number(item.cantidad) || 0;
          const cantDesp = Number(item.cantidad_despachada) || 0;
          const esDesp =
            rawEstatus.toUpperCase().includes('DESPACH') ||
            rawEstatus.toUpperCase().includes('ENTREG') ||
            rawEstatus.toUpperCase().includes('RETIR') ||
            (cantDesp > 0 && cantSol > 0 && cantDesp >= cantSol);

          return {
            lineaId: String(item.id),
            pedidoId: String(item.folio || ''),
            codigoRepuesto: String(item.codigo_repuesto || ''),
            descripcionOficial: String(item.descripcion || ''),
            cantidadSolicitada: cantSol,
            cantidadAsignada: esDesp ? (Number(item.cantidad_asignada) || cantSol) : (Number(item.cantidad_asignada) || 0),
            cantidadDespachada: esDesp ? (cantDesp || cantSol) : cantDesp,
            estatusLinea: esDesp ? 'Despachado' : rawEstatus,
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
    }

    // Fusión de filas de Supabase con pedidos locales garantizando que los pedidos nuevos estén siempre visibles
    const mapaUnicos = new Map<string, FilaRastreador>();
    filasSupabase.forEach(f => {
      const key = `${f.pedidoId}_${f.codigoRepuesto}`.toUpperCase();
      mapaUnicos.set(key, f);
    });
    filasLocales.forEach(f => {
      const key = `${f.pedidoId}_${f.codigoRepuesto}`.toUpperCase();
      // Si ya está en Supabase, prevalece Supabase; si no, se agrega el local
      if (!mapaUnicos.has(key)) {
        mapaUnicos.set(key, f);
      }
    });

    const resultadoFinal = Array.from(mapaUnicos.values());
    return resultadoFinal;
  } catch (err) {
    console.error('Error en obtenerFilasAdminSupabase:', err);
    return filasLocales;
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

    // 4. Actualizar en caché local
    try {
      const rawLocal = localStorage.getItem('cedis_pedidos_locales');
      if (rawLocal) {
        const locales: FilaRastreador[] = JSON.parse(rawLocal);
        const actualizados = locales.map(item => {
          if (item.lineaId === lineaId || item.pedidoId === lineaId) {
            return {
              ...item,
              estatusLinea: nuevoEstatus,
              ...(extra?.cantidadDespachada !== undefined ? { cantidadDespachada: extra.cantidadDespachada } : {}),
              ...(extra?.contenedorAsignado ? { contenedorAsignado: extra.contenedorAsignado } : {}),
              ...(extra?.palletAsignado ? { palletAsignado: extra.palletAsignado } : {}),
              ...(extra?.ubicacionCedis ? { ubicacionCedis: extra.ubicacionCedis } : {}),
            };
          }
          return item;
        });
        localStorage.setItem('cedis_pedidos_locales', JSON.stringify(actualizados));
      }
    } catch {}

    return { ok: true };
  } catch (err: any) {
    console.error('Error al actualizar estatus en Supabase:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Elimina uno o múltiples pedidos tanto de la memoria local como de Supabase
 */
export async function eliminarPedidosSupabase(
  lineaIds: string[],
  pedidoIds: string[] = []
): Promise<{ ok: boolean; count: number; error?: string }> {
  // 1. Eliminar siempre de la caché local de inmediato
  try {
    const rawLocal = localStorage.getItem('cedis_pedidos_locales');
    if (rawLocal) {
      const locales: FilaRastreador[] = JSON.parse(rawLocal);
      const filtrados = locales.filter(
        item => !lineaIds.includes(item.lineaId) && !pedidoIds.includes(item.pedidoId)
      );
      localStorage.setItem('cedis_pedidos_locales', JSON.stringify(filtrados));
    }
  } catch (e) {
    console.warn('Error eliminando de caché local:', e);
  }

  if (!supabase || !isSupabaseConfigured()) {
    return { ok: true, count: lineaIds.length || pedidoIds.length };
  }

  try {
    // 2. Eliminar de matriz_pedidos
    if (lineaIds.length > 0) {
      await supabase.from('matriz_pedidos').delete().in('linea_id', lineaIds);
      await supabase.from('matriz_pedidos').delete().in('id', lineaIds);
      await supabase.from('matriz_central').delete().in('linea_id', lineaIds);
      await supabase.from('matriz_central').delete().in('id', lineaIds);
      await supabase.from('lineas_pedido').delete().in('id', lineaIds);
    }

    if (pedidoIds.length > 0) {
      await supabase.from('matriz_pedidos').delete().in('pedido_id', pedidoIds);
      await supabase.from('matriz_central').delete().in('pedido_id', pedidoIds);
      await supabase.from('lineas_pedido').delete().in('folio', pedidoIds);
      await supabase.from('pedidos').delete().in('folio', pedidoIds);
    }

    return { ok: true, count: lineaIds.length || pedidoIds.length };
  } catch (err: any) {
    console.error('Error al eliminar pedidos en Supabase:', err);
    return { ok: false, count: 0, error: err.message };
  }
}

/**
 * Analiza todas las filas de la matriz de pedidos, detecta cuáles fueron despachadas,
 * actualiza su estatus en Supabase para que figuren como 'Despachado'
 * y asegura que existan en el registro de despachos/retiros.
 */
export async function depurarYMigrarDespachadosSupabase(
  filas: FilaRastreador[]
): Promise<{ ok: boolean; migradosCount: number; pendientesCount: number }> {
  const despachadas: FilaRastreador[] = [];
  const pendientes: FilaRastreador[] = [];

  filas.forEach(f => {
    const est = (f.estatusLinea || '').toUpperCase();
    const esDesp =
      est.includes('DESPACH') ||
      est.includes('ENTREG') ||
      est.includes('RETIR') ||
      (f.cantidadDespachada > 0 && f.cantidadDespachada >= f.cantidadSolicitada);

    if (esDesp) {
      despachadas.push({
        ...f,
        estatusLinea: 'Despachado',
        cantidadDespachada: f.cantidadDespachada || f.cantidadSolicitada,
      });
    } else {
      pendientes.push(f);
    }
  });

  if (despachadas.length > 0) {
    // 1. Actualizar estatus en Supabase
    for (const d of despachadas) {
      await actualizarEstatusPedidoSupabase(d.lineaId, 'Despachado', {
        cantidadDespachada: d.cantidadDespachada,
      });
    }

    // 2. Actualizar caché local de pedidos
    try {
      const rawLocal = localStorage.getItem('cedis_pedidos_locales');
      if (rawLocal) {
        const locales: FilaRastreador[] = JSON.parse(rawLocal);
        const actualizados = locales.map(item => {
          const match = despachadas.find(d => d.lineaId === item.lineaId || d.pedidoId === item.pedidoId);
          if (match) {
            return {
              ...item,
              estatusLinea: 'Despachado',
              cantidadDespachada: item.cantidadSolicitada,
            };
          }
          return item;
        });
        localStorage.setItem('cedis_pedidos_locales', JSON.stringify(actualizados));
      }
    } catch {}

    // 3. Registrar en tabla de despachos
    try {
      const rawDesp = localStorage.getItem('cedis_despachos_cache');
      const despachosExistentes: DespachoRegistro[] = rawDesp ? JSON.parse(rawDesp) : [];
      const nuevosDespachos: DespachoRegistro[] = [];

      despachadas.forEach(d => {
        const yaExiste = despachosExistentes.some(prev => prev.pedidoId === d.pedidoId);
        if (!yaExiste) {
          nuevosDespachos.push({
            id: `DSP-AUTO-${d.lineaId}`,
            numeroGuia: `ACTA-${d.pedidoId}`,
            pedidoId: d.pedidoId,
            sucursalDestino: d.sucursal,
            transportista: `Retirado en Mostrador (${d.colaborador || 'Personal Sucursal'})`,
            placaVehiculo: 'RETIRO EN CEDIS',
            despachadorCedis: 'Bodega Central CEDIS',
            fechaDespacho: new Date().toISOString().slice(0, 10),
            totalPiezas: d.cantidadDespachada || d.cantidadSolicitada || 1,
            totalLineas: 1,
            estadoEntrega: 'ENTREGADO',
            observaciones: `Repuesto ${d.codigoRepuesto} (${d.descripcionOficial}) retirado para ${d.cliente || 'Taller'}`,
            lineasJson: JSON.stringify([d]),
          });
        }
      });

      if (nuevosDespachos.length > 0) {
        const combinados = [...nuevosDespachos, ...despachosExistentes];
        localStorage.setItem('cedis_despachos_cache', JSON.stringify(combinados));

        for (const nd of nuevosDespachos) {
          await guardarDespachoSupabase(nd);
        }
      }
    } catch (e) {
      console.warn('Error sincronizando despachos:', e);
    }
  }

  return {
    ok: true,
    migradosCount: despachadas.length,
    pendientesCount: pendientes.length,
  };
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

// Directorio Oficial de Sucursales y Encargados CEDIS Changan Panamá (BD_Encargados)
const DIRECTORIO_ENCARGADOS_OFICIAL: EncargadoSucursal[] = [
  {
    id: 1,
    sucursal: 'Villa Lucre',
    nombre: 'Leidys Perez',
    departamento: 'Mostrador',
    cargo: 'Ejecutiva de Venta',
    telefono: '6561-1360',
    whatsapp: '50765611360',
    correo: 'repuestos@changanpanama.com',
    direccion: 'Vía Tocumen, Entrada Villa Lucre',
  },
  {
    id: 2,
    sucursal: 'Villa Lucre',
    nombre: 'Edwin Blanco',
    departamento: 'Chapistería',
    cargo: 'Ejecutivo de Venta',
    telefono: '6374-8911',
    whatsapp: '50763748911',
    correo: 'repuestos4@changanpanama.com',
    direccion: 'Vía Tocumen, Entrada Villa Lucre',
  },
  {
    id: 3,
    sucursal: 'Villa Lucre',
    nombre: 'Pedro Guerrel',
    departamento: 'Taller Mecánico',
    cargo: 'Facturador',
    telefono: '6511-1363',
    whatsapp: '50765111363',
    correo: 'facturacion.vl@changanpanama.com',
    direccion: 'Vía Tocumen, Entrada Villa Lucre',
  },
  {
    id: 4,
    sucursal: 'Tumba Muerto',
    nombre: 'Ulisses Urriola',
    departamento: 'Taller / Mostrador',
    cargo: 'Ejecutivo de Venta',
    telefono: '6979-9581',
    whatsapp: '50769799581',
    correo: 'repuestostm@changanpanama.com',
    direccion: 'Av. Ricardo J. Alfaro, Frente a Plaza Edison',
  },
  {
    id: 5,
    sucursal: 'Calle 50',
    nombre: 'Edilson Uribe',
    departamento: 'Taller / Mostrador',
    cargo: 'Ejecutivo de Venta',
    telefono: '6849-7262',
    whatsapp: '50768497262',
    correo: 'repuestoscalle50@changanpanama.com',
    direccion: 'Calle 50 y Calle 67 Este, San Francisco',
  },
  {
    id: 6,
    sucursal: 'Costa Verde',
    nombre: 'Arquimedes Jordan',
    departamento: 'Taller / Mostrador',
    cargo: 'Ejecutivo de Venta',
    telefono: '6378-4144',
    whatsapp: '50763784144',
    correo: 'repuestospanamaoeste@changanpanama.com',
    direccion: 'Plaza Uniplaza Costa Verde, Autopista Arraiján - Chorrera',
  },
  {
    id: 7,
    sucursal: 'Chiriquí',
    nombre: 'Nivardo Gutierres',
    departamento: 'Taller / Mostrador',
    cargo: 'Ejecutivo de Venta',
    telefono: '6495-6069',
    whatsapp: '50764956069',
    correo: 'bodegachiriqui@changanpanama.com',
    direccion: 'Vía Interamericana, David, Chiriquí (Junto a Plaza Terronal)',
  },
  {
    id: 8,
    sucursal: 'Costa Verde',
    nombre: 'Juan Arrocha',
    departamento: 'Taller / Mostrador',
    cargo: 'Asistente de Bodega',
    telefono: '6027-0421',
    whatsapp: '50760270421',
    correo: 'bodegacostaverde@changanpanama.com',
    direccion: 'Plaza Uniplaza Costa Verde, Autopista Arraiján - Chorrera',
  },
  {
    id: 9,
    sucursal: 'Chiriquí',
    nombre: 'Roberto Tibbet',
    departamento: 'Taller / Mostrador',
    cargo: 'Jefe de Bodega',
    telefono: '6157-3504',
    whatsapp: '50761573504',
    correo: 'repuestos.ch@changanpanama.com',
    direccion: 'Vía Interamericana, David, Chiriquí (Junto a Plaza Terronal)',
  },
];

/**
 * Obtiene el directorio de encargados desde Supabase (o el catálogo oficial de BD_Encargados)
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
        departamento: String(getField(enc, ['departamento', 'depto', 'area']) || 'Taller / Mostrador'),
        cargo: String(getField(enc, ['cargo', 'puesto', 'rol']) || 'Encargado de Repuestos'),
        telefono: String(getField(enc, ['telefono', 'celular', 'tel']) || '+507 200-0000'),
        whatsapp: String(getField(enc, ['whatsapp', 'telefono']) || '').replace(/[^0-9]/g, ''),
        correo: String(getField(enc, ['correo', 'email']) || 'repuestos@changanpanama.com'),
        direccion: String(getField(enc, ['direccion', 'ubicacion']) || 'Panamá'),
      }));
    }

    return DIRECTORIO_ENCARGADOS_OFICIAL;
  } catch (err) {
    console.error('Error obteniendo encargados de Supabase:', err);
    return DIRECTORIO_ENCARGADOS_OFICIAL;
  }
}

