/**
 * Servicio Generador de Documentos Oficiales en PDF:
 * 1. Etiquetas de Identificación para Pedidos Especiales (Formato 100x150mm / 4x6" para cajas/bultos)
 * 2. Comprobantes Oficiales de Entrega de Bodega y Traslados entre Sucursales (Sin camión, entrega presencial)
 * 3. Guías de Traslado y Transferencia
 * 
 * CEDIS Changan Panamá
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FilaRastreador, DespachoRegistro } from '../models/types';

export interface DatosRetiroCedis {
  numeroActa: string;
  numeroTraslado?: string; // Número de Traslado solicitado
  fecha: string;
  sucursalDestino: string;
  personaQueRetira: string;
  cedulaPersona: string;
  entregadorCedis: string; // Entregado por (Bodega)
  observaciones?: string;
  lineas: FilaRastreador[];
}

/**
 * Helper para extraer N° de Cotización y NO. OR de forma separada
 */
export function extraerCotizacionYOR(rawOR?: string): { cotizacion: string; noOR: string } {
  if (!rawOR) return { cotizacion: '-', noOR: '-' };
  const str = String(rawOR).trim();

  let cotizacion = '-';
  let noOR = '-';

  const cotMatch = str.match(/\bCOT(?:IZACION|IZACIÓN)?:?\s*([A-Za-z0-9\-_]+)/i);
  const otMatch = str.match(/\b(?:OT|OR|NO\.?\s*OR)[\s:\-_]+([A-Za-z0-9\-_]+)/i);

  if (cotMatch) cotizacion = cotMatch[1];
  if (otMatch) noOR = otMatch[1].startsWith('-') ? otMatch[1].slice(1) : otMatch[1];

  if (!cotMatch && !otMatch) {
    if (/^(?:OT|OR)[\-_]?[0-9]+/i.test(str)) {
      noOR = str;
    } else if (/^[0-9]{4,8}$/.test(str)) {
      cotizacion = str;
    } else {
      noOR = str;
    }
  }

  return { cotizacion, noOR };
}

/**
 * Dibuja una etiqueta individual siguiendo los lineamientos de Toyota Logistics
 * Formato 100% Blanco y Negro (B&W) para impresión térmica o láser en papel Carta.
 * Dimensiones: 95 mm de ancho x 62 mm de alto (hasta 8 por hoja 8 1/2 x 11).
 */
