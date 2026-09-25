/**
 * Generador de PDF para confirmación de pedidos
 * CEDIS Changan Panamá - Sistema de Pedidos Especiales
 * Diseño minimalista y profesional
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let yPos = margin;
  const fecha = new Date(datos.timestamp);

  // ═══ HEADER MINIMALISTA ═══
  doc.setFillColor(...COLORS.blue);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CEDIS CHANGAN PANAMA', margin, 12);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Pedidos Especiales', margin, 18);
  
  doc.setFontSize(7);
  doc.text(`${fecha.toLocaleDateString('es-PA')} - ${fecha.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 15, { align: 'right' });

  yPos = 32;

  // ═══ NUMERO DE PEDIDO ═══
  doc.setFillColor(...COLORS.blueAccent);
  doc.roundedRect(margin, yPos, contentWidth, 12, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('PEDIDO N.:', margin + 4, yPos + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(datos.numeroPedido, margin + 30, yPos + 7);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO: TRANSMITIDO', pageWidth - margin - 4, yPos + 7, { align: 'right' });

  yPos += 18;

  // ═══ DATOS EN 2 COLUMNAS ═══
  const colWidth = contentWidth / 2 - 2;

  // Columna izquierda - Datos del Pedido
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, yPos, colWidth, 45, 1, 1, 'F');
  doc.setDrawColor(...COLORS.grayLight);
  doc.roundedRect(margin, yPos, colWidth, 45, 1, 1, 'S');

  doc.setFillColor(...COLORS.blue);
  doc.rect(margin, yPos, colWidth, 6, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PEDIDO', margin + 2, yPos + 4);

  let yLeft = yPos + 11;
  const leftX = margin + 3;
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);

  const leftFields = [
    ['Canal:', datos.canal],
    ['Sucursal:', datos.sucursal],
    ['Colaborador:', datos.colaborador],
    ['Fecha:', fecha.toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })],
    ['Cotizacion:', datos.noCotizacion || 'N/A'],
  ];

  leftFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, leftX, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(String(value), leftX + 22, yLeft);
    yLeft += 6;
  });

  // Columna derecha - Datos del Cliente/Vehiculo
  const rightX = margin + colWidth + 4;
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(rightX, yPos, colWidth, 45, 1, 1, 'F');
  doc.setDrawColor(...COLORS.grayLight);
  doc.roundedRect(rightX, yPos, colWidth, 45, 1, 1, 'S');

  doc.setFillColor(...COLORS.blue);
  doc.rect(rightX, yPos, colWidth, 6, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', rightX + 2, yPos + 4);

  let yRight = yPos + 11;
  const rightXField = rightX + 3;
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
    doc.text(label, rightXField, yRight);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(String(value), rightXField + 22, yRight);
    yRight += 6;
  });

  yPos += 50;

  // ═══ TABLA DE REPUESTOS ═══
  doc.setTextColor(...COLORS.blue);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE REPUESTOS', margin, yPos);
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
      fontSize: 7,
      cellPadding: 2,
      lineColor: COLORS.grayLight,
      lineWidth: 0.2,
      textColor: COLORS.dark,
      overflow: 'linebreak',
      minCellHeight: 8,
    },
    headStyles: {
      fillColor: COLORS.blue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 30, fontStyle: 'bold', fontSize: 6 },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 12 },
      4: { cellWidth: 40 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 255],
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 6;

  // ═══ RESUMEN / TOTAL ═══
  const totalUnidades = datos.lineas.reduce((sum, l) => sum + l.cantidad, 0);

  doc.setFillColor(...COLORS.blueLight);
  doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, 'F');
  doc.setDrawColor(...COLORS.blueAccent);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, 'S');

  doc.setTextColor(...COLORS.blue);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(`LINEAS: ${datos.lineas.length}`, margin + 3, yPos + 5);
  doc.text(`UNIDADES: ${totalUnidades}`, margin + contentWidth / 2, yPos + 5, { align: 'center' });
  doc.text(`PEDIDO: ${datos.numeroPedido}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });

  yPos += 14;

  // ═══ FIRMAS ═══
  const firmaWidth = (contentWidth - 8) / 2;

  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos + 12, margin + firmaWidth, yPos + 12);
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma del Asesor', margin + firmaWidth / 2, yPos + 15, { align: 'center' });
  doc.setFontSize(5);
  doc.text(datos.colaborador, margin + firmaWidth / 2, yPos + 18, { align: 'center' });

  const firmaRightX = margin + firmaWidth + 8;
  doc.line(firmaRightX, yPos + 12, firmaRightX + firmaWidth, yPos + 12);
  doc.setFontSize(6);
  doc.text('Recibido por CEDIS', firmaRightX + firmaWidth / 2, yPos + 15, { align: 'center' });
  doc.setFontSize(5);
  doc.text('Fecha: ___/___/______', firmaRightX + firmaWidth / 2, yPos + 18, { align: 'center' });

  yPos += 24;

  // ═══ OBSERVACIONES IMPORTANTES (COMPACTO) ═══
  doc.setFillColor(255, 250, 240);
  doc.setDrawColor(200, 150, 50);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 18, 1, 1, 'FD');

  doc.setTextColor(150, 100, 0);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVACIONES:', margin + 2, yPos + 4);

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 70, 0);
  
  doc.text('Tiempos de entrega: Via Aerea ~30 dias | Via Maritima ~90 dias', margin + 2, yPos + 9);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 0, 0);
  doc.text('CONFIDENCIAL: Documento de USO INTERNO. NO es legal. NO compartir con clientes.', margin + 2, yPos + 14);

  yPos += 22;

  // ═══ FOOTER ═══
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.2);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('CEDIS Changan Panama - Sistema de Pedidos Especiales', margin, pageHeight - 10);
  doc.text(`Generado: ${fecha.toLocaleString('es-PA')}`, margin, pageHeight - 6);
  doc.text(`Pedido: ${datos.numeroPedido}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  doc.text('Comprobante de confirmacion', pageWidth - margin, pageHeight - 6, { align: 'right' });

  // ═══ GUARDAR ═══
  const nombreArchivo = `Pedido_${datos.numeroPedido}_${fecha.toISOString().slice(0, 10)}.pdf`;
  doc.save(nombreArchivo);
}
