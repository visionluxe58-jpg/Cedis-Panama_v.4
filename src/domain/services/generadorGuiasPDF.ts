/**
 * Servicio Generador de Guías de Despacho y Conduces de Entrega en PDF
 * CEDIS Changan Panamá
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FilaRastreador } from '../models/types';

export interface DatosDespacho {
  numeroGuia: string;
  fecha: string;
  sucursalDestino: string;
  transportista: string;
  placaVehiculo: string;
  despachadorCedis: string;
  observaciones?: string;
  lineas: FilaRastreador[];
}

export function generarGuiaDespachoPDF(datos: DatosDespacho): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed = '#B91C1C'; // Red 700
  const darkSlate = '#1E293B';
  const lightGray = '#F1F5F9';

  // --- ENCABEZADO INSTITUCIONAL ---
  doc.setFillColor(185, 28, 28); // #B91C1C
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CHANGAN MOTORS PANAMÁ - CEDIS CENTRAL', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Centro de Distribución y Logística de Repuestos Originales | Red Nacional', 14, 18);

  // Folio de Guía en la esquina superior derecha
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(140, 6, 56, 14, 2, 2, 'F');
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GUÍA DE DESPACHO / CONDUCE', 142, 11);
  doc.setFontSize(10);
  doc.text(datos.numeroGuia, 142, 16);

  // --- INFORMACIÓN GENERAL DE TRASLADO ---
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA TRANSFERENCIA LOGÍSTICA', 14, 33);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 35, 196, 35);

  // Cuadro con datos clave
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 30, 2, 2, 'F');
  doc.rect(14, 38, 182, 30, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Origen:', 18, 44);
  doc.text('Destino:', 18, 51);
  doc.text('Fecha / Hora:', 18, 58);

  doc.setFont('helvetica', 'normal');
  doc.text('Bodega Central CEDIS Changan (Panamá)', 45, 44);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`Sucursal ${datos.sucursalDestino}`, 45, 51);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.fecha, 45, 58);

  doc.setFont('helvetica', 'bold');
  doc.text('Transportista / Chofer:', 110, 44);
  doc.text('Placa / Unidad:', 110, 51);
  doc.text('Despachado por (CEDIS):', 110, 58);

  doc.setFont('helvetica', 'normal');
  doc.text(datos.transportista || 'Transporte Interno CEDIS', 150, 44);
  doc.text(datos.placaVehiculo || 'CAMION-01', 150, 51);
  doc.text(datos.despachadorCedis || 'Administración CEDIS', 150, 58);

  // --- TABLA DE REPUESTOS DESPACHADOS ---
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
    startY: 72,
    head: [[
      '#',
      'No. Pedido',
      'Código Parte',
      'Descripción Oficial',
      'No. OR',
      'Cliente',
      'Modelo',
      'Cant.',
      'Ubicación'
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

  // Posición después de la tabla
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 160;

  // --- RESUMEN Y OBSERVACIONES ---
  const totalPiezas = datos.lineas.reduce((acc, l) => acc + (Number(l.cantidadSolicitada) || 1), 0);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY, 182, 16, 2, 2, 'F');
  doc.rect(14, finalY, 182, 16, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Total Líneas: ${datos.lineas.length}`, 18, finalY + 6);
  doc.text(`Total Piezas Despachadas: ${totalPiezas} unidades`, 75, finalY + 6);
  doc.text(`Estado Envío: EN TRÁNSITO A SUCURSAL`, 140, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `Observaciones: ${datos.observaciones || 'Mercancía inspeccionada y verificada contra pedido oficial en CEDIS Changan Panamá.'}`,
    18,
    finalY + 12
  );

  // --- SECCIÓN DE FIRMAS DE CONFORMIDAD ---
  const signY = Math.min(finalY + 28, 245);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FIRMAS DE CONTROL Y CONFORMIDAD', 14, signY - 4);
  doc.line(14, signY - 2, 196, signY - 2);

  // Firma 1: Despachador
  doc.line(18, signY + 22, 68, signY + 22);
  doc.setFontSize(7.5);
  doc.text('Despachado por (CEDIS Panamá)', 22, signY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(datos.despachadorCedis || 'Bodeguero / Jefe Almacén', 22, signY + 30);

  // Firma 2: Transportista
  doc.line(78, signY + 22, 128, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Transportista / Conductor', 84, signY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(datos.transportista || 'Conductor asignado', 84, signY + 30);

  // Firma 3: Receptor Sucursal
  doc.line(138, signY + 22, 188, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Recibido Conforme (Sucursal)', 143, signY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Firma, Sello y Fecha de Recepción', 143, signY + 30);

  // Pie de página institucional
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'CEDIS Changan Panamá - Documento interno oficial de control de inventario y transferencias inter-sucursales.',
    14,
    288
  );
  doc.text(`Generado el: ${new Date().toLocaleString('es-PA')}`, 155, 288);

  return doc;
}

export function descargarGuiaDespacho(datos: DatosDespacho): void {
  const doc = generarGuiaDespachoPDF(datos);
  const nombreArchivo = `${datos.numeroGuia}_${datos.sucursalDestino.replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}