export function dibujarEtiquetaToyota(
  doc: jsPDF,
  x: number,
  y: number,
  linea: FilaRastreador
): void {
  const { cotizacion, noOR } = extraerCotizacionYOR(linea.numeroOR);
  const tieneUbicacionReal = Boolean(
    linea.ubicacionCedis &&
    linea.ubicacionCedis.trim() !== '' &&
    !linea.ubicacionCedis.toUpperCase().includes('GENERAL')
  );

  // 1. Marco Exterior Sólido (Toyota Standard)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.rect(x, y, 95, 62);

  // 2. Encabezado Invertido Negro
  doc.setFillColor(0, 0, 0);
  doc.rect(x, y, 95, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Changan Auto Panama', x + 3, y + 4.5);
  doc.setFontSize(6.5);
  doc.text('PEDIDO ESPECIAL - CEDIS', x + 92, y + 4.5, { align: 'right' });

  // 3. Recuadro Destino / Sucursal
  doc.setLineWidth(0.3);
  doc.rect(x, y + 6.5, 95, 8.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('DESTINO / SUCURSAL:', x + 2.5, y + 9.5);
  doc.setFontSize(11);
  doc.text((linea.sucursal || 'SUCURSAL').toUpperCase(), x + 2.5, y + 14);

  // 4. Bloque Metadatos: PEDIDO (antes folio), Cotización y No. OR
  doc.rect(x, y + 15, 42, 8.5);
  doc.setFontSize(5);
  doc.text('PEDIDO:', x + 2, y + 18);
  doc.setFontSize(9.5);
  doc.text(linea.pedidoId || 'PED-GEN', x + 2, y + 22.3);

  doc.rect(x + 42, y + 15, 53, 8.5);
  doc.setFontSize(6.5);
  doc.text(`N° COT: ${cotizacion}`, x + 44, y + 18.5);
  doc.text(`NO. OR: ${noOR}`, x + 44, y + 22.3);

  // 5. Bloque Central: Código de Parte OEM y Cantidad (Recuadro Grande Toyota)
  doc.rect(x, y + 23.5, 72, 15.5);
  doc.setFontSize(5.5);
  doc.text('PART NO. / CÓDIGO DE PARTE:', x + 2, y + 26.5);
  doc.setFontSize(11.5);
  doc.text(linea.codigoRepuesto || 'N/A', x + 2, y + 31.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const descLines = doc.splitTextToSize((linea.descripcionOficial || 'REPUESTO ORIGINAL CHANGAN').toUpperCase(), 68);
  doc.text(descLines.slice(0, 2), x + 2, y + 35);

  // Recuadro Cantidad (QTY)
  doc.setFont('helvetica', 'bold');
  doc.rect(x + 72, y + 23.5, 23, 15.5);
  doc.setFontSize(5.5);
  doc.text('CANT / QTY', x + 83.5, y + 27, { align: 'center' });
  doc.setFontSize(15);
  doc.text(String(linea.cantidadSolicitada || 1), x + 83.5, y + 35, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text('PIEZA(S)', x + 83.5, y + 38, { align: 'center' });

  // 6. Bloque Cliente y Ubicación / Pallet
  doc.rect(x, y + 39, 50, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('CLIENTE:', x + 2, y + 42.5);
  doc.setFontSize(6.5);
  const clienteText = doc.splitTextToSize((linea.cliente || 'TALLER / SUCURSAL').toUpperCase(), 46)[0];
  doc.text(clienteText, x + 2, y + 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text(`ASESOR: ${(linea.colaborador || '-').toUpperCase()}`, x + 2, y + 49.5);

  // Recuadro Ubicación en CEDIS o Número de Pallet si no tiene ubicación
  doc.rect(x + 50, y + 39, 45, 11);
  if (tieneUbicacionReal) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('UBICACIÓN BODEGA CEDIS:', x + 52, y + 42.5);
    doc.setFontSize(8.5);
    doc.text(linea.ubicacionCedis.toUpperCase(), x + 52, y + 46.5);
    if (linea.palletAsignado) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text(`PALLET: ${linea.palletAsignado}`, x + 52, y + 49.5);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('N° DE PALLET ASIGNADO:', x + 52, y + 42.5);
    const palletTexto = linea.palletAsignado || linea.contenedorAsignado || 'CEDIS / POR ASIGNAR';
    doc.setFontSize(7.5);
    doc.text(palletTexto.toUpperCase(), x + 52, y + 46.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    doc.text('(SIN UBICACIÓN FIJA EN CEDIS)', x + 52, y + 49.5);
  }

  // 7. Bloque Código de Barras B&W
  doc.rect(x, y + 50, 95, 12);
  doc.setFillColor(0, 0, 0);
  const barcodeY = y + 51.5;
  const barcodeH = 5.5;
  const bars = [1.2, 0.8, 2.0, 0.8, 1.0, 2.2, 0.8, 1.2, 0.8, 1.8, 1.0, 0.8, 2.2, 0.8, 1.2, 1.6, 0.8, 1.2, 0.8, 1.8, 1.0, 0.8, 2.2, 1.2, 0.8, 1.6, 0.8, 1.2, 2.0];
  let curX = x + 16;
  for (let i = 0; i < bars.length; i++) {
    const w = bars[i];
    if (i % 2 === 0) {
      doc.rect(curX, barcodeY, w, barcodeH, 'F');
    }
    curX += w + 0.6;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(0, 0, 0);
  doc.text(`*${linea.pedidoId}-${linea.codigoRepuesto}*`, x + 47.5, y + 60.5, { align: 'center' });
}

// Posiciones para cuadrícula de 8 etiquetas por hoja tamaño Carta (2 columnas x 4 filas)
const POSICIONES_8_POR_HOJA = [
  { x: 10, y: 9 },      // Col 1, Fila 1
  { x: 110.9, y: 9 },   // Col 2, Fila 1
  { x: 10, y: 75 },     // Col 1, Fila 2
  { x: 110.9, y: 75 },  // Col 2, Fila 2
  { x: 10, y: 141 },    // Col 1, Fila 3
  { x: 110.9, y: 141 }, // Col 2, Fila 3
  { x: 10, y: 207 },    // Col 1, Fila 4
  { x: 110.9, y: 207 }, // Col 2, Fila 4
];

/**
 * 1. ETIQUETAS OFICIALES TOYOTA B&W EN HOJA CARTA 8 1/2 X 11
 * Organiza hasta 8 etiquetas por hoja tamaño Carta sin desperdiciar papel.
 */
export function generarEtiquetasPedidosEspecialesPDF(lineas: FilaRastreador[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter', // 215.9 mm x 279.4 mm (8 1/2 x 11 pulgadas)
  });

  if (!lineas || lineas.length === 0) {
    return doc;
  }

  lineas.forEach((linea, index) => {
    const posicionEnHoja = index % 8;

    // Al llegar a la 9na, 17va, etc., agregar nueva hoja Carta
    if (index > 0 && posicionEnHoja === 0) {
      doc.addPage('letter', 'portrait');
    }

    const pos = POSICIONES_8_POR_HOJA[posicionEnHoja];
    dibujarEtiquetaToyota(doc, pos.x, pos.y, linea);
  });

  return doc;
}

/**
 * Alias retrocompatible para generar etiqueta individual en formato Carta
 */
export function generarEtiquetaPedidoEspecialPDF(linea: FilaRastreador): jsPDF {
  return generarEtiquetasPedidosEspecialesPDF([linea]);
}

/**
 * 2. COMPROBANTE OFICIAL DE ENTREGA DE BODEGA Y TRASLADO (Formato A4)
 * Registro directo de entrega desde bodega CEDIS para traslado entre sucursales (Sin camiones propios)
 */
export function generarActaRetiroCedisPDF(datos: DatosRetiroCedis): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Encabezado Corporativo
  doc.setFillColor(185, 28, 28);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CHANGAN AUTO PANAMA - CEDIS CENTRAL', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Comprobante Oficial de Entrega de Bodega y Traslado a Sucursales', 14, 18);

  // Recuadro de Número de Traslado / Comprobante
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(136, 6, 60, 14, 2, 2, 'F');
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('N° DE TRASLADO / COMPROBANTE', 138, 11);
  doc.setFontSize(9.5);
  doc.text(datos.numeroTraslado || datos.numeroActa, 138, 16);

  // Datos Generales de la Entrega y Traslado
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE ENTREGA DE BODEGA Y TRASLADO A SUCURSAL', 14, 33);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 35, 196, 35);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 32, 2, 2, 'F');
  doc.rect(14, 38, 182, 32, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Tipo de Movimiento:', 18, 44);
  doc.text('Sucursal Destino:', 18, 51);
  doc.text('Fecha y Hora:', 18, 58);

  doc.setFont('helvetica', 'normal');
  doc.text('Entrega interna de bodega y traslado entre sucursales', 52, 44);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`Sucursal ${datos.sucursalDestino}`, 52, 51);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.fecha, 52, 58);

  doc.setFont('helvetica', 'bold');
  doc.text('N° de Traslado:', 115, 44);
  doc.text('Entregado por (Bodega):', 115, 51);
  doc.text('Recibido por (Sucursal):', 115, 58);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(datos.numeroTraslado || datos.numeroActa, 152, 44);
  doc.setTextColor(30, 41, 59);
  doc.text(datos.entregadorCedis || 'Bodega Central CEDIS', 152, 51);
  doc.setFont('helvetica', 'normal');
  doc.text(`${datos.personaQueRetira || 'Personal de Sucursal'}${datos.cedulaPersona && datos.cedulaPersona !== 'N/A' ? ' (' + datos.cedulaPersona + ')' : ''}`, 152, 58);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Nota: Entrega directa de repuestos efectuada en bodega central para traslado a sucursal.', 18, 66);

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
  doc.text(`Estado: ENTREGADO EN BODEGA / EN TRASLADO`, 120, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `Observaciones: ${datos.observaciones || 'Mercancía verificada físicamente antes de salir de bodega CEDIS para su traslado.'}`,
    18,
    finalY + 12
  );

  // Firmas de Entrega de Bodega y Traslado
  const signY = Math.min(finalY + 28, 245);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FIRMAS DE CONFORMIDAD DE ENTREGA DE BODEGA Y TRASLADO', 14, signY - 4);
  doc.line(14, signY - 2, 196, signY - 2);

  // Firma 1: Entregado por (Bodega)
  doc.line(25, signY + 24, 85, signY + 24);
  doc.setFontSize(7.5);
  doc.text('Entregado por (Bodega Central CEDIS)', 28, signY + 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(datos.entregadorCedis || 'Personal de Bodega', 28, signY + 33);

  // Firma 2: Recibido por (Sucursal Receptora)
  doc.line(125, signY + 24, 185, signY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Recibido Conforme (Sucursal Receptora)', 128, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${datos.personaQueRetira || 'Personal de Sucursal'}${datos.cedulaPersona && datos.cedulaPersona !== 'N/A' ? ' - Céd: ' + datos.cedulaPersona : ''}`, 128, signY + 33);

  // Pie de página
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Changan Auto Panama - Comprobante oficial de entrega de bodega y traslado entre sucursales.',
    14,
    288
  );
  doc.text(`Generado el: ${new Date().toLocaleString('es-PA')}`, 155, 288);

  return doc;
}

/**
 * Descarga una etiqueta individual en formato estándar Carta (8 1/2 x 11)
 */
export function descargarEtiquetaPedido(linea: FilaRastreador): void {
  const doc = generarEtiquetasPedidosEspecialesPDF([linea]);
  const nombre = `ETIQUETA_${linea.pedidoId}_${linea.codigoRepuesto}.pdf`;
  doc.save(nombre);
}

/**
 * Descarga etiquetas en lote optimizadas en hojas tamaño Carta 8 1/2 x 11 (hasta 8 etiquetas por hoja)
 */
export function descargarEtiquetasEnLote(lineas: FilaRastreador[]): void {
  if (!lineas || lineas.length === 0) return;

  const doc = generarEtiquetasPedidosEspecialesPDF(lineas);
  doc.save(`ETIQUETAS_CHANGAN_CEDIS_${lineas.length}_PIEZAS.pdf`);
}

/**
 * Descarga el Comprobante Oficial de Entrega de Bodega y Traslado a Sucursales
 */
export function descargarActaRetiroCedis(datos: DatosRetiroCedis): void {
  const doc = generarActaRetiroCedisPDF(datos);
  const identificador = (datos.numeroTraslado || datos.numeroActa || 'TRASLADO').replace(/[\/\\]/g, '-');
  const nombre = `TRASLADO_${identificador}_${datos.sucursalDestino.replace(/\s+/g, '_')}.pdf`;
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
  doc.text('CHANGAN AUTO PANAMA - CENTRO CENTRAL DE DISTRIBUCIÓN (CEDIS)', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('MANIFIESTO OFICIAL DE CONTROL DE ENTREGAS DE BODEGA Y TRASLADOS // ARCHIVO DE AUDITORÍA', 14, 18);

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
  doc.text('TOTAL TRASLADOS REGISTRADOS:', 180, 36);
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(11);
  doc.text(`${despachos.length} entregas`, 245, 36);

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
      repuestoDetalle || 'Repuestos de Bodega',
      String(d.totalPiezas || 1),
      d.transportista || 'Personal Sucursal',
      '________________',
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [[
      '#',
      'No. Traslado / Acta',
      'Fecha',
      'Pedido / OR',
      'Sucursal Destino',
      'Repuesto / Detalle Oficial',
      'Cant.',
      'Personal Entrega / Recibe',
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
    numeroTraslado: d.numeroGuia,
    fecha: d.fechaDespacho,
    sucursalDestino: d.sucursalDestino,
    personaQueRetira: d.transportista.replace(/^.*Recibido:\s*/i, '').replace(/^.*Recibe:\s*/i, '').replace('Retiro Mostrador:', '').trim() || 'Personal de Sucursal',
    cedulaPersona: 'Verificada en Bodega',
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

