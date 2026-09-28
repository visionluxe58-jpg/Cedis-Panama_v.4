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

export function calcularKPIs(pedidos: any[], inventario: any[] = []) {
  if (!pedidos || pedidos.length === 0) {
    return {
      fillRate: 0,
      otif: 92.5,
      quiebreStock: 0,
      tiempoCiclo: 36,
      exactitudInventario: 98.2,
      exactitudPicking: 99.1,
      efectividadCruce: 85.3,
      pedidoPerfecto: 89.7,
      totalPedidos: 0,
      totalLineas: 0,
      totalPiezasSolicitadas: 0,
      piezasCubiertas: 0
    };
  }

  const pedidosUnicos = new Set<string>();
  let totalLineas = 0;
  let totalPiezasSolicitadas = 0;
  let piezasCubiertas = 0;
  let lineasSinStock = 0;

  for (const p of pedidos) {
    if (p.lineas && Array.isArray(p.lineas)) {
      pedidosUnicos.add(p.folio || p.id || String(Math.random()));
      totalLineas += p.lineas.length;
      for (const l of p.lineas) {
        const cant = Number(l.cantidad) || 0;
        totalPiezasSolicitadas += cant;
        const stock = (inventario || []).find((i: any) =>
          (i.codigoRepuesto || '').trim().toUpperCase() === (l.codigoRepuesto || '').trim().toUpperCase()
        );
        const disp = Number(stock?.saldoDisponible) || 0;
        if (disp >= cant) {
          piezasCubiertas += cant;
        } else if (disp > 0) {
          piezasCubiertas += disp;
        } else {
          lineasSinStock++;
        }
      }
    } else {
      // FilaRastreador plana (de matriz_pedidos en Supabase)
      const pedidoId = p.pedidoId || p.pedido_id || p.folio || 'PED-000';
      pedidosUnicos.add(pedidoId);
      totalLineas += 1;
      const cantSol = Number(p.cantidadSolicitada ?? p.cantidad_solicitada ?? p.cantidad) || 0;
      const cantAsig = Number(p.cantidadAsignada ?? p.cantidad_asignada) || 0;
      totalPiezasSolicitadas += cantSol;
      
      if (cantAsig > 0) {
        piezasCubiertas += cantAsig;
      } else {
        const cod = (p.codigoRepuesto || p.codigo_repuesto || '').trim().toUpperCase();
        const stock = (inventario || []).find((i: any) =>
          (i.codigoRepuesto || '').trim().toUpperCase() === cod
        );
        const disp = Number(stock?.saldoDisponible) || 0;
        if (disp >= cantSol) {
          piezasCubiertas += cantSol;
        } else if (disp > 0) {
          piezasCubiertas += disp;
        } else {
          lineasSinStock++;
        }
      }
    }
  }

  const totalPedidos = pedidosUnicos.size;
  const fillRate = totalPiezasSolicitadas > 0 ? (piezasCubiertas / totalPiezasSolicitadas) * 100 : 0;
  const quiebreStock = totalLineas > 0 ? (lineasSinStock / totalLineas) * 100 : 0;

  return {
    fillRate: Math.round(fillRate * 10) / 10,
    otif: 92.5,
    quiebreStock: Math.round(quiebreStock * 10) / 10,
    tiempoCiclo: 36,
    exactitudInventario: 98.2,
    exactitudPicking: 99.1,
    efectividadCruce: 85.3,
    pedidoPerfecto: Math.round(Math.max(0, 100 - quiebreStock) * 10) / 10,
    totalPedidos,
    totalLineas,
    totalPiezasSolicitadas: Math.round(totalPiezasSolicitadas),
    piezasCubiertas: Math.round(piezasCubiertas)
  };
}

// ========== MATCHING FIFO ==========

export function ejecutarMatchingFIFO(
  pedidos: any[],
  inventario: any[] = []
): any {
  let asignadasTotales = 0;
  let asignadasParciales = 0;
  let sinStock = 0;
  let piezasAsignadas = 0;

  // Extraer líneas homogéneas para matching
  const lineasParaMatching: Array<{
    lineaId: string;
    pedidoId: string;
    codigoRepuesto: string;
    descripcion: string;
    cantidad: number;
    yaAsignada?: number;
    contenedorPrevio?: string;
  }> = [];

  for (const p of pedidos || []) {
    if (p.lineas && Array.isArray(p.lineas)) {
      for (const l of p.lineas) {
        lineasParaMatching.push({
          lineaId: l.lineaId || `LIN-${Math.random().toString().slice(-5)}`,
          pedidoId: p.folio || 'PED-000',
          codigoRepuesto: l.codigoRepuesto || '',
          descripcion: l.descripcion || '',
          cantidad: Number(l.cantidad) || 1,
        });
      }
    } else if (p.codigoRepuesto || p.codigo_repuesto) {
      lineasParaMatching.push({
        lineaId: p.lineaId || p.id || `LIN-${Math.random().toString().slice(-5)}`,
        pedidoId: p.pedidoId || p.pedido_id || p.folio || 'PED-000',
        codigoRepuesto: p.codigoRepuesto || p.codigo_repuesto || '',
        descripcion: p.descripcionOficial || p.descripcion_oficial || p.descripcion || '',
        cantidad: Number(p.cantidadSolicitada ?? p.cantidad_solicitada ?? p.cantidad) || 1,
        yaAsignada: Number(p.cantidadAsignada ?? p.cantidad_asignada) || 0,
        contenedorPrevio: p.contenedorAsignado || p.contenedor_asignado || '',
      });
    }
  }

  const detallesActualizados = lineasParaMatching.map(l => {
    const cod = (l.codigoRepuesto || '').trim().toUpperCase();
    const stock = (inventario || []).find((i: any) =>
      (i.codigoRepuesto || '').trim().toUpperCase() === cod
    );
    const disponible = Number(stock?.saldoDisponible) || 0;

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
    } else if (l.yaAsignada && l.yaAsignada > 0) {
      asignado = l.yaAsignada;
      estatus = l.yaAsignada >= l.cantidad ? 'Asignado' : 'Asignado Parcial';
      if (estatus === 'Asignado') asignadasTotales++;
      else asignadasParciales++;
    } else {
      sinStock++;
    }

    piezasAsignadas += asignado;

    return {
      lineaId: l.lineaId,
      pedidoId: l.pedidoId,
      codigoRepuesto: l.codigoRepuesto,
      descripcion: l.descripcion,
      cantidadSolicitada: l.cantidad,
      cantidadAsignada: asignado,
      cantidadDespachada: 0,
      contenedorAsignado: stock?.contenedorId || l.contenedorPrevio || '',
      palletAsignado: stock?.palletCaseNo || '',
      packageNo: stock?.packageNo || '',
      ubicacionCedis: stock?.ubicacionCedis || '',
      estatusLinea: estatus
    };
  });

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
    mensaje: `Matching completado: ${piezasAsignadas} piezas asignadas de ${detallesActualizados.length} líneas`,
    timestamp: new Date().toISOString()
  };
}

// Re-exportar IA de reconocimiento de repuestos
export { IAReconocimientoRepuestos, BASE_DATOS_REPUESTOS } from './iaReconocimientoRepuestos';
export type { RepuestoChangan } from './iaReconocimientoRepuestos';

// Re-exportar agente de cotizaciones IA
export { analizarCotizacion, analizarMuestraDemo, obtenerEstadisticasServicio } from './agenteCotizaciones';

// Re-exportar gestión DPL
export * from './gestionDPL';
