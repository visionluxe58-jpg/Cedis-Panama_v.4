/**
 * Generador de PDF para confirmación de pedidos
 * CEDIS Changan Panamá - Sistema de Pedidos Especiales
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LineaPedido } from '../../domain/models/types';

// Colores corporativos Changan
const COLORS = {
  blue: [0, 51, 102] as [number, number, number],
  blueLight: [230, 240, 255] as [number, number, number],
  blueAccent: [0, 102, 204] as [number, number, number],
  gold: [200, 164, 21] as [number, number, number],
  dark: [0, 26, 51] as [number, number, number],
  gray: [100, 100, 100] as [number, number, number],
  grayLight: [220, 220, 220] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export interface DatosPedidoPDF {
  numeroPedido: string;
  canal: string;
  sucursal: string;
  colaborador: string;
  cliente: string;
  modelo: string;
  vin: string;
  placa: string;
  noCotizacion: string;
  observaciones: string;
  lineas: LineaPedido[];
  timestamp: string;
}

export function generarPDFPedido(datos: DatosPedidoPDF): void {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let yPos = margin;
  const fecha = new Date(datos.timestamp);

  // ═══ HEADER ═══
  doc.setFillColor(...COLORS.blue);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 32, pageWidth, 1.5, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CEDIS CHANGAN PANAMA', margin, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Pedidos Especiales - Comprobante de Confirmacion', margin, 21);

  doc.setFontSize(8);
  doc.setTextColor(200, 220, 255);
  doc.text(`Emitido: ${fecha.toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth - margin, 14, { align: 'right' });
  doc.text(`Hora: ${fecha.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 21, { align: 'right' });

  yPos = 40;

  // ═══ TITULO ═══
  doc.setFillColor(...COLORS.blueLight);
  doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');
  doc.setTextColor(...COLORS.blue);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIRMACION DE PEDIDO ESPECIAL', pageWidth / 2, yPos + 9, { align: 'center' });

  yPos += 20;

  // ═══ NUMERO DE PEDIDO ═══
  doc.setFillColor(...COLORS.blueAccent);
  doc.roundedRect(margin, yPos, contentWidth, 16, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PEDIDO N.:', margin + 5, yPos + 10);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(datos.numeroPedido, margin + 40, yPos + 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO: TRANSMITIDO', pageWidth - margin - 5, yPos + 10, { align: 'right' });

  yPos += 22;

  // ═══ DATOS EN 2 COLUMNAS ═══
  const colWidth = contentWidth / 2 - 3;

  // Columna izquierda - Datos del Pedido
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, colWidth, 60, 2, 2, 'F');
  doc.setDrawColor(...COLORS.grayLight);
  doc.roundedRect(margin, yPos, colWidth, 60, 2, 2, 'S');

  doc.setFillColor(...COLORS.blue);
  doc.roundedRect(margin, yPos, colWidth, 8, 2, 2, 'F');
  doc.rect(margin, yPos + 4, colWidth, 4, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('  DATOS DEL PEDIDO', margin + 2, yPos + 6);

  let yLeft = yPos + 14;
  const leftX = margin + 4;
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  const leftFields = [
    ['Canal:', datos.canal],
    ['Sucursal:', datos.sucursal],
    ['Colaborador:', datos.colaborador],
    ['Fecha:', fecha.toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })],
    ['Cotizacion:', datos.noCotizacion || 'N/A'],
  ];

  leftFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray);
    doc.text(label, leftX, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(String(value), leftX + 28, yLeft);
    yLeft += 7.5;
  });

  // Columna derecha - Datos del Cliente/Vehiculo
  const rightX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, yPos, colWidth, 60, 2, 2, 'F');
  doc.setDrawColor(...COLORS.grayLight);
  doc.roundedRect(rightX, yPos, colWidth, 60, 2, 2, 'S');

  doc.setFillColor(...COLORS.blue);
  doc.roundedRect(rightX, yPos, colWidth, 8, 2, 2, 'F');
  doc.rect(rightX, yPos + 4, colWidth, 4, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('  DATOS DEL CLIENTE / VEHICULO', rightX + 2, yPos + 6);

  let yRight = yPos + 14;
  const rightXField = rightX + 4;
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);

  const rightFields = [
    ['Cliente:', datos.cliente],
    ['Modelo:', datos.modelo],
    ['VIN:', datos.vin],
    ['Placa:', datos.placa || 'N/A'],
    ['Lineas:', `${datos.lineas.length} repuesto(s)`],
    ['Unidades:', `${datos.lineas.reduce((sum, l) => sum + l.cantidad, 0)} unidad(es)`],
  ];

  rightFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray);
    doc.text(label, rightXField, yRight);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(String(value), rightXField + 28, yRight);
    yRight += 7.5;
  });

  yPos += 66;

  // ═══ TABLA DE REPUESTOS ═══
  doc.setTextColor(...COLORS.blue);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE REPUESTOS SOLICITADOS', margin, yPos);
  yPos += 3;

  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + 60, yPos);

  yPos += 3;

  const tableBody = datos.lineas.map((linea, idx) => {
    return [
      String(idx + 1),
      linea.codigoRepuesto,
      linea.descripcion,
      String(linea.cantidad),
      linea.motivo || '-',
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Codigo OEM', 'Descripcion', 'Cant.', 'Motivo']],
    body: tableBody,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: COLORS.grayLight,
      lineWidth: 0.2,
      textColor: COLORS.dark,
      overflow: 'linebreak',
      minCellHeight: 10,
    },
    headStyles: {
      fillColor: COLORS.blue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 35, fontStyle: 'bold', fontSize: 7 },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 15 },
      4: { cellWidth: 45 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 255],
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // ═══ RESUMEN / TOTAL ═══
  const totalUnidades = datos.lineas.reduce((sum, l) => sum + l.cantidad, 0);

  doc.setFillColor(...COLORS.blueLight);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
  doc.setDrawColor(...COLORS.blueAccent);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'S');

  doc.setTextColor(...COLORS.blue);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL DE LINEAS: ${datos.lineas.length}`, margin + 5, yPos + 7.5);
  doc.text(`TOTAL DE UNIDADES: ${totalUnidades}`, margin + contentWidth / 2, yPos + 7.5, { align: 'center' });
  doc.text(`PEDIDO N.: ${datos.numeroPedido}`, pageWidth - margin - 5, yPos + 7.5, { align: 'right' });

  yPos += 18;

  // ═══ FIRMAS ═══
  const firmaWidth = (contentWidth - 10) / 2;

  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos + 15, margin + firmaWidth, yPos + 15);
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma del Asesor', margin + firmaWidth / 2, yPos + 19, { align: 'center' });
  doc.setFontSize(6);
  doc.text(datos.colaborador, margin + firmaWidth / 2, yPos + 23, { align: 'center' });

  const firmaRightX = margin + firmaWidth + 10;
  doc.line(firmaRightX, yPos + 15, firmaRightX + firmaWidth, yPos + 15);
  doc.setFontSize(7);
  doc.text('Recibido por CEDIS', firmaRightX + firmaWidth / 2, yPos + 19, { align: 'center' });
  doc.setFontSize(6);
  doc.text('Fecha: ___/___/______', firmaRightX + firmaWidth / 2, yPos + 23, { align: 'center' });

  yPos += 30;

  // ═══ NOTA ARCHIVO FISICO ═══
  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'FD');

  doc.setTextColor(120, 90, 0);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('ARCHIVO FISICO:', margin + 4, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Guarde este documento en el folder correspondiente a la sucursal "${datos.sucursal}". Pedido N.: ${datos.numeroPedido}`, margin + 4, yPos + 10);

  yPos += 20;

  // ═══ FOOTER ═══
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.3);
  doc.line(margin, 270, pageWidth - margin, 270);

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('CEDIS Changan Panama - Sistema de Pedidos Especiales', margin, 275);
  doc.text(`Documento generado automaticamente - ${fecha.toLocaleString('es-PA')}`, margin, 279);
  doc.text(`Pedido N.: ${datos.numeroPedido} | Comprobante de confirmacion`, pageWidth - margin, 275, { align: 'right' });
  doc.text('Valido como respaldo fisico del pedido electronico', pageWidth - margin, 279, { align: 'right' });

  // ═══ GUARDAR ═══
  const nombreArchivo = `Pedido_${datos.numeroPedido}_${fecha.toISOString().slice(0, 10)}.pdf`;
  doc.save(nombreArchivo);
}
