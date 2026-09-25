/**
 * Servicio de Gestión DPL (Disposición de Pedidos Logísticos)
 * Maneja contenedores, manifiestos y asignación de inventario
 */

import type { ContenedorManifiesto, DetalleDPL, EstatusDPL } from '../models/types';

// ========== ALMACENAMIENTO LOCAL ==========

const STORAGE_KEY_CONTENEDORES = 'cedis_contenedores_dpl';
const STORAGE_KEY_DETALLES = 'cedis_detalles_dpl';

// ========== FUNCIONES DE PERSISTENCIA ==========

export function cargarContenedores(): ContenedorManifiesto[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CONTENEDORES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al cargar contenedores:', error);
    return [];
  }
}

export function guardarContenedores(contenedores: ContenedorManifiesto[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONTENEDORES, JSON.stringify(contenedores));
  } catch (error) {
    console.error('Error al guardar contenedores:', error);
  }
}

export function cargarDetallesDPL(): DetalleDPL[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DETALLES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al cargar detalles DPL:', error);
    return [];
  }
}

export function guardarDetallesDPL(detalles: DetalleDPL[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DETALLES, JSON.stringify(detalles));
  } catch (error) {
    console.error('Error al guardar detalles DPL:', error);
  }
}

// ========== FUNCIONES DE NORMALIZACIÓN ==========

export function normalizarEstatusDPL(estado: string): EstatusDPL {
  const estadoUpper = estado.toUpperCase().trim();
  
  if (estadoUpper.includes('TRÁNSITO') || estadoUpper.includes('TRANSITO')) {
    return 'EN TRÁNSITO';
  }
  if (estadoUpper.includes('ADUANA')) {
    return 'ADUANA';
  }
  if (estadoUpper.includes('RECIBIDO')) {
    return 'RECIBIDO';
  }
  
  return 'EN TRÁNSITO'; // Default
}

// ========== FUNCIONES DE GESTIÓN DE CONTENEDORES ==========

export function crearContenedor(
  contenedor: string,
  proveedor: string,
  fechaArribo: string,
  poReferencia: string,
  tipoTransporte: string,
  creadoPor: string,
  blReferencia?: string
): ContenedorManifiesto {
  return {
    contenedor: contenedor.toUpperCase().trim(),
    proveedor,
    fechaArribo,
    poReferencia,
    tipoTransporte,
    totalPiezas: 0,
    skusUnicos: 0,
    totalPallets: 0,
    estado: 'EN TRÁNSITO',
    creadoPor,
    creadoEn: new Date().toISOString(),
    blReferencia
  };
}

export function actualizarEstadoContenedor(
  contenedores: ContenedorManifiesto[],
  contenedorId: string,
  nuevoEstado: EstatusDPL
): ContenedorManifiesto[] {
  return contenedores.map(c => 
    c.contenedor === contenedorId 
      ? { ...c, estado: nuevoEstado }
      : c
  );
}

export function eliminarContenedor(
  contenedores: ContenedorManifiesto[],
  detalles: DetalleDPL[],
  contenedorId: string
): { contenedores: ContenedorManifiesto[]; detalles: DetalleDPL[] } {
  return {
    contenedores: contenedores.filter(c => c.contenedor !== contenedorId),
    detalles: detalles.filter(d => d.contenedor !== contenedorId)
  };
}

export function agregarDetallesAContenedor(
  contenedores: ContenedorManifiesto[],
  detalles: DetalleDPL[],
  contenedorId: string,
  nuevosDetalles: DetalleDPL[]
): { contenedores: ContenedorManifiesto[]; detalles: DetalleDPL[] } {
  // Actualizar contenedor con totales
  const contenedoresActualizados = contenedores.map(c => {
    if (c.contenedor === contenedorId) {
      const detallesContenedor = [...detalles.filter(d => d.contenedor === contenedorId), ...nuevosDetalles];
      const totalPiezas = detallesContenedor.reduce((sum, d) => sum + d.cantidadTotal, 0);
      const skusUnicos = new Set(detallesContenedor.map(d => d.codigoCompra)).size;
      const totalPallets = new Set(detallesContenedor.map(d => d.pallet)).size;
      
      return {
        ...c,
        totalPiezas,
        skusUnicos,
        totalPallets
      };
    }
    return c;
  });

  // Agregar nuevos detalles
  const detallesActualizados = [...detalles, ...nuevosDetalles];

  return {
    contenedores: contenedoresActualizados,
    detalles: detallesActualizados
  };
}

