/**
 * Servicio de Importación de Datos desde Google Sheets
 * Versión Beta v04.1 - Protección de Datos
 * 
 * Este servicio permite:
 * 1. Importar datos desde un archivo CSV/Excel
 * 2. Reconocer automáticamente las columnas
 * 3. Guardar en localStorage como copia de trabajo
 * 4. Solo modificar datos con acciones explícitas del usuario
 */

import * as XLSX from 'xlsx';
import type { 
  Asesor, 
  DPLManifiesto, 
  DPLDetalle, 
  FilaRastreador 
} from '../models/types';

// ========== CLAVES DE LOCALSTORAGE ==========
const STORAGE_KEYS = {
  ASESORES: 'cedis_beta_asesores',
  MANIFIESTOS: 'cedis_beta_manifiestos',
  DETALLES_DPL: 'cedis_beta_detalles_dpl',
  PEDIDOS: 'cedis_beta_pedidos',
  ULTIMA_IMPORTACION: 'cedis_beta_ultima_importacion'
};

// ========== TIPOS ==========
export interface ResultadoImportacion {
  exito: boolean;
  mensaje: string;
  datosImportados: {
    asesores?: number;
    manifiestos?: number;
    detallesDPL?: number;
    pedidos?: number;
  };
  errores?: string[];
}

export interface ColumnaReconocida {
  indice: number;
  nombreOriginal: string;
  nombreReconocido: string;
  seccion: 'asesores' | 'manifiestos' | 'detalles_dpl' | 'pedidos' | 'desconocido';
  confianza: number; // 0-100
}

type SeccionDatos = 'asesores' | 'manifiestos' | 'detalles_dpl' | 'pedidos' | 'desconocido';

