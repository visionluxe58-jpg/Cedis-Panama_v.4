/**
 * Servicio Generador de Documentos Oficiales en PDF:
 * 1. Etiquetas de Identificación para Pedidos Especiales (Formato 100x150mm / 4x6" para cajas/bultos)
 * 2. Actas de Entrega y Retiro en Mostrador CEDIS (Sin camión, retiro presencial por sucursales)
 * 3. Guías de Traslado y Transferencia
 * 
 * CEDIS Changan Panamá
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FilaRastreador, DespachoRegistro } from '../models/types';

export interface DatosRetiroCedis {
  numeroActa: string;
  fecha: string;
  sucursalDestino: string;
  personaQueRetira: string;
  cedulaPersona: string;
  entregadorCedis: string;
  observaciones?: string;
  lineas: FilaRastreador[];
}

/**
 * 1. ETIQUETA OFICIAL PARA CAJA / BULTO DE PEDIDO ESPECIAL
 * Formato estándar de etiqueta logística 100mm x 150mm (4x6 pulgadas)
 */
export function generarEtiquetaPedidoEspecialPDF(linea: FilaRastreador): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150], // 100mm x 150mm (4x6")
  });

  // Borde exterior de corte
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.rect(2, 2, 96, 146);

  // Encabezado
  doc.setFillColor(185, 28, 28); // #B91C1C Rojo Changan
  doc.rect(3, 3, 94, 16, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CHANGAN MOTORS PANAMÁ', 50, 9, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CEDIS CENTRAL - PEDIDO ESPECIAL', 50, 14, { align: 'center' });

  // Banner Gigante de Sucursal Destino
  doc.setFillColor(248, 250, 252);
  doc.rect(3, 20, 94, 18, 'F');
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.8);
  doc.rect(5, 22, 90, 14);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SUCURSAL DESTINO / RETIRO:', 50, 25.5, { align: 'center' });

  doc.setTextColor(185, 28, 28);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(linea.sucursal.toUpperCase(), 50, 32, { align: 'center' });

  // Datos del Pedido
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLIO:', 6, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(linea.pedidoId, 22, 44);

  doc.setFont('helvetica', 'bold');
  doc.text('NO. OR:', 55, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(linea.numeroOR || 'Stock / N/A', 70, 44);

  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', 6, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(linea.cliente || 'Taller Sucursal', 22, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('ASESOR:', 6, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(linea.colaborador || 'Asesor Repuestos', 22, 56);

  if (linea.vin) {
    doc.setFont('helvetica', 'bold');
    doc.text('VIN:', 6, 62);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(linea.vin, 22, 62);
    doc.setFontSize(7.5);
  }

  // Línea divisoria
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(5, 66, 95, 66);

  // Bloque Central del Repuesto
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(5, 69, 90, 36, 2, 2, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CÓDIGO DE PARTE CHANGAN:', 8, 74);

  doc.setTextColor(14, 116, 144); // Cyan 700
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(linea.codigoRepuesto, 8, 81);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const splitDesc = doc.splitTextToSize(linea.descripcionOficial || 'Repuesto Original Changan', 84);
  doc.text(splitDesc, 8, 87);

  doc.setTextColor(185, 28, 28);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`CANTIDAD: ${linea.cantidadSolicitada} UNID.`, 8, 101);

  // Ubicación y Almacenamiento en CEDIS
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(5, 108, 90, 16, 2, 2, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.rect(5, 108, 90, 16, 'S');

  doc.setTextColor(153, 27, 27);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('UBICACIÓN EN BODEGA CEDIS:', 8, 113);

  doc.setFontSize(10);
  doc.text(linea.ubicacionCedis || 'CEDIS-A1 (General)', 8, 119);

  if (linea.palletAsignado) {
    doc.setFontSize(7);
    doc.text(`Pallet: ${linea.palletAsignado}`, 55, 119);
  }

  // Código de Barras Simulado
  doc.setFillColor(30, 41, 59);
  const startX = 14;
  const barcodeY = 127;
  const barcodeHeight = 11;
  const bars = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4];
  let curX = startX;
  for (let i = 0; i < bars.length; i++) {
    const w = bars[i] * 0.7;
    if (i % 2 === 0) {
      doc.rect(curX, barcodeY, w, barcodeHeight, 'F');
    }
    curX += w + 0.8;
  }

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`*${linea.pedidoId}-${linea.codigoRepuesto}*`, 50, 142, { align: 'center' });

  return doc;
}