// ========== FUNCIONES DE ASIGNACIÓN FIFO ==========

export function actualizarAsignacionDetalle(
  detalles: DetalleDPL[],
  detalleId: string,
  cantidadAsignada: number
): DetalleDPL[] {
  return detalles.map(d => {
    if (d.uid === detalleId) {
      const nuevaAsignacion = Math.min(cantidadAsignada, d.cantidadTotal);
      return {
        ...d,
        cantidadAsignada: nuevaAsignacion,
        saldoDisponible: d.cantidadTotal - nuevaAsignacion
      };
    }
    return d;
  });
}

export function obtenerDetallesPorContenedor(
  detalles: DetalleDPL[],
  contenedorId: string
): DetalleDPL[] {
  return detalles.filter(d => d.contenedor === contenedorId);
}

export function obtenerDetallesDisponibles(detalles: DetalleDPL[]): DetalleDPL[] {
  return detalles.filter(d => d.saldoDisponible > 0);
}

// ========== FUNCIONES DE BÚSQUEDA Y FILTRADO ==========

export function buscarContenedores(
  contenedores: ContenedorManifiesto[],
  termino: string
): ContenedorManifiesto[] {
  const terminoLower = termino.toLowerCase().trim();
  if (!terminoLower) return contenedores;

  return contenedores.filter(c =>
    c.contenedor.toLowerCase().includes(terminoLower) ||
    c.proveedor.toLowerCase().includes(terminoLower) ||
    c.poReferencia.toLowerCase().includes(terminoLower)
  );
}

export function filtrarContenedoresPorEstado(
  contenedores: ContenedorManifiesto[],
  estado: EstatusDPL | 'TODOS'
): ContenedorManifiesto[] {
  if (estado === 'TODOS') return contenedores;
  return contenedores.filter(c => c.estado === estado);
}

export function buscarDetallesDPL(
  detalles: DetalleDPL[],
  termino: string
): DetalleDPL[] {
  const terminoLower = termino.toLowerCase().trim();
  if (!terminoLower) return detalles;

  return detalles.filter(d =>
    d.codigoCompra.toLowerCase().includes(terminoLower) ||
    d.descripcion.toLowerCase().includes(terminoLower) ||
    d.pallet.toLowerCase().includes(terminoLower) ||
    (d.codigoSuministrado && d.codigoSuministrado.toLowerCase().includes(terminoLower))
  );
}

// ========== FUNCIONES DE ESTADÍSTICAS ==========

export function obtenerEstadisticasContenedores(contenedores: ContenedorManifiesto[]): {
  total: number;
  enTransito: number;
  enAduana: number;
  recibidos: number;
  totalPiezas: number;
  totalSKUs: number;
} {
  return {
    total: contenedores.length,
    enTransito: contenedores.filter(c => c.estado === 'EN TRÁNSITO').length,
    enAduana: contenedores.filter(c => c.estado === 'ADUANA').length,
    recibidos: contenedores.filter(c => c.estado === 'RECIBIDO').length,
    totalPiezas: contenedores.reduce((sum, c) => sum + c.totalPiezas, 0),
    totalSKUs: contenedores.reduce((sum, c) => sum + c.skusUnicos, 0)
  };
}

export function obtenerEstadisticasDetalles(detalles: DetalleDPL[]): {
  totalRepuestos: number;
  totalUnidades: number;
  unidadesAsignadas: number;
  unidadesDisponibles: number;
  porcentajeAsignacion: number;
} {
  const totalUnidades = detalles.reduce((sum, d) => sum + d.cantidadTotal, 0);
  const unidadesAsignadas = detalles.reduce((sum, d) => sum + d.cantidadAsignada, 0);
  const unidadesDisponibles = detalles.reduce((sum, d) => sum + d.saldoDisponible, 0);

  return {
    totalRepuestos: detalles.length,
    totalUnidades,
    unidadesAsignadas,
    unidadesDisponibles,
    porcentajeAsignacion: totalUnidades > 0 ? (unidadesAsignadas / totalUnidades) * 100 : 0
  };
}