// ========== MAPEO DE COLUMNAS ==========
const MAPEO_COLUMNAS = {
  // Asesores
  'nombre del encargado': { seccion: 'asesores', campo: 'nombre', confianza: 95 },
  'nombre': { seccion: 'asesores', campo: 'nombre', confianza: 90 },
  'sucursal': { seccion: 'asesores', campo: 'sucursal', confianza: 95 },
  'departamento / canal': { seccion: 'asesores', campo: 'departamento', confianza: 90 },
  'departamento': { seccion: 'asesores', campo: 'departamento', confianza: 85 },
  'canal': { seccion: 'asesores', campo: 'departamento', confianza: 80 },
  'cargo / rol operativo': { seccion: 'asesores', campo: 'cargo', confianza: 90 },
  'cargo': { seccion: 'asesores', campo: 'cargo', confianza: 85 },
  'teléfono / whatsapp': { seccion: 'asesores', campo: 'telefono', confianza: 90 },
  'telefono': { seccion: 'asesores', campo: 'telefono', confianza: 85 },
  'whatsapp': { seccion: 'asesores', campo: 'telefono', confianza: 80 },
  'correo electrónico': { seccion: 'asesores', campo: 'correo', confianza: 90 },
  'correo': { seccion: 'asesores', campo: 'correo', confianza: 85 },
  'email': { seccion: 'asesores', campo: 'correo', confianza: 80 },
  
  // Manifiestos
  'contenedor': { seccion: 'manifiestos', campo: 'contenedorId', confianza: 95 },
  'contenedorid': { seccion: 'manifiestos', campo: 'contenedorId', confianza: 90 },
  'invoice': { seccion: 'manifiestos', campo: 'contenedorId', confianza: 85 },
  'proveedor': { seccion: 'manifiestos', campo: 'proveedor', confianza: 95 },
  'fecha arribo': { seccion: 'manifiestos', campo: 'fechaArribo', confianza: 90 },
  'fecha': { seccion: 'manifiestos', campo: 'fechaArribo', confianza: 70 },
  'po referencia': { seccion: 'manifiestos', campo: 'poReferencia', confianza: 90 },
  'po': { seccion: 'manifiestos', campo: 'poReferencia', confianza: 80 },
  'tipo transporte': { seccion: 'manifiestos', campo: 'tipoTransporte', confianza: 90 },
  'transporte': { seccion: 'manifiestos', campo: 'tipoTransporte', confianza: 80 },
  'total piezas': { seccion: 'manifiestos', campo: 'totalPiezas', confianza: 90 },
  'piezas': { seccion: 'manifiestos', campo: 'totalPiezas', confianza: 75 },
  'skus unicos': { seccion: 'manifiestos', campo: 'skusUnicos', confianza: 90 },
  'skus': { seccion: 'manifiestos', campo: 'skusUnicos', confianza: 80 },
  'total pallets': { seccion: 'manifiestos', campo: 'totalPallets', confianza: 90 },
  'pallets': { seccion: 'manifiestos', campo: 'totalPallets', confianza: 80 },
  'estado': { seccion: 'manifiestos', campo: 'estado', confianza: 90 },
  'estatus': { seccion: 'manifiestos', campo: 'estado', confianza: 85 },
  'bl referencia': { seccion: 'manifiestos', campo: 'blReferencia', confianza: 85 },
  'bl': { seccion: 'manifiestos', campo: 'blReferencia', confianza: 75 },
  
  // Detalles DPL
  'inventario id': { seccion: 'detalles_dpl', campo: 'inventarioId', confianza: 95 },
  'inventarioid': { seccion: 'detalles_dpl', campo: 'inventarioId', confianza: 90 },
  'pallet case no': { seccion: 'detalles_dpl', campo: 'palletCaseNo', confianza: 90 },
  'pallet': { seccion: 'detalles_dpl', campo: 'palletCaseNo', confianza: 85 },
  'package no': { seccion: 'detalles_dpl', campo: 'packageNo', confianza: 90 },
  'package': { seccion: 'detalles_dpl', campo: 'packageNo', confianza: 85 },
  'codigo repuesto': { seccion: 'detalles_dpl', campo: 'codigoRepuesto', confianza: 95 },
  'codigo': { seccion: 'detalles_dpl', campo: 'codigoRepuesto', confianza: 80 },
  'descripcion': { seccion: 'detalles_dpl', campo: 'descripcion', confianza: 95 },
  'cantidad total': { seccion: 'detalles_dpl', campo: 'cantidadTotal', confianza: 90 },
  'cantidad': { seccion: 'detalles_dpl', campo: 'cantidadTotal', confianza: 75 },
  'cantidad asignada': { seccion: 'detalles_dpl', campo: 'cantidadAsignada', confianza: 90 },
  'asignada': { seccion: 'detalles_dpl', campo: 'cantidadAsignada', confianza: 80 },
  'cantidad despachada': { seccion: 'detalles_dpl', campo: 'cantidadDespachada', confianza: 90 },
  'despachada': { seccion: 'detalles_dpl', campo: 'cantidadDespachada', confianza: 80 },
  'saldo disponible': { seccion: 'detalles_dpl', campo: 'saldoDisponible', confianza: 90 },
  'saldo': { seccion: 'detalles_dpl', campo: 'saldoDisponible', confianza: 75 },
  'ubicacion cedis': { seccion: 'detalles_dpl', campo: 'ubicacionCedis', confianza: 90 },
  'ubicacion': { seccion: 'detalles_dpl', campo: 'ubicacionCedis', confianza: 80 },
  
  // Pedidos
  'pedido id': { seccion: 'pedidos', campo: 'pedidoId', confianza: 95 },
  'pedido': { seccion: 'pedidos', campo: 'pedidoId', confianza: 85 },
  'folio': { seccion: 'pedidos', campo: 'pedidoId', confianza: 80 },
  'cliente': { seccion: 'pedidos', campo: 'cliente', confianza: 95 },
  'modelo changan': { seccion: 'pedidos', campo: 'modeloChangan', confianza: 90 },
  'modelo': { seccion: 'pedidos', campo: 'modeloChangan', confianza: 75 },
  'vin': { seccion: 'pedidos', campo: 'vin', confianza: 95 },
  'chasis': { seccion: 'pedidos', campo: 'vin', confianza: 85 },
  'no cotizacion': { seccion: 'pedidos', campo: 'noCotizacion', confianza: 90 },
  'cotizacion': { seccion: 'pedidos', campo: 'noCotizacion', confianza: 80 },
  'colaborador': { seccion: 'pedidos', campo: 'colaborador', confianza: 90 },
  'asesor': { seccion: 'pedidos', campo: 'colaborador', confianza: 80 }
};

// ========== FUNCIONES DE IMPORTACIÓN ==========

/**
 * Lee un archivo Excel/CSV y retorna los datos
 */
