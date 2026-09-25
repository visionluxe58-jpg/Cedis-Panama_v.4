/**
 * Servicios de dominio - Lógica de negocio pura
 */

import type { ClasificacionRepuesto, MetodoTransporte, CategoriaRepuesto } from '../models/types';

// ========== CLASIFICACIÓN LOGÍSTICA ==========

export function clasificarRepuesto(codigo: string, descripcion: string): ClasificacionRepuesto {
  const desc = descripcion.toUpperCase();
  
  // Airbags / Pirotécnicos (DGR)
  if (desc.includes('AIRBAG') || desc.includes('PIROTECN')) {
    return {
      transporte: 'Maritimo',
      pesoUnitarioKg: 2.5,
      largoCm: 40,
      anchoCm: 30,
      altoCm: 20,
      pesoVolumetricoKg: 4,
      categoria: 'Airbags / Pirotécnicos (DGR)',
      motivo: 'Material peligroso Clase 9 - Restricción IATA',
      esDGR: true
    };
  }
  
  // Carrocería Mayor
  if (desc.includes('PARACHOQUE') || desc.includes('BUMPER') || desc.includes('CAPÓ') || desc.includes('PUERTA')) {
    return {
      transporte: 'Maritimo',
      pesoUnitarioKg: 15,
      largoCm: 150,
      anchoCm: 80,
      altoCm: 30,
      pesoVolumetricoKg: 60,
      categoria: 'Carrocería Mayor / Colisión',
      motivo: 'Pieza voluminosa - Transporte marítimo',
      esDGR: false
    };
  }
  
  // Vidrios
  if (desc.includes('VIDRIO') || desc.includes('PARABRISAS') || desc.includes('CRISTAL')) {
    return {
      transporte: 'Maritimo',
      pesoUnitarioKg: 12,
      largoCm: 140,
      anchoCm: 90,
      altoCm: 10,
      pesoVolumetricoKg: 25,
      categoria: 'Vidrios y Parabrisas',
      motivo: 'Material frágil - Requiere embalaje especial',
      esDGR: false
    };
  }
  
  // Eléctrico / Sensores
  if (desc.includes('SENSOR') || desc.includes('ECU') || desc.includes('MÓDULO')) {
    return {
      transporte: 'Aereo',
      pesoUnitarioKg: 0.8,
      largoCm: 20,
      anchoCm: 15,
      altoCm: 10,
      pesoVolumetricoKg: 0.6,
      categoria: 'Eléctrico / Sensores',
      motivo: 'Componente electrónico de alto valor',
      esDGR: false
    };
  }
  
  // Default: Pieza Mecánica
  return {
    transporte: 'Aereo',
    pesoUnitarioKg: 2,
    largoCm: 30,
    anchoCm: 20,
    altoCm: 15,
    pesoVolumetricoKg: 1.8,
    categoria: 'Pieza Mecánica / Motor',
    motivo: 'Pieza mecánica estándar',
    esDGR: false
  };
}

// ========== CÁLCULO DE KPIs ==========

export function calcularKPIs(pedidos: any[], inventario: any[]) {
  const totalPedidos = pedidos.length;
  const totalLineas = pedidos.reduce((sum, p) => sum + (p.lineas?.length || 0), 0);
  const totalPiezasSolicitadas = pedidos.reduce((sum, p) => {
    return sum + (p.lineas?.reduce((s: number, l: any) => s + l.cantidad, 0) || 0);
  }, 0);
  
  const piezasCubiertas = totalPiezasSolicitadas * 0.88; // Simulación
  const fillRate = totalPiezasSolicitadas > 0 ? (piezasCubiertas / totalPiezasSolicitadas) * 100 : 0;
  
  return {
    fillRate: Math.round(fillRate * 10) / 10,
    otif: 92.5,
    quiebreStock: 7.5,
    tiempoCiclo: 36,
    exactitudInventario: 98.2,
    exactitudPicking: 99.1,
    efectividadCruce: 85.3,
    pedidoPerfecto: 89.7,
    totalPedidos,
    totalLineas,
    totalPiezasSolicitadas: Math.round(totalPiezasSolicitadas),
    piezasCubiertas: Math.round(piezasCubiertas)
  };
}

// ========== MATCHING FIFO ==========

export function ejecutarMatchingFIFO(
  pedidos: any[],
  inventario: any[]
): any {
  let asignadasTotales = 0;
  let asignadasParciales = 0;
  let sinStock = 0;
  let piezasAsignadas = 0;
  
  const detallesActualizados = pedidos.flatMap(p => 
    p.lineas?.map((l: any) => {
      const stock = inventario.find(i => i.codigoRepuesto === l.codigoRepuesto);
      const disponible = stock?.saldoDisponible || 0;
      
      let estatus = 'Sin Stock';
      let asignado = 0;
      
      if (disponible >= l.cantidad) {
        asignado = l.cantidad;
        estatus = 'Asignado';
        asignadasTotales++;
      } else if (disponible > 0) {
        asignado = disponible;
        estatus = 'Asignado Parcial';
        asignadasParciales++;
      } else {
        sinStock++;
      }
      
      piezasAsignadas += asignado;
      
      return {
        lineaId: l.lineaId || `LIN-${Math.random()}`,
        pedidoId: p.folio,
        codigoRepuesto: l.codigoRepuesto,
        descripcion: l.descripcion,
        cantidadSolicitada: l.cantidad,
        cantidadAsignada: asignado,
        cantidadDespachada: 0,
        contenedorAsignado: stock?.contenedorId || '',
        palletAsignado: stock?.palletCaseNo || '',
        packageNo: stock?.packageNo || '',
        ubicacionCedis: stock?.ubicacionCedis || '',
        estatusLinea: estatus
      };
    }) || []
  );
  
  return {
    success: true,
    totalLineas: detallesActualizados.length,
    asignadasTotales,
    asignadasParciales,
    sinStock,
    piezasAsignadas,
    coincidencias: asignadasTotales + asignadasParciales,
    palletsInvolucrados: [...new Set(detallesActualizados.map(d => d.palletAsignado).filter(Boolean))],
    contenedoresInvolucrados: [...new Set(detallesActualizados.map(d => d.contenedorAsignado).filter(Boolean))],
    detalles: detallesActualizados,
    mensaje: `Matching completado: ${piezasAsignadas} piezas asignadas`,
    timestamp: new Date().toISOString()
  };
}