/**
 * 2. ACTA OFICIAL DE RETIRO EN MOSTRADOR CEDIS (Formato A4)
 * Para cuando la sucursal viene a retirar sus pedidos directamente al CEDIS
 */
export function generarActaRetiroCedisPDF(datos: DatosRetiroCedis): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Encabezado
  doc.setFillColor(185, 28, 28);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CHANGAN MOTORS PANAMÁ - CEDIS CENTRAL', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Acta Oficial de Entrega y Retiro de Repuestos en Mostrador de Bodega Central', 14, 18);

  // Recuadro de Número de Acta
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(140, 6, 56, 14, 2, 2, 'F');
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ACTA DE RETIRO EN CEDIS', 142, 11);
  doc.setFontSize(10);
  doc.text(datos.numeroActa, 142, 16);

  // Datos Generales
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA ENTREGA EN MOSTRADOR CEDIS', 14, 33);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 35, 196, 35);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 32, 2, 2, 'F');
  doc.rect(14, 38, 182, 32, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Lugar de Retiro:', 18, 44);
  doc.text('Sucursal Receptora:', 18, 51);
  doc.text('Fecha y Hora:', 18, 58);

  doc.setFont('helvetica', 'normal');
  doc.text('Mostrador Central CEDIS Changan Panamá', 52, 44);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`Sucursal ${datos.sucursalDestino}`, 52, 51);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.fecha, 52, 58);

  doc.setFont('helvetica', 'bold');
  doc.text('Personal que Retira:', 115, 44);
  doc.text('Cédula / Documento:', 115, 51);
  doc.text('Entregado por (CEDIS):', 115, 58);

  doc.setFont('helvetica', 'bold');
  doc.text(datos.personaQueRetira || 'Personal de Sucursal', 152, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.cedulaPersona || 'N/A', 152, 51);
  doc.text(datos.entregadorCedis || 'Bodeguero CEDIS', 152, 58);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Modalidad: Retiro directo en mostrador CEDIS (Sin flete/camión externo).', 18, 66);

  // Tabla de Piezas
  const tableData = datos.lineas.map((linea, index) => [
    (index + 1).toString(),
    linea.pedidoId || 'N/A',
    linea.codigoRepuesto,
    linea.descripcionOficial || 'Repuesto Changan',
    linea.numeroOR || 'Stock',
    linea.cliente || 'Taller',
    linea.modeloChangan || 'General',
    `${linea.cantidadSolicitada} un.`,
    linea.ubicacionCedis || 'CEDIS',
  ]);

  autoTable(doc, {
    startY: 74,
    head: [[
      '#',
      'No. Pedido',
      'Código Parte',
      'Descripción Oficial',
      'No. OR',
      'Cliente',
      'Modelo',
      'Cant.',
      'Ubicación CEDIS'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 25, fontStyle: 'bold', textColor: [14, 116, 144] },
      3: { cellWidth: 38 },
      4: { cellWidth: 18 },
      5: { cellWidth: 26 },
      6: { cellWidth: 20 },
      7: { cellWidth: 13, halign: 'center', fontStyle: 'bold', textColor: [185, 28, 28] },
      8: { cellWidth: 15, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 170;
  const totalPiezas = datos.lineas.reduce((acc, l) => acc + (Number(l.cantidadSolicitada) || 1), 0);

  // Observaciones
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY, 182, 16, 2, 2, 'F');
  doc.rect(14, finalY, 182, 16, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Total Piezas Entregadas: ${totalPiezas} unidades`, 18, finalY + 6);
  doc.text(`Estado: RETIRADO EN MOSTRADOR`, 130, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `Observaciones: ${datos.observaciones || 'Mercancía revisada físicamente por la persona que retira antes de salir del CEDIS.'}`,
    18,
    finalY + 12
  );

  // Firmas de Entrega y Retiro
  const signY = Math.min(finalY + 28, 245);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FIRMAS DE CONFORMIDAD DE ENTREGA Y RETIRO', 14, signY - 4);
  doc.line(14, signY - 2, 196, signY - 2);

  // Firma 1: Entrega CEDIS
  doc.line(25, signY + 24, 85, signY + 24);
  doc.setFontSize(7.5);
  doc.text('Entregado por (Bodega Central CEDIS)', 28, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(datos.entregadorCedis || 'Bodeguero / Despachador', 28, signY + 32);

  // Firma 2: Retira Sucursal
  doc.line(125, signY + 24, 185, signY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Recibido Conforme (Personal Sucursal)', 128, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${datos.personaQueRetira || 'Nombre'} - Céd: ${datos.cedulaPersona || 'N/A'}`, 128, signY + 32);

  // Pie de página
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'CEDIS Changan Panamá - Acta de entrega y retiro físico de repuestos especiales.',
    14,
    288
  );
  doc.text(`Generado el: ${new Date().toLocaleString('es-PA')}`, 155, 288);

  return doc;
}

/**
 * Descarga la etiqueta 4x6" en PDF
 */
export function descargarEtiquetaPedido(linea: FilaRastreador): void {
  const doc = generarEtiquetaPedidoEspecialPDF(linea);
  const nombre = `ETIQUETA_${linea.pedidoId}_${linea.codigoRepuesto}.pdf`;
  doc.save(nombre);
}

/**
 * Descarga etiquetas en lote (un PDF con una página por repuesto)
 */
export function descargarEtiquetasEnLote(lineas: FilaRastreador[]): void {
  if (lineas.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
  });

  lineas.forEach((linea, index) => {
    if (index > 0) {
      doc.addPage([100, 150], 'portrait');
    }

    // Dibujar etiqueta en la página actual
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(2, 2, 96, 146);

    doc.setFillColor(185, 28, 28);
    doc.rect(3, 3, 94, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CHANGAN MOTORS PANAMÁ', 50, 9, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('CEDIS CENTRAL - PEDIDO ESPECIAL', 50, 14, { align: 'center' });

    doc.setFillColor(248, 250, 252);
    doc.rect(3, 20, 94, 18, 'F');
    doc.setDrawColor(185, 28, 28);
    doc.setLineWidth(0.8);
    doc.rect(5, 22, 90, 14);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SUCURSAL DESTINO / RETIRO:', 50, 25.5, { align: 'center' });

    doc.setTextColor(185, 28, 28);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(linea.sucursal.toUpperCase(), 50, 32, { align: 'center' });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('FOLIO:', 6, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(linea.pedidoId, 22, 44);

    doc.setFont('helvetica', 'bold');
    doc.text('NO. OR:', 55, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(linea.numeroOR || 'Stock / N/A', 70, 44);

    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 6, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(linea.cliente || 'Taller Sucursal', 22, 50);

    doc.setFont('helvetica', 'bold');
    doc.text('ASESOR:', 6, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(linea.colaborador || 'Asesor Repuestos', 22, 56);

    doc.setDrawColor(226, 232, 240);
    doc.line(5, 66, 95, 66);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(5, 69, 90, 36, 2, 2, 'F');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CÓDIGO DE PARTE CHANGAN:', 8, 74);

    doc.setTextColor(14, 116, 144);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(linea.codigoRepuesto, 8, 81);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(linea.descripcionOficial || 'Repuesto Original Changan', 84);
    doc.text(splitDesc, 8, 87);

    doc.setTextColor(185, 28, 28);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`CANTIDAD: ${linea.cantidadSolicitada} UNID.`, 8, 101);

    doc.setFillColor(254, 242, 242);
    doc.roundedRect(5, 108, 90, 16, 2, 2, 'F');
    doc.setDrawColor(254, 202, 202);
    doc.rect(5, 108, 90, 16, 'S');

    doc.setTextColor(153, 27, 27);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('UBICACIÓN EN BODEGA CEDIS:', 8, 113);

    doc.setFontSize(10);
    doc.text(linea.ubicacionCedis || 'CEDIS-A1 (General)', 8, 119);

    if (linea.palletAsignado) {
      doc.setFontSize(7);
      doc.text(`Pallet: ${linea.palletAsignado}`, 55, 119);
    }
  });

  doc.save(`LOTE_ETIQUETAS_${lineas.length}_PIEZAS.pdf`);
}

/**
 * Descarga el Acta de Retiro en Mostrador CEDIS
 */
export function descargarActaRetiroCedis(datos: DatosRetiroCedis): void {
  const doc = generarActaRetiroCedisPDF(datos);
  const nombre = `${datos.numeroActa}_${datos.sucursalDestino.replace(/\s+/g, '_')}.pdf`;
  doc.save(nombre);
}

/**
 * 4. MANIFIESTO OFICIAL DE CONTROL DE DESPACHOS FÍSICOS (AUDITORÍA & ARCHIVO CEDIS)
 * Documento consolidado tamaño A4/Carta para archivar en carpeta física de control
 */
export function generarManifiestoArchivoFisicoPDF(
  despachos: DespachoRegistro[],
  opciones?: { sucursal?: string; fechaInicio?: string; fechaFin?: string }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const fechaGeneracion = new Date().toLocaleString('es-PA');
  const sucursalTexto = opciones?.sucursal && opciones.sucursal !== 'TODAS'
    ? `Sucursal: ${opciones.sucursal}`
    : 'Todas las Sucursales de Panamá';

  // Encabezado Corporativo
  doc.setFillColor(185, 28, 28);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('CHANGAN MOTORS PANAMÁ - CENTRO CENTRAL DE DISTRIBUCIÓN (CEDIS)', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('MANIFIESTO OFICIAL DE CONTROL DE DESPACHOS Y RETIROS FÍSICOS // CARPETA DE AUDITORÍA', 14, 18);

  // Recuadro Resumen
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 28, 269, 14, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 28, 269, 14, 'S');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CRITERIO DE REPORTE:', 18, 34);
  doc.setFont('helvetica', 'normal');
  doc.text(sucursalTexto, 60, 34);

  doc.setFont('helvetica', 'bold');
  doc.text('FECHA DE EMISIÓN:', 18, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(fechaGeneracion, 60, 39);

  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DESPACHOS REGISTRADOS:', 180, 36);
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(11);
  doc.text(`${despachos.length} retiros`, 245, 36);

  // Preparar Filas para autoTable
  const bodyRows = despachos.map((d, idx) => {
    let repuestoDetalle = '';
    try {
      if (d.lineasJson) {
        const parsed = JSON.parse(d.lineasJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          repuestoDetalle = `${parsed[0].codigoRepuesto || ''} - ${parsed[0].descripcionOficial || ''}`;
        }
      }
    } catch {}
    if (!repuestoDetalle && d.observaciones) {
      repuestoDetalle = d.observaciones;
    }

    return [
      String(idx + 1),
      d.numeroGuia,
      d.fechaDespacho,
      d.pedidoId,
      d.sucursalDestino,
      repuestoDetalle || 'Repuestos de Mostrador',
      String(d.totalPiezas || 1),
      d.transportista || 'Personal Sucursal',
      '________________',
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [[
      '#',
      'No. Acta / Folio',
      'Fecha',
      'Pedido / OR',
      'Sucursal Retiro',
      'Repuesto / Detalle Oficial',
      'Cant.',
      'Personal que Retiró',
      'Firma Conforme',
    ]],
    body: bodyRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold', textColor: [185, 28, 28] },
      2: { cellWidth: 20 },
      3: { cellWidth: 26, fontStyle: 'bold' },
      4: { cellWidth: 28, fontStyle: 'bold' },
      5: { cellWidth: 68 },
      6: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 42 },
      8: { cellWidth: 30, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // Recuadros de Firma para Archivo de Auditoría
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 160;

  if (finalY < 185) {
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);

    // Box 1: Entregado por Bodega Central
    doc.roundedRect(14, finalY, 84, 24, 2, 2, 'F');
    doc.rect(14, finalY, 84, 24, 'S');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('ENTREGADO POR / BODEGA CENTRAL CEDIS', 17, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma y Sello:', 17, finalY + 20);

    // Box 2: Verificación de Seguridad
    doc.roundedRect(107, finalY, 84, 24, 2, 2, 'F');
    doc.rect(107, finalY, 84, 24, 'S');
    doc.setFont('helvetica', 'bold');
    doc.text('CONTROL DE SALIDA / GARITA DE SEGURIDAD', 110, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma y Sello:', 110, finalY + 20);

    // Box 3: Jefatura de Logística
    doc.roundedRect(199, finalY, 84, 24, 2, 2, 'F');
    doc.rect(199, finalY, 84, 24, 'S');
    doc.setFont('helvetica', 'bold');
    doc.text('APROBACIÓN / JEFATURA DE LOGÍSTICA CEDIS', 202, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma y Visto Bueno:', 202, finalY + 20);
  }

  return doc;
}

/**
 * Descarga el Manifiesto Físico Consolidado de Despachos
 */
export function descargarManifiestoArchivoFisico(
  despachos: DespachoRegistro[],
  opciones?: { sucursal?: string }
): void {
  const doc = generarManifiestoArchivoFisicoPDF(despachos, opciones);
  const fechaStr = new Date().toISOString().slice(0, 10);
  const sucStr = opciones?.sucursal && opciones.sucursal !== 'TODAS'
    ? `_${opciones.sucursal.replace(/\s+/g, '_')}`
    : '';
  doc.save(`MANIFIESTO_DESPACHOS_CEDIS_${fechaStr}${sucStr}.pdf`);
}

/**
 * 5. COMPROBANTE OFICIAL DE SALIDA FÍSICA INDIVIDUAL
 * Documento formal para entregar a la persona que retira con sello de salida
 */
export function generarComprobanteSalidaFisicaPDF(d: DespachoRegistro): jsPDF {
  let lineasRecuperadas: FilaRastreador[] = [];
  try {
    if (d.lineasJson) {
      lineasRecuperadas = JSON.parse(d.lineasJson);
    }
  } catch {
    lineasRecuperadas = [];
  }

  if (lineasRecuperadas.length === 0) {
    lineasRecuperadas = [
      {
        lineaId: d.id,
        pedidoId: d.pedidoId,
        codigoRepuesto: 'REPUESTO-CEDIS',
        descripcionOficial: d.observaciones || `Lote de ${d.totalPiezas} piezas`,
        cantidadSolicitada: d.totalPiezas,
        cantidadAsignada: d.totalPiezas,
        cantidadDespachada: d.totalPiezas,
        estatusLinea: 'Despachado',
        contenedorAsignado: '',
        palletAsignado: '',
        packageNo: '',
        ubicacionCedis: 'CEDIS',
        sucursal: d.sucursalDestino,
        colaborador: d.despachadorCedis,
        cliente: 'Taller / Sucursal',
        modeloChangan: 'Changan',
        numeroOR: 'OR-OFICIAL',
        vin: '',
      },
    ];
  }

  return generarActaRetiroCedisPDF({
    numeroActa: d.numeroGuia,
    fecha: d.fechaDespacho,
    sucursalDestino: d.sucursalDestino,
    personaQueRetira: d.transportista.replace('Retiro Mostrador:', '').trim() || 'Personal de Sucursal',
    cedulaPersona: 'Verificada en Mostrador',
    entregadorCedis: d.despachadorCedis,
    observaciones: d.observaciones,
    lineas: lineasRecuperadas,
  });
}

/**
 * Descarga el Comprobante de Salida Física Individual
 */
export function descargarComprobanteSalidaFisica(d: DespachoRegistro): void {
  const doc = generarComprobanteSalidaFisicaPDF(d);
  doc.save(`COMPROBANTE_SALIDA_${d.numeroGuia}.pdf`);
}

/** Alias para compatibilidad de importación */
export const descargarGuiaDespacho = descargarComprobanteSalidaFisica;