export async function leerArchivo(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        resolve(jsonData as any[][]);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Reconoce las columnas del archivo
 */
export function reconocerColumnas(headers: string[]): ColumnaReconocida[] {
  const columnasReconocidas: ColumnaReconocida[] = [];
  
  headers.forEach((header, indice) => {
    const headerLower = header.toLowerCase().trim();
    
    // Buscar en el mapeo
    for (const [key, value] of Object.entries(MAPEO_COLUMNAS)) {
      if (headerLower.includes(key) || key.includes(headerLower)) {
        columnasReconocidas.push({
          indice,
          nombreOriginal: header,
          nombreReconocido: value.campo,
          seccion: value.seccion as SeccionDatos,
          confianza: value.confianza
        });
        break;
      }
    }
    
    // Si no se reconoció, marcar como desconocido
    if (!columnasReconocidas.find(c => c.indice === indice)) {
      columnasReconocidas.push({
        indice,
        nombreOriginal: header,
        nombreReconocido: 'desconocido',
        seccion: 'desconocido' as SeccionDatos,
        confianza: 0
      });
    }
  });
  
  return columnasReconocidas;
}

/**
 * Convierte los datos del archivo a objetos estructurados
 */
export function convertirDatos(
  rows: any[][],
  columnasReconocidas: ColumnaReconocida[]
): {
  asesores: Asesor[];
  manifiestos: DPLManifiesto[];
  detallesDPL: DPLDetalle[];
  pedidos: FilaRastreador[];
} {
  const headers = rows[0] as string[];
  const dataRows = rows.slice(1);
  
  const asesores: Asesor[] = [];
  const manifiestos: DPLManifiesto[] = [];
  const detallesDPL: DPLDetalle[] = [];
  const pedidos: FilaRastreador[] = [];
  
  // Agrupar columnas por sección
  const columnasPorSeccion = {
    asesores: columnasReconocidas.filter(c => c.seccion === 'asesores'),
    manifiestos: columnasReconocidas.filter(c => c.seccion === 'manifiestos'),
    detalles_dpl: columnasReconocidas.filter(c => c.seccion === 'detalles_dpl'),
    pedidos: columnasReconocidas.filter(c => c.seccion === 'pedidos')
  };
  
  // Procesar cada fila
  dataRows.forEach((row, rowIndex) => {
    // Asesores
    if (columnasPorSeccion.asesores.length > 0) {
      const asesor: any = { id: rowIndex + 1 };
      columnasPorSeccion.asesores.forEach(col => {
        const valor = row[col.indice];
        if (valor !== undefined && valor !== null && valor !== '') {
          asesor[col.nombreReconocido] = String(valor).trim();
        }
      });
      
      // Solo agregar si tiene nombre y sucursal
      if (asesor.nombre && asesor.sucursal) {
        asesores.push({
          id: asesor.id,
          nombre: asesor.nombre,
          sucursal: asesor.sucursal,
          departamento: asesor.departamento || '',
          cargo: asesor.cargo || '',
          telefono: asesor.telefono || '',
          correo: asesor.correo || ''
        });
      }
    }
    
    // Manifiestos
    if (columnasPorSeccion.manifiestos.length > 0) {
      const manifiesto: any = {};
      columnasPorSeccion.manifiestos.forEach(col => {
        const valor = row[col.indice];
        if (valor !== undefined && valor !== null && valor !== '') {
          manifiesto[col.nombreReconocido] = valor;
        }
      });
      
      // Solo agregar si tiene contenedorId
      if (manifiesto.contenedorId) {
        manifiestos.push({
          contenedorId: String(manifiesto.contenedorId).trim(),
          proveedor: String(manifiesto.proveedor || '').trim(),
          fechaArribo: String(manifiesto.fechaArribo || '').trim(),
          poReferencia: String(manifiesto.poReferencia || '').trim(),
          tipoTransporte: String(manifiesto.tipoTransporte || 'Marítimo 40HQ').trim(),
          totalPiezas: Number(manifiesto.totalPiezas) || 0,
          skusUnicos: Number(manifiesto.skusUnicos) || 0,
          totalPallets: Number(manifiesto.totalPallets) || 0,
          estado: (manifiesto.estado || 'EN TRÁNSITO') as any,
          creadoPor: 'Importación',
          creadoEn: new Date().toISOString(),
          blReferencia: manifiesto.blReferencia ? String(manifiesto.blReferencia).trim() : undefined
        });
      }
    }
    
    // Detalles DPL
    if (columnasPorSeccion.detalles_dpl.length > 0) {
      const detalle: any = {};
      columnasPorSeccion.detalles_dpl.forEach(col => {
        const valor = row[col.indice];
        if (valor !== undefined && valor !== null && valor !== '') {
          detalle[col.nombreReconocido] = valor;
        }
      });
      
      // Solo agregar si tiene inventarioId o codigoRepuesto
      if (detalle.inventarioId || detalle.codigoRepuesto) {
        detallesDPL.push({
          inventarioId: String(detalle.inventarioId || `INV-${rowIndex + 1}`).trim(),
          contenedorId: String(detalle.contenedorId || '').trim(),
          palletCaseNo: String(detalle.palletCaseNo || 'P001').trim(),
          packageNo: String(detalle.packageNo || 'PKG-001').trim(),
          codigoRepuesto: String(detalle.codigoRepuesto || '').trim(),
          descripcion: String(detalle.descripcion || '').trim(),
          cantidadTotal: Number(detalle.cantidadTotal) || 0,
          cantidadAsignada: Number(detalle.cantidadAsignada) || 0,
          cantidadDespachada: Number(detalle.cantidadDespachada) || 0,
          saldoDisponible: Number(detalle.saldoDisponible) || 0,
          ubicacionCedis: String(detalle.ubicacionCedis || '').trim()
        });
      }
    }
    
    // Pedidos
    if (columnasPorSeccion.pedidos.length > 0) {
      const pedido: any = {};
      columnasPorSeccion.pedidos.forEach(col => {
        const valor = row[col.indice];
        if (valor !== undefined && valor !== null && valor !== '') {
          pedido[col.nombreReconocido] = valor;
        }
      });
      
      // Solo agregar si tiene pedidoId
      if (pedido.pedidoId) {
        pedidos.push({
          lineaId: `LIN-${rowIndex + 1}`,
          pedidoId: String(pedido.pedidoId).trim(),
          codigoRepuesto: String(pedido.codigoRepuesto || '').trim(),
          descripcionOficial: String(pedido.descripcionOficial || pedido.descripcion || '').trim(),
          cantidadSolicitada: Number(pedido.cantidadSolicitada) || 0,
          cantidadAsignada: Number(pedido.cantidadAsignada) || 0,
          cantidadDespachada: Number(pedido.cantidadDespachada) || 0,
          estatusLinea: String(pedido.estatusLinea || pedido.estado || 'Pendiente').trim(),
          contenedorAsignado: String(pedido.contenedorAsignado || '').trim(),
          palletAsignado: String(pedido.palletAsignado || '').trim(),
          packageNo: String(pedido.packageNo || '').trim(),
          ubicacionCedis: String(pedido.ubicacionCedis || '').trim(),
          sucursal: String(pedido.sucursal || '').trim(),
          colaborador: String(pedido.colaborador || '').trim(),
          cliente: String(pedido.cliente || '').trim(),
          modeloChangan: String(pedido.modeloChangan || '').trim(),
          numeroOR: String(pedido.numeroOR || pedido.noCotizacion || '').trim(),
          vin: String(pedido.vin || '').trim()
        });
      }
    }
  });
  
  return { asesores, manifiestos, detallesDPL, pedidos };
}

/**
 * Importa datos desde un archivo
 */
export async function importarDatosDesdeArchivo(file: File): Promise<ResultadoImportacion> {
  try {
    // Leer archivo
    const rows = await leerArchivo(file);
    
    if (rows.length < 2) {
      return {
        exito: false,
        mensaje: 'El archivo está vacío o no tiene datos',
        datosImportados: {},
        errores: ['No se encontraron datos en el archivo']
      };
    }
    
    // Reconocer columnas
    const headers = rows[0] as string[];
    const columnasReconocidas = reconocerColumnas(headers);
    
    // Convertir datos
    const datos = convertirDatos(rows, columnasReconocidas);
    
    // Guardar en localStorage
    if (datos.asesores.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ASESORES, JSON.stringify(datos.asesores));
    }
    if (datos.manifiestos.length > 0) {
      localStorage.setItem(STORAGE_KEYS.MANIFIESTOS, JSON.stringify(datos.manifiestos));
    }
    if (datos.detallesDPL.length > 0) {
      localStorage.setItem(STORAGE_KEYS.DETALLES_DPL, JSON.stringify(datos.detallesDPL));
    }
    if (datos.pedidos.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(datos.pedidos));
    }
    
    // Guardar timestamp de importación
    localStorage.setItem(STORAGE_KEYS.ULTIMA_IMPORTACION, new Date().toISOString());
    
    return {
      exito: true,
      mensaje: `Datos importados exitosamente`,
      datosImportados: {
        asesores: datos.asesores.length,
        manifiestos: datos.manifiestos.length,
        detallesDPL: datos.detallesDPL.length,
        pedidos: datos.pedidos.length
      }
    };
    
  } catch (error) {
    return {
      exito: false,
      mensaje: 'Error al importar el archivo',
      datosImportados: {},
      errores: [error instanceof Error ? error.message : 'Error desconocido']
    };
  }
}

