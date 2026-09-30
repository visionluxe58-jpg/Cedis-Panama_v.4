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
  PedidoHistorialAsesor,
  LineaHistorialAsesor,
  EstatusDPL,
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

  // 1. Deduplicar líneas internas del formulario si se repite el mismo código
  const mapaLineasUnicas = new Map<string, typeof payload.lineas[0]>();
  payload.lineas.forEach(l => {
    const cod = (l.codigoRepuesto || '').trim().toUpperCase();
    if (!mapaLineasUnicas.has(cod)) {
      mapaLineasUnicas.set(cod, { ...l, codigoRepuesto: cod });
    } else {
      const exist = mapaLineasUnicas.get(cod)!;
      exist.cantidad = (Number(exist.cantidad) || 1) + (Number(l.cantidad) || 1);
    }
  });
  const lineasNormalizadas = Array.from(mapaLineasUnicas.values());

  // Guardar SIEMPRE en caché local de inmediato para que el pedido esté visible en el Admin sin demora
  try {
    const local = localStorage.getItem('cedis_pedidos_locales');
    const pedidosLocales: FilaRastreador[] = local ? JSON.parse(local) : [];
    const nuevasFilas: FilaRastreador[] = lineasNormalizadas.map((linea, idx) => ({
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

      // Verificación de idempotencia: si el folio ya existe en Supabase (ej: doble clic rápido), no duplicar
      const { data: yaExiste } = await supabase
        .from('matriz_pedidos')
        .select('id')
        .eq('pedido_id', payload.folio)
        .limit(1);

      if (yaExiste && yaExiste.length > 0) {
        console.log(`🛡️ [CEDIS ANTI-DUPLICADOS] El pedido ${payload.folio} ya existe en Supabase. Omitiendo duplicación.`);
        return { ok: true, folio: payload.folio, timestamp };
      }

      // Crear cada fila en matriz_pedidos
      const filasToInsert = lineasNormalizadas.map((linea) => ({
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
 * Importa en lote una colección de pedidos de backup hacia Supabase y memoria local
 */
export async function importarFilasBackupSupabase(
  filas: FilaRastreador[],
  onProgress?: (porcentaje: number) => void
): Promise<{ ok: boolean; totalInsertadas: number; totalExistentesOmitidas: number; pedidosUnicos: number; error?: string }> {
  if (!filas || filas.length === 0) {
    return { ok: true, totalInsertadas: 0, totalExistentesOmitidas: 0, pedidosUnicos: 0 };
  }

  const pedidosSet = new Set<string>();
  const payloadToInsert = filas.map(f => {
    pedidosSet.add(f.pedidoId);
    return {
      pedido_id: f.pedidoId,
      tipo_pedido: 'Pedido Especial Taller / Backup',
      fecha_creacion: (f as any).fechaOriginal || new Date().toISOString().replace('T', ' ').slice(0, 19),
      sucursal: f.sucursal,
      colaborador: f.colaborador,
      cliente: f.cliente,
      modelo_changan: f.modeloChangan,
      vin: f.vin,
      cotizacion_numero_or: f.numeroOR,
      codigo_repuesto: f.codigoRepuesto,
      descripcion_oficial: f.descripcionOficial,
      cantidad_solicitada: f.cantidadSolicitada || 1,
      cantidad_asignada: f.cantidadAsignada || 0,
      cantidad_despachada: f.cantidadDespachada || 0,
      estatus_linea: f.estatusLinea || 'Pendiente',
      contenedor_asignado: f.contenedorAsignado || '',
      pallet_asignado: f.palletAsignado || '',
      package_no: f.packageNo || '',
      ubicacion_cedis: f.ubicacionCedis || '',
      motivo: 'Carga Histórica Backup',
      transporte: 'Aereo',
    };
  });

  let totalExistentesOmitidas = 0;
  let payloadFiltrado = payloadToInsert;

  // 1. Verificar registros existentes en Supabase para evitar duplicación o triplicación
  if (isSupabaseConfigured() && supabase) {
    try {
      const pedidosArray = Array.from(pedidosSet);
      const setExistentes = new Set<string>();
      const setClientesExistentes = new Set<string>();

      // Consultar en lotes de 40 pedidos
      for (let i = 0; i < pedidosArray.length; i += 40) {
        const chunkPedidos = pedidosArray.slice(i, i + 40);
        const { data: dataExistentes } = await supabase
          .from('matriz_pedidos')
          .select('pedido_id, codigo_repuesto, cliente, cotizacion_numero_or')
          .in('pedido_id', chunkPedidos);

        if (dataExistentes) {
          dataExistentes.forEach((r: any) => {
            const pid = String(r.pedido_id || '').trim().toUpperCase();
            const cod = String(r.codigo_repuesto || '').trim().toUpperCase();
            const cli = String(r.cliente || '').trim().toUpperCase().replace(/\s+/g, ' ');
            const or = String(r.cotizacion_numero_or || '').trim().toUpperCase();

            setExistentes.add(`${pid}___${cod}`);
            setClientesExistentes.add(`${cli}___${or}___${cod}`);
          });
        }
      }

      // Filtrar filas que ya existen exactamente en la base de datos
      const nuevasFilas: typeof payloadToInsert = [];
      payloadToInsert.forEach(item => {
        const pid = String(item.pedido_id || '').trim().toUpperCase();
        const cod = String(item.codigo_repuesto || '').trim().toUpperCase();
        const cli = String(item.cliente || '').trim().toUpperCase().replace(/\s+/g, ' ');
        const or = String(item.cotizacion_numero_or || '').trim().toUpperCase();

        const keyPedido = `${pid}___${cod}`;
        const keyCliente = `${cli}___${or}___${cod}`;

        if (setExistentes.has(keyPedido) || setClientesExistentes.has(keyCliente)) {
          totalExistentesOmitidas++;
        } else {
          nuevasFilas.push(item);
          // Registrar en sets locales para no duplicar dentro del mismo archivo
          setExistentes.add(keyPedido);
          setClientesExistentes.add(keyCliente);
        }
      });

      payloadFiltrado = nuevasFilas;
      console.log(`🛡️ [CEDIS ANTI-DUPLICADOS] Filas a insertar: ${payloadFiltrado.length}, Filas ya existentes omitidas: ${totalExistentesOmitidas}`);
    } catch (errCheck) {
      console.warn('Advertencia al consultar filas existentes en Supabase:', errCheck);
      // Continuar con el lote original si la consulta previa falló
    }
  }

  // 2. Guardar en memoria local (garantiza persistencia inmediata en frontend)
  try {
    const rawLocal = localStorage.getItem('cedis_filas_admin');
    const locales: any[] = rawLocal ? JSON.parse(rawLocal) : [];
    const mapaLocales = new Map<string, any>();
    locales.forEach(l => mapaLocales.set(`${l.pedidoId}_${l.codigoRepuesto}`.toUpperCase(), l));
    filas.forEach(f => {
      const k = `${f.pedidoId}_${f.codigoRepuesto}`.toUpperCase();
      if (!mapaLocales.has(k)) {
        mapaLocales.set(k, f);
      }
    });
    localStorage.setItem('cedis_filas_admin', JSON.stringify(Array.from(mapaLocales.values())));
  } catch (e) {
    console.warn('Error guardando backup en localStorage:', e);
  }

  // 3. Insertar en Supabase solo las filas realmente nuevas en lotes de 50
  if (isSupabaseConfigured() && supabase && payloadFiltrado.length > 0) {
    const CHUNK_SIZE = 50;
    let procesadas = 0;

    for (let i = 0; i < payloadFiltrado.length; i += CHUNK_SIZE) {
      const chunk = payloadFiltrado.slice(i, i + CHUNK_SIZE);
      let { error } = await supabase.from('matriz_pedidos').insert(chunk);

      if (error && (error.message.includes('relation') || error.message.includes('does not exist'))) {
        const respCentral = await supabase.from('matriz_central').insert(chunk);
        if (respCentral.error) {
          console.error('Error insertando lote en matriz_central:', respCentral.error);
        }
      }

      procesadas += chunk.length;
      if (onProgress) {
        onProgress(Math.round((procesadas / payloadFiltrado.length) * 100));
      }
    }
  } else {
    if (onProgress) onProgress(100);
  }

  return {
    ok: true,
    totalInsertadas: payloadFiltrado.length,
    totalExistentesOmitidas,
    pedidosUnicos: pedidosSet.size,
  };
}

/**
 * Listas maestras de candidatos de columnas para tolerar cualquier variación de nombre en Supabase,
 * Google Sheets, importaciones CSV y sistemas ERP/SAP
 */
const CANDIDATOS_PEDIDO_ID = [
  'pedido_id', 'id_pedido', 'pedido', 'folio', 'no_pedido', 'numero_pedido',
  'nro_pedido', 'id', 'orden_id', 'no_de_pedido', 'documento_pedido'
];

const CANDIDATOS_CODIGO_REPUESTO = [
  'codigo_repuesto', 'codigo', 'cod_repuesto', 'part_number', 'partnumber',
  'part_no', 'partno', 'part_num', 'partnum', 'part', 'parte',
  'numero_de_parte', 'numerodeparte', 'numero_parte', 'numeroparte',
  'num_parte', 'numparte', 'no_parte', 'noparte', 'nro_parte', 'nroparte', 'n_parte',
  'codigo_de_parte', 'codigodeparte', 'codigo_parte', 'codigoparte', 'cod_parte', 'codparte',
  'codigo_de_repuesto', 'codigoderepuesto', 'repuesto_codigo', 'repuestocodigo',
  'cod_rep', 'item', 'item_code', 'itemcode', 'item_no', 'itemno',
  'articulo', 'codigo_articulo', 'cod_articulo', 'sku', 'sku_code',
  'referencia', 'ref', 'material', 'codigo_material', 'num_material',
  'oem', 'codigo_oem', 'pieza', 'codigo_pieza', 'repuesto_cod', 'c_digo',
  'no_de_repuesto', 'num_repuesto', 'codigo_producto', 'cod_producto'
];

const CANDIDATOS_DESCRIPCION = [
  'descripcion_oficial', 'descripcion', 'descrip', 'desc', 'descript',
  'repuesto', 'descripcion_repuesto', 'descripcion_de_repuesto', 'descripcion_del_repuesto',
  'desc_repuesto', 'nombre_repuesto', 'nombre_del_repuesto', 'nombre_de_repuesto',
  'nom_repuesto', 'nombre', 'detalle', 'detalles', 'detalle_repuesto',
  'articulo', 'nombre_articulo', 'producto', 'nombre_producto',
  'pieza', 'denominacion', 'denominacion_repuesto', 'texto_breve',
  'texto', 'material_descripcion', 'descripcion_material', 'concepto',
  'nombre_pieza', 'descripcion_articulo', 'descripcion_pieza'
];

const CANDIDATOS_CLIENTE = [
  'cliente', 'nombre_cliente', 'cliente_nombre', 'nombre_del_cliente',
  'razon_social', 'razonsocial', 'propietario', 'titular', 'comprador',
  'taller', 'consumidor', 'cliente_final', 'aseguradora', 'contacto',
  'solicitado_para', 'nombre_del_taller'
];

const CANDIDATOS_ASESOR = [
  'colaborador', 'asesor', 'vendedor', 'ejecutivo', 'creado_por',
  'usuario', 'solicitante', 'encargado', 'responsable', 'empleado',
  'personal', 'nombre_asesor', 'asesor_servicio', 'asesor_repuestos',
  'quien_pide', 'agente', 'creador'
];

const CANDIDATOS_OR = [
  'cotizacion_numero_or', 'numero_or', 'no_or', 'nro_or', 'or',
  'orden', 'no_orden', 'numero_orden', 'nro_orden', 'num_orden',
  'orden_de_reparacion', 'orden_reparacion', 'ordendereparacion',
  'no_cotizacion', 'cotizacion', 'no_cot', 'num_cotizacion',
  'ot', 'no_ot', 'numero_ot', 'num_ot', 'orden_trabajo', 'orden_de_trabajo',
  'sap', 'pedido_sap', 'no_sap', 'documento', 'no_documento', 'factura'
];

const CANDIDATOS_VIN = [
  'vin', 'chasis', 'numero_chasis', 'no_chasis', 'num_chasis',
  'vin_chasis', 'serie', 'numero_serie', 'no_serie'
];

const CANDIDATOS_SUCURSAL = [
  'sucursal', 'sucursal_destino', 'sucursalorigen', 'tienda', 'agencia',
  'ubicacion_sucursal', 'taller_origen', 'sucursal_origen'
];

const CANDIDATOS_MODELO = [
  'modelo_changan', 'modelo', 'vehiculo', 'auto', 'carro', 'unidad',
  'linea_vehiculo', 'modelo_auto', 'vehiculo_modelo'
];

const CANDIDATOS_CANTIDAD = [
  'cantidad_solicitada', 'cantidad', 'cant', 'cant_solicitada',
  'piezas', 'unidades', 'cant_pedida', 'pedida', 'solicitado', 'qty'
];

/**
 * Normaliza una cadena para comparaciones insensibles a mayúsculas, espacios, tildes y caracteres especiales
 */
function normStr(str: string): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Busca de forma ultra-inteligente el valor de un campo en un objeto de Supabase o CSV
 * Admite candidatos exactos, variaciones de formato, subobjetos JSON e inferencia heurística
 */
export function getField(
  obj: any,
  candidates: string[],
  heuristicType?: 'codigo' | 'descripcion' | 'cliente' | 'asesor' | 'or' | 'vin' | 'cantidad'
): any {
  if (!obj || typeof obj !== 'object') return undefined;

  const keys = Object.keys(obj);
  const normCandidates = candidates.map(normStr);

  // 1. Coincidencia normalizada directa
  for (const nc of normCandidates) {
    for (const key of keys) {
      if (normStr(key) === nc) {
        const val = obj[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return val;
        }
      }
    }
  }

  // 2. Búsqueda dentro de campos JSON anidados (ej: datos_completos, lineas, detalle, payload)
  const jsonContainers = ['datos_completos', 'datos', 'data', 'payload', 'detalle', 'detalles', 'extra', 'raw_data', 'lineas'];
  for (const containerKey of jsonContainers) {
    if (obj[containerKey]) {
      let subObj = obj[containerKey];
      if (typeof subObj === 'string') {
        try {
          subObj = JSON.parse(subObj);
        } catch {
          subObj = null;
        }
      }
      if (subObj && typeof subObj === 'object') {
        // Si es array (ej: lineas), tomar el primer elemento
        const targetObj = Array.isArray(subObj) ? subObj[0] : subObj;
        if (targetObj && typeof targetObj === 'object') {
          const subVal = getField(targetObj, candidates, heuristicType);
          if (subVal !== undefined && subVal !== null && String(subVal).trim() !== '') {
            return subVal;
          }
        }
      }
    }
  }

  // 3. Heurística contextual según el tipo de campo
  if (heuristicType === 'codigo') {
    for (const key of keys) {
      const nk = normStr(key);
      const esCandidatoCodigo =
        (nk.includes('part') || nk.includes('cod') || nk.includes('sku') || nk.includes('item') || nk.includes('oem') || nk.includes('pieza') || nk.includes('material')) &&
        !nk.includes('pedido') &&
        !nk.includes('cliente') &&
        !nk.includes('vin') &&
        !nk.includes('or') &&
        !nk.includes('sucursal') &&
        !nk.includes('rack') &&
        !nk.includes('pallet') &&
        !nk.includes('contenedor') &&
        !nk.includes('postal') &&
        !nk.includes('tel') &&
        !nk.includes('user') &&
        !nk.includes('asesor');

      if (esCandidatoCodigo) {
        const val = obj[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return val;
        }
      }
    }
  }

  if (heuristicType === 'descripcion') {
    for (const key of keys) {
      const nk = normStr(key);
      const esCandidatoDesc =
        (nk.includes('desc') || nk.includes('nom') || nk.includes('detall') || nk.includes('repuest') || nk.includes('articulo') || nk.includes('producto') || nk.includes('denominacion') || nk.includes('texto')) &&
        !nk.includes('cod') &&
        !nk.includes('part') &&
        !nk.includes('cliente') &&
        !nk.includes('asesor') &&
        !nk.includes('colaborador') &&
        !nk.includes('user') &&
        !nk.includes('pedido') &&
        !nk.includes('sucursal');

      if (esCandidatoDesc) {
        const val = obj[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return val;
        }
      }
    }
  }

  if (heuristicType === 'cliente') {
    for (const key of keys) {
      const nk = normStr(key);
      if ((nk.includes('client') || nk.includes('razon') || nk.includes('titular') || nk.includes('propietario')) && !nk.includes('asesor') && !nk.includes('pedido')) {
        const val = obj[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
      }
    }
  }

  if (heuristicType === 'asesor') {
    for (const key of keys) {
      const nk = normStr(key);
      if ((nk.includes('asesor') || nk.includes('colaborad') || nk.includes('vendedor') || nk.includes('solicitante')) && !nk.includes('cliente') && !nk.includes('pedido')) {
        const val = obj[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
      }
    }
  }

  if (heuristicType === 'or') {
    for (const key of keys) {
      const nk = normStr(key);
      if ((nk.includes('orden') || nk.includes('cotiza') || nk.includes('ot') || nk === 'or' || nk.includes('sap')) && !nk.includes('asesor') && !nk.includes('cliente')) {
        const val = obj[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
      }
    }
  }

  return undefined;
}

/**
 * Obtiene todas las filas de matriz_pedidos para el Panel de Administrador y Rastreador
 * con tolerancia multi-tabla (matriz_pedidos, matriz_central, lineas_pedido, pedidos)
 * y cruce automático de datos para garantizar que códigos y nombres de repuestos NUNCA salgan vacíos.
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
    // 1. Consultar tablas disponibles en paralelo con paginación robusta para matriz_pedidos
    const [respLineas, respPedidos] = await Promise.allSettled([
      supabase.from('lineas_pedido').select('*'),
      supabase.from('pedidos').select('*'),
    ]);

    // Paginación exhaustiva para matriz_pedidos (supera el límite por defecto de 1,000 filas de PostgREST)
    let dataMatriz: any[] = [];
    const PAGE_SIZE = 1000;
    let page = 0;
    while (true) {
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('matriz_pedidos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error || !data || data.length === 0) {
        if (page === 0 && error) {
          // Reintentar sin order si created_at no existe
          const respSinOrder = await supabase.from('matriz_pedidos').select('*').limit(4000);
          if (respSinOrder.data) dataMatriz = respSinOrder.data;
        }
        break;
      }
      dataMatriz.push(...data);
      if (data.length < PAGE_SIZE) break;
      page++;
      if (page >= 10) break; // Límite de seguridad (hasta 10,000 filas)
    }

    // Fallback a matriz_central si matriz_pedidos falló o está vacía
    if (dataMatriz.length === 0) {
      const respCentral = await supabase.from('matriz_central').select('*');
      if (!respCentral.error && respCentral.data && respCentral.data.length > 0) {
        dataMatriz = respCentral.data;
      }
    }

    let dataLineas: any[] = [];
    if (respLineas.status === 'fulfilled' && !respLineas.value.error && respLineas.value.data) {
      dataLineas = respLineas.value.data;
    }

    let dataPedidos: any[] = [];
    if (respPedidos.status === 'fulfilled' && !respPedidos.value.error && respPedidos.value.data) {
      dataPedidos = respPedidos.value.data;
    }

    // Telemetría de diagnóstico en consola para auditoría inmediata
    if (dataMatriz.length > 0) {
      console.log('🔍 [CEDIS DB DIAGNÓSTICO] Filas crudas en matriz_pedidos:', dataMatriz.length);
      console.log('🔍 [CEDIS DB DIAGNÓSTICO] Columnas exactas encontradas:', Object.keys(dataMatriz[0] || {}));
      console.log('🔍 [CEDIS DB DIAGNÓSTICO] Muestra cruda de fila 1:', dataMatriz[0]);
    }
    if (dataLineas.length > 0) {
      console.log('🔍 [CEDIS DB DIAGNÓSTICO] Filas en lineas_pedido:', dataLineas.length);
    }
    if (dataPedidos.length > 0) {
      console.log('🔍 [CEDIS DB DIAGNÓSTICO] Filas en pedidos:', dataPedidos.length);
    }

    // Mapa de líneas de repuestos por folio / pedidoId para hidratación cruzada
    const mapLineasPorFolio = new Map<string, any[]>();
    dataLineas.forEach(l => {
      const key = String(getField(l, CANDIDATOS_PEDIDO_ID) || l.folio || l.pedido_id || l.pedidoId || '').trim().toUpperCase();
      if (key) {
        if (!mapLineasPorFolio.has(key)) mapLineasPorFolio.set(key, []);
        mapLineasPorFolio.get(key)!.push(l);
      }
    });

    // Mapa de pedidos (cabecera) por folio / id para hidratación de cliente, asesor y OR
    const mapPedidosPorFolio = new Map<string, any>();
    dataPedidos.forEach(p => {
      const key = String(getField(p, CANDIDATOS_PEDIDO_ID) || p.folio || p.id || '').trim().toUpperCase();
      if (key) {
        mapPedidosPorFolio.set(key, p);
      }
    });

    let filasSupabase: FilaRastreador[] = [];

    // CASO A: Hay datos en matriz_pedidos (o matriz_central)
    if (dataMatriz.length > 0) {
      // Filtrar filas fantasma / vacías (importaciones corruptas o filas vacías que sólo tienen pedido_id)
      const dataMatrizFiltrada = dataMatriz.filter((item: any) => {
        const pedidoId = String(getField(item, CANDIDATOS_PEDIDO_ID) || '').trim().toUpperCase();
        const cod = String(getField(item, CANDIDATOS_CODIGO_REPUESTO, 'codigo') || '').trim();
        const desc = String(getField(item, CANDIDATOS_DESCRIPCION, 'descripcion') || '').trim();
        const cli = String(getField(item, CANDIDATOS_CLIENTE, 'cliente') || '').trim();
        const col = String(getField(item, CANDIDATOS_ASESOR, 'asesor') || '').trim();
        const vin = String(getField(item, CANDIDATOS_VIN, 'vin') || '').trim();
        const or = String(getField(item, CANDIDATOS_OR, 'or') || '').trim();

        // Si faltan datos en la matriz pero lineas_pedido o pedidos tienen datos, rescatar la fila
        if (pedidoId && (mapLineasPorFolio.has(pedidoId) || mapPedidosPorFolio.has(pedidoId))) {
          return true;
        }

        // Si la fila carece totalmente de código, descripción, cliente, asesor, VIN y OR, es un registro fantasma
        const esFantasma = !cod && !desc && (!cli || cli.toLowerCase() === 'consumidor final') && (!col || col.toLowerCase() === 'asesor') && !vin && !or;
        return !esFantasma;
      });

      console.log('🔍 [CEDIS DB DIAGNÓSTICO] Filas operativas tras depuración de fantasmas:', dataMatrizFiltrada.length);

      filasSupabase = dataMatrizFiltrada.map((item: any, idx: number) => {
        const rawEstatus = String(
          getField(item, ['estatus_linea', 'estatus', 'estado', 'estado_despacho', 'estado_pedido']) || 'Pendiente'
        ).trim();
        const cantSolicitada = Number(getField(item, CANDIDATOS_CANTIDAD, 'cantidad')) || 1;
        const cantDespachada = Number(getField(item, ['cantidad_despachada', 'despachada', 'cant_despachada', 'piezas_despachadas'])) || 0;
        const cantAsignada = Number(getField(item, ['cantidad_asignada', 'asignada', 'cant_asignada'])) || 0;
        const tieneGuia = !!getField(item, ['guia', 'guia_despacho', 'numero_guia', 'acta', 'acta_retiro', 'conduce']);
        const tieneFechaDespacho = !!getField(item, ['fecha_despacho', 'fecha_retiro', 'fecha_entrega']);

        const esDespachado =
          rawEstatus.toUpperCase().includes('DESPACH') ||
          rawEstatus.toUpperCase().includes('ENTREG') ||
          rawEstatus.toUpperCase().includes('RETIR') ||
          (cantDespachada > 0 && cantSolicitada > 0 && cantDespachada >= cantSolicitada) ||
          (cantDespachada > 0 && tieneGuia) ||
          (tieneFechaDespacho && tieneGuia);

        const pedidoId = String(getField(item, CANDIDATOS_PEDIDO_ID) || '').trim();
        let codigoRepuesto = String(getField(item, CANDIDATOS_CODIGO_REPUESTO, 'codigo') || '').trim();
        let descripcionOficial = String(getField(item, CANDIDATOS_DESCRIPCION, 'descripcion') || '').trim();

        let colaborador = String(getField(item, CANDIDATOS_ASESOR, 'asesor') || '').trim();
        let cliente = String(getField(item, CANDIDATOS_CLIENTE, 'cliente') || '').trim();
        let numeroOR = String(getField(item, CANDIDATOS_OR, 'or') || '').trim();
        let vin = String(getField(item, CANDIDATOS_VIN, 'vin') || '').trim();
        let sucursal = String(getField(item, CANDIDATOS_SUCURSAL) || '').trim();
        let modeloChangan = String(getField(item, CANDIDATOS_MODELO) || '').trim();

        // HIDRATACIÓN CRUZADA 1: Si faltan datos del repuesto en la matriz, buscar en lineas_pedido
        const keyUpper = pedidoId.toUpperCase();
        if ((!codigoRepuesto || !descripcionOficial) && mapLineasPorFolio.has(keyUpper)) {
          const lineasMatch = mapLineasPorFolio.get(keyUpper)!;
          if (lineasMatch.length > 0) {
            const l = lineasMatch[0];
            if (!codigoRepuesto) codigoRepuesto = String(getField(l, CANDIDATOS_CODIGO_REPUESTO, 'codigo') || l.codigo_repuesto || '').trim();
            if (!descripcionOficial) descripcionOficial = String(getField(l, CANDIDATOS_DESCRIPCION, 'descripcion') || l.descripcion || '').trim();
          }
        }

        // HIDRATACIÓN CRUZADA 2: Si faltan asesor, cliente u OR, buscar en pedidos (cabecera)
        if (mapPedidosPorFolio.has(keyUpper)) {
          const p = mapPedidosPorFolio.get(keyUpper)!;
          if (!colaborador || colaborador === 'Asesor') colaborador = String(getField(p, CANDIDATOS_ASESOR, 'asesor') || p.colaborador || colaborador).trim();
          if (!cliente || cliente === 'Consumidor Final') cliente = String(getField(p, CANDIDATOS_CLIENTE, 'cliente') || p.cliente || cliente).trim();
          if (!numeroOR) numeroOR = String(getField(p, CANDIDATOS_OR, 'or') || p.no_cotizacion || '').trim();
          if (!vin) vin = String(getField(p, CANDIDATOS_VIN, 'vin') || p.vin || '').trim();
          if (!sucursal) sucursal = String(getField(p, CANDIDATOS_SUCURSAL) || p.sucursal || sucursal).trim();
          if (!modeloChangan) modeloChangan = String(getField(p, CANDIDATOS_MODELO) || p.modelo_changan || modeloChangan).trim();
        }

        // INFERENCIA INTELIGENTE: Si no hay código pero la descripción contiene un formato OEM Changan
        if (!codigoRepuesto && descripcionOficial) {
          const matchOEM = descripcionOficial.match(/([A-Z0-9]{5,10}[-_][A-Z0-9]{3,6})/i);
          if (matchOEM) {
            codigoRepuesto = matchOEM[1].toUpperCase();
          }
        }

        // Mapeo inteligente de contenedor y estatus si viene en estatus_linea (ej: 2604M00000SL0066)
        let contenedorAsignado = String(getField(item, ['contenedor_asignado', 'contenedor', 'contenedor_id']) || '').trim();
        let palletAsignado = String(getField(item, ['pallet_asignado', 'pallet', 'pallet_case_no']) || '').trim();
        let estatusCalculado = rawEstatus;

        if (!contenedorAsignado && /^26\d{2}[A-Z0-9]/i.test(rawEstatus)) {
          contenedorAsignado = rawEstatus;
          estatusCalculado = 'Asignado';
        }

        const estatusFinal = esDespachado ? 'Despachado' : (estatusCalculado || 'Pendiente');

        return {
          lineaId: String(getField(item, ['linea_id', 'id', 'lineaId']) || `LIN-${pedidoId}-${idx}`),
          pedidoId: pedidoId,
          codigoRepuesto: codigoRepuesto,
          descripcionOficial: descripcionOficial,
          cantidadSolicitada: cantSolicitada,
          cantidadAsignada: esDespachado ? (cantAsignada || cantSolicitada) : (cantAsignada || (contenedorAsignado ? cantSolicitada : 0)),
          cantidadDespachada: esDespachado ? (cantDespachada || cantSolicitada) : cantDespachada,
          estatusLinea: estatusFinal,
          contenedorAsignado: contenedorAsignado,
          palletAsignado: palletAsignado,
          packageNo: String(getField(item, ['package_no', 'paquete', 'package']) || ''),
          ubicacionCedis: String(getField(item, ['ubicacion_cedis', 'ubicacion']) || ''),
          sucursal: sucursal || 'Villa Lucre',
          colaborador: colaborador || 'Asesor',
          cliente: cliente || 'Consumidor Final',
          modeloChangan: modeloChangan || 'Changan',
          numeroOR: numeroOR,
          vin: vin,
        };
      });
    }

    // CASO B: Si matriz_pedidos estuviera vacía pero existen lineas_pedido y pedidos
    if (filasSupabase.length === 0 && dataLineas.length > 0) {
      filasSupabase = dataLineas.map((item: any, idx: number) => {
        const pedidoId = String(getField(item, CANDIDATOS_PEDIDO_ID) || item.folio || '').trim();
        const p = mapPedidosPorFolio.get(pedidoId.toUpperCase()) || {};

        const rawEstatus = String(getField(item, ['estatus_linea', 'estatus', 'estado']) || 'Pendiente').trim();
        const cantSol = Number(getField(item, CANDIDATOS_CANTIDAD, 'cantidad')) || 1;
        const cantDesp = Number(getField(item, ['cantidad_despachada', 'despachada'])) || 0;
        const cantAsig = Number(getField(item, ['cantidad_asignada', 'asignada'])) || 0;

        const esDesp =
          rawEstatus.toUpperCase().includes('DESPACH') ||
          rawEstatus.toUpperCase().includes('ENTREG') ||
          rawEstatus.toUpperCase().includes('RETIR') ||
          (cantDesp > 0 && cantSol > 0 && cantDesp >= cantSol);

        return {
          lineaId: String(item.id || `LIN-${pedidoId}-${idx}`),
          pedidoId: pedidoId,
          codigoRepuesto: String(getField(item, CANDIDATOS_CODIGO_REPUESTO, 'codigo') || item.codigo_repuesto || '').trim(),
          descripcionOficial: String(getField(item, CANDIDATOS_DESCRIPCION, 'descripcion') || item.descripcion || '').trim(),
          cantidadSolicitada: cantSol,
          cantidadAsignada: esDesp ? (cantAsig || cantSol) : cantAsig,
          cantidadDespachada: esDesp ? (cantDesp || cantSol) : cantDesp,
          estatusLinea: esDesp ? 'Despachado' : rawEstatus,
          contenedorAsignado: String(item.contenedor_asignado || ''),
          palletAsignado: String(item.pallet_asignado || ''),
          packageNo: String(item.package_no || ''),
          ubicacionCedis: String(item.ubicacion_cedis || ''),
          sucursal: String(getField(p, CANDIDATOS_SUCURSAL) || p.sucursal || 'Villa Lucre'),
          colaborador: String(getField(p, CANDIDATOS_ASESOR, 'asesor') || p.colaborador || 'Asesor'),
          cliente: String(getField(p, CANDIDATOS_CLIENTE, 'cliente') || p.cliente || 'Consumidor Final'),
          modeloChangan: String(getField(p, CANDIDATOS_MODELO) || p.modelo_changan || 'Changan'),
          numeroOR: String(getField(p, CANDIDATOS_OR, 'or') || p.no_cotizacion || ''),
          vin: String(getField(p, CANDIDATOS_VIN, 'vin') || p.vin || ''),
        };
      });
    }

    // Fusión inteligente: deduplicar y consolidar la información más completa para cada repuesto
    const mapaUnicos = new Map<string, FilaRastreador>();
    const mapaClientes = new Map<string, FilaRastreador>();

    filasSupabase.forEach(f => {
      // Clave primaria: Pedido + Código de Repuesto (o lineaId si no hay código)
      const key = `${f.pedidoId}___${f.codigoRepuesto || f.lineaId}`.toUpperCase();

      // Clave secundaria: Cliente + Cotización/OT + Código de Repuesto (protección contra duplicación multi-origen)
      const clienteNorm = (f.cliente || '').trim().toUpperCase().replace(/\s+/g, ' ');
      const cotizNorm = (f.numeroOR || '').trim().toUpperCase();
      const codNorm = (f.codigoRepuesto || '').trim().toUpperCase();
      const clientKey = (clienteNorm && clienteNorm !== 'CONSUMIDOR FINAL' && codNorm)
        ? `${clienteNorm}___${cotizNorm}___${codNorm}`
        : '';

      const exist = mapaUnicos.get(key) || (clientKey ? mapaClientes.get(clientKey) : undefined);

      if (!exist) {
        mapaUnicos.set(key, f);
        if (clientKey) mapaClientes.set(clientKey, f);
      } else {
        // Enriquecer registro existente con los datos más detallados
        if ((!exist.cliente || exist.cliente === 'Consumidor Final') && f.cliente && f.cliente !== 'Consumidor Final') {
          exist.cliente = f.cliente;
        }
        if ((!exist.colaborador || exist.colaborador === 'Asesor') && f.colaborador && f.colaborador !== 'Asesor') {
          exist.colaborador = f.colaborador;
        }
        if (!exist.vin && f.vin) exist.vin = f.vin;
        if (!exist.numeroOR && f.numeroOR) exist.numeroOR = f.numeroOR;
        if (!exist.contenedorAsignado && f.contenedorAsignado) exist.contenedorAsignado = f.contenedorAsignado;
        if (!exist.palletAsignado && f.palletAsignado) exist.palletAsignado = f.palletAsignado;
        if (!exist.codigoRepuesto && f.codigoRepuesto) exist.codigoRepuesto = f.codigoRepuesto;
        if ((!exist.descripcionOficial || exist.descripcionOficial.length < (f.descripcionOficial || '').length) && f.descripcionOficial) {
          exist.descripcionOficial = f.descripcionOficial;
        }
        if (exist.estatusLinea === 'Pendiente' && f.estatusLinea !== 'Pendiente') {
          exist.estatusLinea = f.estatusLinea;
        }
        if (f.cantidadAsignada > exist.cantidadAsignada) {
          exist.cantidadAsignada = f.cantidadAsignada;
        }
        if (f.cantidadDespachada > exist.cantidadDespachada) {
          exist.cantidadDespachada = f.cantidadDespachada;
        }
      }
    });

    // Supabase es la fuente de verdad definitiva en vivo.
    // Solo se rescatan pedidos locales si fueron creados hace menos de 45 segundos (en tránsito),
    // garantizando que si un pedido se elimina en Supabase, se borre de inmediato en el Admin y nunca reviva.
    const AHORA = Date.now();
    filasLocales.forEach(f => {
      const key = `${f.pedidoId}___${f.codigoRepuesto || f.lineaId}`.toUpperCase();
      const matchTimestamp = f.lineaId.match(/^LIN-(\d{10,13})/);
      const creadoHaceMs = matchTimestamp ? AHORA - Number(matchTimestamp[1]) : 99999999;
      const esEnTransito = creadoHaceMs < 45000;

      if (!mapaUnicos.has(key) && esEnTransito) {
        mapaUnicos.set(key, f);
      }
    });

    const resultadoFinal = Array.from(mapaUnicos.values());
    console.log(`✅ [CEDIS DB] Sincronización exitosa: ${resultadoFinal.length} pedidos operativos con códigos listos.`);
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
 * Guarda o actualiza un manifiesto DPL y sus detalles en Supabase y memoria local
 */
export async function guardarDPLCompletoSupabase(
  manifiesto: DPLManifiesto,
  detalles: DPLDetalle[]
): Promise<{ ok: boolean; error?: string }> {
  // 1. Guardar en almacenamiento local siempre (garantía de disponibilidad inmediata)
  try {
    const rawConts = localStorage.getItem('cedis_contenedores_dpl');
    const contenedores: any[] = rawConts ? JSON.parse(rawConts) : [];
    const indexCont = contenedores.findIndex((c: any) => c.contenedor === manifiesto.contenedorId);
    const contModel = {
      contenedor: manifiesto.contenedorId,
      proveedor: manifiesto.proveedor,
      fechaArribo: manifiesto.fechaArribo,
      poReferencia: manifiesto.poReferencia,
      tipoTransporte: manifiesto.tipoTransporte,
      totalPiezas: manifiesto.totalPiezas,
      skusUnicos: manifiesto.skusUnicos,
      totalPallets: manifiesto.totalPallets,
      estado: manifiesto.estado,
      creadoPor: manifiesto.creadoPor,
      creadoEn: manifiesto.creadoEn || new Date().toISOString(),
      blReferencia: manifiesto.blReferencia,
    };
    if (indexCont >= 0) {
      contenedores[indexCont] = contModel;
    } else {
      contenedores.unshift(contModel);
    }
    localStorage.setItem('cedis_contenedores_dpl', JSON.stringify(contenedores));

    // Detalles locales
    const rawDets = localStorage.getItem('cedis_detalles_dpl');
    const existDetalles: any[] = rawDets ? JSON.parse(rawDets) : [];
    const detallesFiltrados = existDetalles.filter((d: any) => d.contenedor !== manifiesto.contenedorId);
    const nuevosModel = detalles.map(d => ({
      uid: d.inventarioId,
      contenedor: d.contenedorId,
      pallet: d.palletCaseNo || 'P001',
      packageNo: d.packageNo || '',
      codigoCompra: d.codigoRepuesto,
      descripcion: d.descripcion,
      cantidadTotal: d.cantidadTotal,
      cantidadAsignada: d.cantidadAsignada || 0,
      saldoDisponible: d.saldoDisponible ?? d.cantidadTotal,
      ubicacionCedis: d.ubicacionCedis || '',
    }));
    localStorage.setItem('cedis_detalles_dpl', JSON.stringify([...detallesFiltrados, ...nuevosModel]));
  } catch (errLocal) {
    console.warn('Error guardando DPL en local storage:', errLocal);
  }

  // 2. Guardar en Supabase si está disponible
  if (!supabase || !isSupabaseConfigured()) {
    return { ok: true };
  }

  try {
    // Upsert en dpl_manifiestos
    const payloadManifiesto = {
      contenedor_id: manifiesto.contenedorId,
      proveedor: manifiesto.proveedor,
      fecha_arribo: manifiesto.fechaArribo,
      po_referencia: manifiesto.poReferencia,
      tipo_transporte: manifiesto.tipoTransporte,
      total_piezas: manifiesto.totalPiezas,
      skus_unicos: manifiesto.skusUnicos,
      total_pallets: manifiesto.totalPallets,
      estado: manifiesto.estado,
      creado_por: manifiesto.creadoPor,
      bl_referencia: manifiesto.blReferencia,
    };

    let { error: errMan } = await supabase
      .from('dpl_manifiestos')
      .upsert(payloadManifiesto, { onConflict: 'contenedor_id' });

    if (errMan) {
      await supabase.from('dpl_manifiesto').upsert(payloadManifiesto, { onConflict: 'contenedor_id' });
    }

    // Insertar líneas en dpl_detalle
    if (detalles.length > 0) {
      const payloadDetalles = detalles.map(d => ({
        inventario_id: d.inventarioId,
        contenedor_id: d.contenedorId,
        pallet_case_no: d.palletCaseNo || 'P001',
        package_no: d.packageNo || '',
        codigo_repuesto: d.codigoRepuesto,
        descripcion: d.descripcion,
        cantidad_total: d.cantidadTotal,
        cantidad_asignada: d.cantidadAsignada || 0,
        saldo_disponible: d.saldoDisponible,
        ubicacion_cedis: d.ubicacionCedis || '',
      }));

      // Intentar borrado previo de líneas de este contenedor para evitar duplicados
      await supabase.from('dpl_detalle').delete().eq('contenedor_id', manifiesto.contenedorId);
      const { error: errDet } = await supabase.from('dpl_detalle').insert(payloadDetalles);
      if (errDet) {
        await supabase.from('dpl_detalles').insert(payloadDetalles);
      }
    }

    return { ok: true };
  } catch (errSupabase: any) {
    console.error('Error al guardar DPL en Supabase:', errSupabase);
    return { ok: true }; // Fallback exitoso con almacenamiento local
  }
}

/**
 * Actualiza el estatus del contenedor/manifiesto DPL en Supabase y LocalStorage
 */
export async function actualizarEstadoManifiestoSupabase(
  contenedorId: string,
  nuevoEstado: EstatusDPL
): Promise<{ ok: boolean }> {
  const contId = (contenedorId || '').trim().toUpperCase();
  if (!contId) return { ok: false };

  try {
    // 1. Almacenamiento local (Contenedores DPL)
    const rawConts = localStorage.getItem('cedis_contenedores_dpl');
    if (rawConts) {
      const parsed = JSON.parse(rawConts);
      const updated = parsed.map((c: any) =>
        (c.contenedor || '').toUpperCase() === contId ? { ...c, estado: nuevoEstado } : c
      );
      localStorage.setItem('cedis_contenedores_dpl', JSON.stringify(updated));
    }

    // 2. Supabase
    if (isSupabaseConfigured() && supabase) {
      const { error: err1 } = await supabase
        .from('dpl_manifiestos')
        .update({ estado: nuevoEstado })
        .ilike('contenedor_id', contId);

      if (err1) {
        await supabase
          .from('dpl_manifiesto')
          .update({ estado: nuevoEstado })
          .ilike('contenedor_id', contId);
      }
    }
    return { ok: true };
  } catch (err) {
    console.error('Error al actualizar estado de manifiesto en Supabase:', err);
    return { ok: false };
  }
}


/**
 * Aplica en lote los resultados del Matching FIFO o Pre-Asignación en Tránsito a los pedidos
 */
export async function aplicarMatchingFIFOSupabase(
  asignaciones: Array<{
    lineaId: string;
    pedidoId: string;
    codigoRepuesto: string;
    contenedorAsignado: string;
    palletAsignado: string;
    packageNo?: string;
    ubicacionCedis?: string;
    cantidadAsignada: number;
    nuevoEstatus: 'Asignado' | 'Asignado Parcial' | 'En Tránsito Asignado' | string;
  }>
): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!asignaciones || asignaciones.length === 0) {
    return { ok: true, count: 0 };
  }

  // 1. Actualizar memoria local de inmediato
  try {
    const rawLocal = localStorage.getItem('cedis_pedidos_locales');
    if (rawLocal) {
      const locales: FilaRastreador[] = JSON.parse(rawLocal);
      const actualizados = locales.map(item => {
        const match = asignaciones.find(
          a => a.lineaId === item.lineaId || (a.pedidoId === item.pedidoId && a.codigoRepuesto === item.codigoRepuesto)
        );
        if (match) {
          return {
            ...item,
            contenedorAsignado: match.contenedorAsignado,
            palletAsignado: match.palletAsignado,
            packageNo: match.packageNo || item.packageNo || '',
            ubicacionCedis: match.ubicacionCedis || item.ubicacionCedis || '',
            cantidadAsignada: match.cantidadAsignada,
            estatusLinea: match.nuevoEstatus,
          };
        }
        return item;
      });
      localStorage.setItem('cedis_pedidos_locales', JSON.stringify(actualizados));
    }
  } catch (errLocal) {
    console.warn('Error actualizando matching en local storage:', errLocal);
  }

  // 2. Actualizar en Supabase si está disponible
  if (!supabase || !isSupabaseConfigured()) {
    return { ok: true, count: asignaciones.length };
  }

  try {
    for (const a of asignaciones) {
      const updateData: Record<string, any> = {
        contenedor_asignado: a.contenedorAsignado,
        pallet_asignado: a.palletAsignado,
        ubicacion_cedis: a.ubicacionCedis || '',
        cantidad_asignada: a.cantidadAsignada,
        estatus_linea: a.nuevoEstatus,
      };

      if (a.packageNo) {
        updateData.package_no = a.packageNo;
      }

      // Actualizar en matriz_pedidos
      await supabase
        .from('matriz_pedidos')
        .update(updateData)
        .or(`id.eq.${a.lineaId},linea_id.eq.${a.lineaId},pedido_id.eq.${a.pedidoId}`);

      // Actualizar en lineas_pedido
      await supabase
        .from('lineas_pedido')
        .update(updateData)
        .eq('id', a.lineaId);
    }

    return { ok: true, count: asignaciones.length };
  } catch (errSupabase: any) {
    console.error('Error aplicando matching en Supabase:', errSupabase);
    return { ok: true, count: asignaciones.length };
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

export interface DatosEdicionPedido {
  cliente: string;
  sucursal: string;
  colaborador: string;
  numeroOR: string;
  modeloChangan: string;
  vin: string;
  codigoRepuesto: string;
  descripcionOficial: string;
  cantidadSolicitada: number;
  estatusLinea: string;
  contenedorAsignado?: string;
  palletAsignado?: string;
  ubicacionCedis?: string;
}

/**
 * Actualiza la información completa de un pedido/repuesto tanto en Supabase como en la memoria local
 */
export async function actualizarFilaAdminSupabase(
  filaOriginal: FilaRastreador,
  cambios: DatosEdicionPedido
): Promise<{ ok: boolean; error?: string }> {
  const updatePayload: Record<string, any> = {
    cliente: cambios.cliente,
    sucursal: cambios.sucursal,
    colaborador: cambios.colaborador,
    cotizacion_numero_or: cambios.numeroOR,
    modelo_changan: cambios.modeloChangan,
    vin: cambios.vin,
    codigo_repuesto: cambios.codigoRepuesto,
    descripcion_oficial: cambios.descripcionOficial,
    cantidad_solicitada: cambios.cantidadSolicitada,
    estatus_linea: cambios.estatusLinea,
  };

  if (cambios.contenedorAsignado !== undefined) {
    updatePayload.contenedor_asignado = cambios.contenedorAsignado;
  }
  if (cambios.palletAsignado !== undefined) {
    updatePayload.pallet_asignado = cambios.palletAsignado;
  }
  if (cambios.ubicacionCedis !== undefined) {
    updatePayload.ubicacion_cedis = cambios.ubicacionCedis;
  }

  // 1. Actualizar en Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filaOriginal.lineaId);

      let exito = false;
      if (esUUID) {
        const { error, count } = await supabase
          .from('matriz_pedidos')
          .update(updatePayload)
          .eq('id', filaOriginal.lineaId);

        if (!error && (count === null || count > 0)) {
          exito = true;
        }
      }

      // Si no fue UUID o no encontró por id, actualizar por pedido_id + codigo_repuesto
      if (!exito) {
        await supabase
          .from('matriz_pedidos')
          .update(updatePayload)
          .eq('pedido_id', filaOriginal.pedidoId)
          .eq('codigo_repuesto', filaOriginal.codigoRepuesto);
      }

      // Fallback a matriz_central
      await supabase
        .from('matriz_central')
        .update(updatePayload)
        .eq('pedido_id', filaOriginal.pedidoId)
        .eq('codigo_repuesto', filaOriginal.codigoRepuesto);

    } catch (err: any) {
      console.error('Error al actualizar fila en Supabase:', err);
      return { ok: false, error: err.message };
    }
  }

  // 2. Actualizar caché local
  try {
    const rawLocal = localStorage.getItem('cedis_pedidos_locales');
    if (rawLocal) {
      const locales: FilaRastreador[] = JSON.parse(rawLocal);
      const actualizados = locales.map(item => {
        if (item.lineaId === filaOriginal.lineaId || (item.pedidoId === filaOriginal.pedidoId && item.codigoRepuesto === filaOriginal.codigoRepuesto)) {
          return {
            ...item,
            ...cambios,
          };
        }
        return item;
      });
      localStorage.setItem('cedis_pedidos_locales', JSON.stringify(actualizados));
    }
  } catch (e) {
    console.warn('Error actualizando caché local:', e);
  }

  try {
    const rawAdmin = localStorage.getItem('cedis_filas_admin');
    if (rawAdmin) {
      const adminRows: FilaRastreador[] = JSON.parse(rawAdmin);
      const actualizados = adminRows.map(item => {
        if (item.lineaId === filaOriginal.lineaId || (item.pedidoId === filaOriginal.pedidoId && item.codigoRepuesto === filaOriginal.codigoRepuesto)) {
          return {
            ...item,
            ...cambios,
          };
        }
        return item;
      });
      localStorage.setItem('cedis_filas_admin', JSON.stringify(actualizados));
    }
  } catch {}

  return { ok: true };
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
 * Escanea la base de datos Supabase en busca de registros duplicados o triplicados
 * (mismo pedido_id y codigo_repuesto, o mismo cliente + cotizacion + codigo_repuesto).
 * Conserva la fila canónica (la más completa, con asignaciones de contenedor o estatus no pendiente)
 * y elimina de manera segura las filas redundantes en Supabase.
 */
export async function depurarDuplicadosSupabase(): Promise<{
  ok: boolean;
  eliminadosCount: number;
  gruposDuplicadosCount: number;
  error?: string;
}> {
  if (!supabase || !isSupabaseConfigured()) {
    // Si no hay Supabase, limpiar duplicados en localStorage
    try {
      const rawLocal = localStorage.getItem('cedis_pedidos_locales');
      if (rawLocal) {
        const locales: FilaRastreador[] = JSON.parse(rawLocal);
        const mapa = new Map<string, FilaRastreador>();
        locales.forEach(f => {
          const k = `${f.pedidoId}___${f.codigoRepuesto}`.toUpperCase();
          if (!mapa.has(k)) mapa.set(k, f);
        });
        localStorage.setItem('cedis_pedidos_locales', JSON.stringify(Array.from(mapa.values())));
      }
    } catch {}
    return { ok: true, eliminadosCount: 0, gruposDuplicadosCount: 0 };
  }

  try {
    // 1. Obtener todas las filas de matriz_pedidos
    let todasLasFilas: any[] = [];
    const PAGE_SIZE = 1000;
    let page = 0;

    while (true) {
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('matriz_pedidos')
        .select('*')
        .range(start, end);

      if (error || !data || data.length === 0) break;
      todasLasFilas.push(...data);
      if (data.length < PAGE_SIZE) break;
      page++;
      if (page >= 10) break;
    }

    if (todasLasFilas.length === 0) {
      return { ok: true, eliminadosCount: 0, gruposDuplicadosCount: 0 };
    }

    // 2. Agrupar filas duplicadas por Pedido + Código de Repuesto
    const grupos = new Map<string, any[]>();
    todasLasFilas.forEach(f => {
      const pid = String(f.pedido_id || '').trim().toUpperCase();
      const cod = String(f.codigo_repuesto || '').trim().toUpperCase();
      const keyPrincipal = `${pid}___${cod}`;
      if (!grupos.has(keyPrincipal)) {
        grupos.set(keyPrincipal, []);
      }
      grupos.get(keyPrincipal)!.push(f);
    });

    const idsAEliminar: string[] = [];
    let gruposDuplicadosCount = 0;

    grupos.forEach(filasGrupo => {
      if (filasGrupo.length > 1) {
        gruposDuplicadosCount++;

        // Ordenar: filas con asignaciones de contenedor/pallet o estatus más avanzado tienen prioridad
        filasGrupo.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          if (a.contenedor_asignado) scoreA += 10;
          if (b.contenedor_asignado) scoreB += 10;

          if (a.pallet_asignado) scoreA += 10;
          if (b.pallet_asignado) scoreB += 10;

          if (a.estatus_linea && a.estatus_linea !== 'Pendiente') scoreA += 5;
          if (b.estatus_linea && b.estatus_linea !== 'Pendiente') scoreB += 5;

          if (Number(a.cantidad_despachada) > 0) scoreA += 5;
          if (Number(b.cantidad_despachada) > 0) scoreB += 5;

          if (a.descripcion_oficial && a.descripcion_oficial.length > 5) scoreA += 2;
          if (b.descripcion_oficial && b.descripcion_oficial.length > 5) scoreB += 2;

          return scoreB - scoreA;
        });

        // La primera fila (índice 0) es la canónica preservada.
        // Las restantes (índice 1 en adelante) son copias redundantes a eliminar.
        for (let i = 1; i < filasGrupo.length; i++) {
          if (filasGrupo[i].id) {
            idsAEliminar.push(filasGrupo[i].id);
          }
        }
      }
    });

    // 3. Eliminar de Supabase en lotes seguros de 50 IDs
    if (idsAEliminar.length > 0) {
      console.log(`🛡️ [CEDIS ANTI-DUPLICADOS] Purgando ${idsAEliminar.length} registros duplicados de Supabase...`);
      for (let i = 0; i < idsAEliminar.length; i += 50) {
        const lote = idsAEliminar.slice(i, i + 50);
        await supabase.from('matriz_pedidos').delete().in('id', lote);
      }
    }

    // 4. Limpiar caché local
    try {
      localStorage.removeItem('cedis_filas_admin');
    } catch {}

    return {
      ok: true,
      eliminadosCount: idsAEliminar.length,
      gruposDuplicadosCount,
    };
  } catch (err: any) {
    console.error('Error en depurarDuplicadosSupabase:', err);
    return {
      ok: false,
      eliminadosCount: 0,
      gruposDuplicadosCount: 0,
      error: err.message || String(err),
    };
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

/**
 * Obtiene el historial completo de pedidos para la sucursal / asesor,
 * agrupando repuestos por pedido y calculando cantidades asignadas, faltantes
 * y el porcentaje de eficiencia (Fill Rate) en tiempo real coordinado con CEDIS.
 */
export async function obtenerHistorialAsesorSupabase(
  sucursal?: string,
  colaborador?: string
): Promise<PedidoHistorialAsesor[]> {
  try {
    const todasLasFilas = await obtenerFilasAdminSupabase();

    // Normalizar términos para comparación flexible
    const normSucursal = sucursal ? normStr(sucursal) : '';
    const normColab = colaborador ? normStr(colaborador) : '';

    // Filtrar filas correspondientes a la sucursal o al asesor
    const filasFiltradas = todasLasFilas.filter(f => {
      const fSuc = normStr(f.sucursal);
      const fCol = normStr(f.colaborador);

      if (normSucursal && fSuc) {
        if (fSuc === normSucursal || fSuc.includes(normSucursal) || normSucursal.includes(fSuc)) {
          return true;
        }
      }

      if (normColab && fCol) {
        if (fCol === normColab || fCol.includes(normColab) || normColab.includes(fCol)) {
          return true;
        }
      }

      return !normSucursal && !normColab;
    });

    // Agrupar filas por pedidoId
    const pedidosMap = new Map<string, PedidoHistorialAsesor>();

    filasFiltradas.forEach(fila => {
      const pedId = fila.pedidoId.trim().toUpperCase();
      if (!pedId) return;

      const cantSol = Number(fila.cantidadSolicitada) || 1;
      const cantAsig = Number(fila.cantidadAsignada) || 0;
      const cantDesp = Number(fila.cantidadDespachada) || 0;
      const listas = Math.max(cantAsig, cantDesp);
      const faltante = Math.max(0, cantSol - listas);

      const linea: LineaHistorialAsesor = {
        lineaId: fila.lineaId,
        codigoRepuesto: fila.codigoRepuesto,
        descripcionOficial: fila.descripcionOficial,
        cantidadSolicitada: cantSol,
        cantidadAsignada: cantAsig,
        cantidadDespachada: cantDesp,
        cantidadFaltante: faltante,
        estatusLinea: fila.estatusLinea,
        contenedorAsignado: fila.contenedorAsignado,
        palletAsignado: fila.palletAsignado,
        ubicacionCedis: fila.ubicacionCedis,
      };

      if (!pedidosMap.has(pedId)) {
        pedidosMap.set(pedId, {
          pedidoId: fila.pedidoId,
          fechaCreacion: (fila as any).fechaCreacion || '',
          sucursal: fila.sucursal || sucursal || 'Villa Lucre',
          colaborador: fila.colaborador || colaborador || 'Asesor',
          cliente: fila.cliente || 'Consumidor Final',
          modeloChangan: fila.modeloChangan || 'Changan',
          vin: fila.vin || '',
          numeroOR: fila.numeroOR || '',
          tipoPedido: (fila as any).tipoPedido || 'Taller Mecánico',
          totalItems: 1,
          cantidadSolicitadaTotal: cantSol,
          cantidadAsignadaTotal: cantAsig,
          cantidadDespachadaTotal: cantDesp,
          cantidadFaltanteTotal: faltante,
          porcentajeEficiencia: cantSol > 0 ? Math.min(100, Math.round((listas / cantSol) * 100)) : 0,
          estatusGeneral: 'PENDIENTE',
          lineas: [linea],
        });
      } else {
        const ped = pedidosMap.get(pedId)!;
        ped.lineas.push(linea);
        ped.totalItems = ped.lineas.length;
        ped.cantidadSolicitadaTotal += cantSol;
        ped.cantidadAsignadaTotal += cantAsig;
        ped.cantidadDespachadaTotal += cantDesp;

        const totalListas = ped.lineas.reduce((acc, l) => acc + Math.max(l.cantidadAsignada, l.cantidadDespachada), 0);
        ped.cantidadFaltanteTotal = Math.max(0, ped.cantidadSolicitadaTotal - totalListas);
        ped.porcentajeEficiencia = ped.cantidadSolicitadaTotal > 0
          ? Math.min(100, Math.round((totalListas / ped.cantidadSolicitadaTotal) * 100))
          : 0;

        if ((!ped.cliente || ped.cliente === 'Consumidor Final') && fila.cliente && fila.cliente !== 'Consumidor Final') {
          ped.cliente = fila.cliente;
        }
        if (!ped.vin && fila.vin) ped.vin = fila.vin;
        if (!ped.numeroOR && fila.numeroOR) ped.numeroOR = fila.numeroOR;
      }
    });

    // Calcular estatus general de cada pedido
    const pedidos = Array.from(pedidosMap.values()).map(ped => {
      const totalSol = ped.cantidadSolicitadaTotal;
      const totalDesp = ped.cantidadDespachadaTotal;
      const totalAsig = ped.cantidadAsignadaTotal;
      const totalListas = Math.max(totalAsig, totalDesp);

      let estatusGeneral: 'PENDIENTE' | 'PARCIAL' | 'COMPLETADO' | 'DESPACHADO' = 'PENDIENTE';

      if (totalDesp > 0 && totalDesp >= totalSol) {
        estatusGeneral = 'DESPACHADO';
      } else if (totalListas >= totalSol) {
        estatusGeneral = 'COMPLETADO';
      } else if (totalListas > 0 || ped.lineas.some(l => l.estatusLinea.toUpperCase().includes('ASIGN') || l.contenedorAsignado)) {
        estatusGeneral = 'PARCIAL';
      } else {
        estatusGeneral = 'PENDIENTE';
      }

      return {
        ...ped,
        estatusGeneral,
      };
    });

    // Ordenar de más reciente a más antiguo
    pedidos.sort((a, b) => {
      const numA = parseInt((a.pedidoId.match(/\d+$/) || ['0'])[0], 10);
      const numB = parseInt((b.pedidoId.match(/\d+$/) || ['0'])[0], 10);
      if (numA && numB && numA !== numB) return numB - numA;
      return b.pedidoId.localeCompare(a.pedidoId);
    });

    return pedidos;
  } catch (err) {
    console.error('Error obteniendo historial de asesor:', err);
    return [];
  }
}