// ========== FUNCIONES DE LECTURA ==========

/**
 * Obtiene los asesores desde localStorage
 */
export function obtenerAsesores(): Asesor[] {
  const data = localStorage.getItem(STORAGE_KEYS.ASESORES);
  return data ? JSON.parse(data) : [];
}

/**
 * Obtiene los manifiestos desde localStorage
 */
export function obtenerManifiestos(): DPLManifiesto[] {
  const data = localStorage.getItem(STORAGE_KEYS.MANIFIESTOS);
  return data ? JSON.parse(data) : [];
}

/**
 * Obtiene los detalles DPL desde localStorage
 */
export function obtenerDetallesDPL(): DPLDetalle[] {
  const data = localStorage.getItem(STORAGE_KEYS.DETALLES_DPL);
  return data ? JSON.parse(data) : [];
}

/**
 * Obtiene los pedidos desde localStorage
 */
export function obtenerPedidos(): FilaRastreador[] {
  const data = localStorage.getItem(STORAGE_KEYS.PEDIDOS);
  return data ? JSON.parse(data) : [];
}

/**
 * Obtiene la fecha de la última importación
 */
export function obtenerUltimaImportacion(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ULTIMA_IMPORTACION);
}

// ========== FUNCIONES DE ESCRITURA CONTROLADA ==========

/**
 * Actualiza un manifiesto (solo con acción explícita del usuario)
 */
export function actualizarManifiesto(contenedorId: string, cambios: Partial<DPLManifiesto>): void {
  const manifiestos = obtenerManifiestos();
  const indice = manifiestos.findIndex(m => m.contenedorId === contenedorId);
  
  if (indice !== -1) {
    manifiestos[indice] = { ...manifiestos[indice], ...cambios };
    localStorage.setItem(STORAGE_KEYS.MANIFIESTOS, JSON.stringify(manifiestos));
  }
}

/**
 * Actualiza un detalle DPL (solo con acción explícita del usuario)
 */
export function actualizarDetalleDPL(inventarioId: string, cambios: Partial<DPLDetalle>): void {
  const detalles = obtenerDetallesDPL();
  const indice = detalles.findIndex(d => d.inventarioId === inventarioId);
  
  if (indice !== -1) {
    detalles[indice] = { ...detalles[indice], ...cambios };
    localStorage.setItem(STORAGE_KEYS.DETALLES_DPL, JSON.stringify(detalles));
  }
}

/**
 * Agrega un nuevo pedido (solo con acción explícita del usuario)
 */
export function agregarPedido(pedido: FilaRastreador): void {
  const pedidos = obtenerPedidos();
  pedidos.push(pedido);
  localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(pedidos));
}

/**
 * Actualiza un pedido (solo con acción explícita del usuario)
 */
export function actualizarPedido(lineaId: string, cambios: Partial<FilaRastreador>): void {
  const pedidos = obtenerPedidos();
  const indice = pedidos.findIndex(p => p.lineaId === lineaId);
  
  if (indice !== -1) {
    pedidos[indice] = { ...pedidos[indice], ...cambios };
    localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(pedidos));
  }
}

/**
 * Elimina todos los datos importados (reset completo)
 */
export function eliminarTodosLosDatos(): void {
  localStorage.removeItem(STORAGE_KEYS.ASESORES);
  localStorage.removeItem(STORAGE_KEYS.MANIFIESTOS);
  localStorage.removeItem(STORAGE_KEYS.DETALLES_DPL);
  localStorage.removeItem(STORAGE_KEYS.PEDIDOS);
  localStorage.removeItem(STORAGE_KEYS.ULTIMA_IMPORTACION);
}
