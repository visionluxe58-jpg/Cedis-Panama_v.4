/**
 * Servicio Inteligente de Importación de Backups de Pedidos
 * Procesa archivos Excel (.xlsx, .xls) o CSV con formatos personalizados
 * y los normaliza para CEDIS Changan Panamá
 */

import * as XLSX from 'xlsx';
import type { FilaRastreador } from '../models/types';

export interface FilaBackupProcesada extends FilaRastreador {
  fechaOriginal?: string;
  cotizacionOriginal?: string;
  otOriginal?: string;
  placaOriginal?: string;
  esValida: boolean;
  advertencias: string[];
}

export interface ResultadoImportacionBackup {
  totalFilasArchivo: number;
  filasValidas: FilaBackupProcesada[];
  filasDescartadas: number;
  duplicadosOmitidosCount: number;
  duplicadosDetalle: string[];
  pedidosUnicosCount: number;
  sucursalesInvolucradas: string[];
  resumenPorSucursal: Record<string, number>;
  advertenciasGlobales: string[];
}

// Prefijos oficiales de sucursales CEDIS
const SUCURSAL_PREFIX: Record<string, string> = {
  'Villa Lucre': 'VL',
  'Calle 50': 'C50',
  'Tumba Muerto': 'TM',
  'Costa Verde': 'CV',
  'Chiriquí': 'CH',
};

/**
 * Normaliza el nombre de la sucursal ante cualquier variación de tipeo
 */
export function normalizarSucursal(raw: string): string {
  if (!raw) return 'Bodega Central';
  const clean = raw.trim().toUpperCase().replace(/\s+/g, ' ');

  if (clean.includes('LUCRE') || clean === 'VL') return 'Villa Lucre';
  if (clean.includes('CALLE') || clean.includes('50') || clean === 'C50') return 'Calle 50';
  if (clean.includes('TUMBA') || clean.includes('MUERTO') || clean === 'TM') return 'Tumba Muerto';
  if (clean.includes('COSTA') || clean.includes('VERDE') || clean === 'CV') return 'Costa Verde';
  if (clean.includes('CHIRI') || clean.includes('DAVID') || clean === 'CH') return 'Chiriquí';

  return raw.trim();
}

/**
 * Normaliza nombres de asesores conocidos
 */
export function normalizarAsesor(raw: string): string {
  if (!raw) return 'Asesor Sucursal';
  const clean = raw.trim().toUpperCase().replace(/\s+/g, ' ');

  if (clean.includes('EDWIN') || clean.includes('BLANCO')) return 'Edwin Blanco';
  if (clean.includes('EDILSON') || clean.includes('URIBE')) return 'Edilson Uribe';
  if (clean.includes('ULISES') || clean.includes('BARRIA') || clean.includes('URRIOLA')) return 'Ulises Barría';
  if (clean.includes('ARQUIMEDES') || clean.includes('JORDAN')) return 'Arquímedes Jordán';
  if (clean.includes('NIVARDO') || clean.includes('GUTI')) return 'Nivardo Gutiérrez';
  if (clean.includes('LEIDYS') || clean.includes('PEREZ')) return 'Leidys Pérez';

  // Capitalizar cada palabra
  return raw
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, a => a.toUpperCase());
}

/**
 * Normaliza el modelo de vehículo Changan
 */
export function normalizarModeloChangan(raw: string): string {
  if (!raw) return 'Changan';
  const clean = raw.trim().toUpperCase();

  if (clean.includes('OSHAN') || clean.includes('X7')) return 'Oshan X7 Plus';
  if (clean.includes('DEEPAL') && clean.includes('G318')) return 'Deepal G318';
  if (clean.includes('DEEPAL') && clean.includes('S05')) return 'Deepal S05';
  if (clean.includes('UNI-K') || clean.includes('UNI K')) return 'UNI-K';
  if (clean.includes('UNI-T') || clean.includes('UNI T')) return 'UNI-T';
  if (clean.includes('CS55')) return 'CS55 Plus';
  if (clean.includes('CS35')) return 'CS35 Plus';
  if (clean.includes('CS15') || clean.includes('CS 15')) return 'CS15';
  if (clean.includes('CS75')) return 'CS75 Plus';
  if (clean.includes('ALSVIN') && clean.includes('PLUS')) return 'Alsvin Plus';
  if (clean.includes('ALSVIN')) return 'Alsvin';
  if (clean.includes('HUNTER')) return 'Hunter';
  if (clean.includes('CX70')) return 'CX70T';
  if (clean.includes('STAR')) return 'Star 5';
  if (clean.includes('M201')) return 'M201';

  return raw.trim();
}

/**
 * Normaliza fechas variadas (DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD o Excel serial o Date)
 */
export function normalizarFecha(raw: any): string {
  if (!raw) return new Date().toISOString().slice(0, 10);

  if (raw instanceof Date) {
    return raw.toISOString().slice(0, 10);
  }

  // Si viene como número serial de Excel (ej: 45544 o 46273.999)
  const numSerial = typeof raw === 'number' ? raw : (typeof raw === 'string' && !isNaN(Number(raw)) && Number(raw) > 30000 && Number(raw) < 70000 ? Number(raw) : null);
  if (numSerial !== null) {
    const date = new Date(Math.round((numSerial - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }

  const str = String(raw).trim().replace(/[-.]/g, '/');
  const parts = str.split('/');

  if (parts.length === 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);

    // Ajustar año de 2 dígitos (ej: 26 -> 2026)
    if (p3 < 100) p3 += 2000;
    // Si hubo un typo de año como 2036 en lugar de 2026
    if (p3 > 2030 && p3 < 2040) p3 = 2026;

    let dia = p1;
    let mes = p2;
    let anio = p3;

    // Si el primer número es > 12, definitivamente es día: DD/MM/YYYY
    if (p1 > 12) {
      dia = p1;
      mes = p2;
    } else if (p2 > 12) {
      // Si el segundo es > 12, es formato MM/DD/YYYY
      dia = p2;
      mes = p1;
    } else {
      // Por defecto en Panamá usamos DD/MM/YYYY
      dia = p1;
      mes = p2;
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${anio}-${pad(mes)}-${pad(dia)}`;
  }

  // Fallback a fecha de hoy
  return new Date().toISOString().slice(0, 10);
}

/**
 * Normaliza y repara texto con codificaciones mixtas o mojibake (ej: UTF-8 interpretado como Latin-1)
 */
export function limpiarTextoTolerante(str: any): string {
  if (!str) return '';
  return String(str)
    .replace(/Ã¡/g, 'a')
    .replace(/Ã©/g, 'e')
    .replace(/Ã­/g, 'i')
    .replace(/Ã³/g, 'o')
    .replace(/Ãº/g, 'u')
    .replace(/Ã±/g, 'n')
    .replace(/Ã/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Analiza una matriz cruda de datos (de Excel o CSV) y mapea las columnas
 */
export function procesarMatrizBackup(matrizCruda: any[][]): ResultadoImportacionBackup {
  if (!matrizCruda || matrizCruda.length < 2) {
    return {
      totalFilasArchivo: 0,
      filasValidas: [],
      filasDescartadas: 0,
      duplicadosOmitidosCount: 0,
      duplicadosDetalle: [],
      pedidosUnicosCount: 0,
      sucursalesInvolucradas: [],
      resumenPorSucursal: {},
      advertenciasGlobales: ['El archivo no contiene suficientes filas.'],
    };
  }

  // 1. Detectar índices de encabezados en la primera fila con tolerancia a mojibake y tildes
  const headerRow = matrizCruda[0].map((h: any) => limpiarTextoTolerante(h));

  const findCol = (keywords: string[]) => {
    return headerRow.findIndex(h => keywords.some(k => h.includes(limpiarTextoTolerante(k))));
  };

  const idxFecha = findCol(['fecha', 'date', 'dia']);
  const idxSucursal = findCol(['sucursal', 'taller', 'sede', 'agencia']);
  const idxAsesor = findCol(['asesor', 'responsable', 'colaborador', 'solicitante', 'mecanico']);
  const idxCliente = findCol(['cliente', 'propietario', 'aseguradora', 'nombre']);
  const idxPlaca = findCol(['placa', 'matricula', 'plate']);
  const idxModelo = findCol(['modelo', 'vehiculo', 'auto', 'linea']);
  const idxCotizacion = findCol(['cotizacion', 'cotiz', 'c.o.', 'c.o', 'co', 'presupuesto']);
  const idxOT = findCol(['ot', 'orden de trabajo', 'orden taller', 'caso taller', 'chapisteria']);
  let idxCodigo = findCol(['codigo oem', 'codigo', 'cod', 'oem', 'part number', 'partnumber', 'no. parte', 'no parte', 'item', 'referencia', 'parte', 'repuesto']);
  let idxDesc = findCol(['descripcion', 'descrip', 'desc', 'nombre repuesto', 'detalle', 'articulo', 'producto']);
  const idxCant = findCol(['cant. solicitada', 'cantidad solicitada', 'cant', 'cantidad', 'qty', 'unidades', 'piezas']);

  // Respaldo heurístico inteligente si los nombres de columna son completamente desconocidos:
  if (idxCodigo === -1 && matrizCruda.length > 1) {
    // Buscar la columna con códigos alfanuméricos tipo Changan (ej: F202F280503-0702-AA, S111F240101-0204, etc.)
    for (let c = 0; c < (matrizCruda[1]?.length || 0); c++) {
      const val = String(matrizCruda[1][c] || '').trim();
      if (/^[A-Z0-9]{3,}-[A-Z0-9-]{2,}/i.test(val) || (val.length >= 6 && /[A-Z]/.test(val) && /[0-9]/.test(val))) {
        idxCodigo = c;
        break;
      }
    }
  }

  if (idxDesc === -1 && matrizCruda.length > 1) {
    // Buscar columna de texto descriptivo que no sea la de código ni cliente
    for (let c = 0; c < (matrizCruda[1]?.length || 0); c++) {
      if (c === idxCodigo || c === idxCliente || c === idxAsesor) continue;
      const val = String(matrizCruda[1][c] || '').trim();
      if (val.length > 8 && /[a-z]/i.test(val) && !/^\d+$/.test(val)) {
        idxDesc = c;
        break;
      }
    }
  }

  const advertenciasGlobales: string[] = [];
  if (idxCodigo === -1) {
    advertenciasGlobales.push('No se detectó columna de "Código OEM / Part Number". Se intentará buscar por contenido.');
  }

  const filasValidas: FilaBackupProcesada[] = [];
  let filasDescartadas = 0;
  let duplicadosOmitidosCount = 0;
  const duplicadosDetalle: string[] = [];

  // Mapa para prevenir duplicidad estricta de cliente con el mismo código en la misma orden
  const mapaRepuestosVistos = new Map<string, FilaBackupProcesada>();

  // Mapa para contar líneas por pedido y asignar índices homogéneos
  const conteoLineasPorPedido = new Map<string, number>();

  for (let i = 1; i < matrizCruda.length; i++) {
    const row = matrizCruda[i];
    if (!row || row.length === 0) {
      filasDescartadas++;
      continue;
    }

    // Extraer campos crudos
    const rawFecha = idxFecha !== -1 ? row[idxFecha] : '';
    const rawSucursal = idxSucursal !== -1 ? String(row[idxSucursal] || '').trim() : '';
    const rawAsesor = idxAsesor !== -1 ? String(row[idxAsesor] || '').trim() : '';
    const rawCliente = idxCliente !== -1 ? String(row[idxCliente] || '').trim() : '';
    const rawPlaca = idxPlaca !== -1 ? String(row[idxPlaca] || '').trim().toUpperCase() : '';
    const rawModelo = idxModelo !== -1 ? String(row[idxModelo] || '').trim() : '';
    const rawCotizacion = idxCotizacion !== -1 ? String(row[idxCotizacion] || '').trim() : '';
    const rawOT = idxOT !== -1 ? String(row[idxOT] || '').trim() : '';
    let rawCodigo = idxCodigo !== -1 ? String(row[idxCodigo] || '').trim() : '';
    let rawDesc = idxDesc !== -1 ? String(row[idxDesc] || '').trim() : '';
    const rawCant = idxCant !== -1 ? row[idxCant] : 1;

    // Limpieza de comillas y formatos
    rawCodigo = rawCodigo.replace(/^["']|["']$/g, '').trim().toUpperCase();
    rawDesc = rawDesc.replace(/^["']|["']$/g, '').trim();

    // FILTRO DE FILAS VACÍAS O INVÁLIDAS:
    // Si no tiene código de repuesto y no tiene descripción, descartar (ej: filas vacías con solo fecha y asesor)
    if (!rawCodigo && !rawDesc) {
      filasDescartadas++;
      continue;
    }

    // Si no tiene código OEM pero tiene descripción, avisar
    const advertenciasFila: string[] = [];
    if (!rawCodigo) {
      advertenciasFila.push('Repuesto sin código OEM formal.');
      rawCodigo = `SIN-COD-${Date.now().toString().slice(-4)}`;
    }

    // Normalizaciones
    const sucursalNormalizada = normalizarSucursal(rawSucursal);
    const asesorNormalizado = normalizarAsesor(rawAsesor);
    const modeloNormalizado = normalizarModeloChangan(rawModelo);
    const fechaNormalizada = normalizarFecha(rawFecha);
    const cantNum = Math.max(1, parseInt(String(rawCant || '1').replace(/[^\d]/g, ''), 10) || 1);

    // Identificador de Pedido Unificado (Agrupación por Cotización o por OT)
    const prefixSuc = SUCURSAL_PREFIX[sucursalNormalizada] || 'CED';
    let pedidoId = '';

    if (rawCotizacion) {
      pedidoId = `PED-${prefixSuc}-${rawCotizacion}`;
    } else if (rawOT) {
      pedidoId = `PED-${prefixSuc}-${rawOT.replace(/[^\w-]/g, '')}`;
    } else if (rawPlaca) {
      pedidoId = `PED-${prefixSuc}-${rawPlaca}`;
    } else {
      pedidoId = `PED-${prefixSuc}-${fechaNormalizada.replace(/-/g, '')}-${i}`;
    }

    // PROTECCIÓN ESTRICTA CONTRA DUPLICIDAD:
    // Comprobar si este cliente ya tiene este mismo código de repuesto en esta cotización/orden
    const normalizarCadena = (s: string) => s.trim().toUpperCase().replace(/\s+/g, ' ');
    const codNorm = normalizarCadena(rawCodigo);
    const clienteNorm = normalizarCadena(rawCliente || 'CONSUMIDOR FINAL');
    const refOrdenNorm = normalizarCadena(rawCotizacion || rawOT || rawPlaca || pedidoId);

    const claveUnicaClienteRepuesto = `${clienteNorm}___${refOrdenNorm}___${codNorm}`;
    const clavePedidoCodigo = `${pedidoId.trim().toUpperCase()}___${codNorm}`;

    if (mapaRepuestosVistos.has(claveUnicaClienteRepuesto) || mapaRepuestosVistos.has(clavePedidoCodigo)) {
      duplicadosOmitidosCount++;
      const detalleDup = `${rawCliente || 'Cliente'} (Cotiz/OT: ${rawCotizacion || rawOT || 'S/N'}) - Código: ${rawCodigo}`;
      duplicadosDetalle.push(detalleDup);

      // Consolidar inteligentemente en la fila canónica existente sin duplicar la pieza
      const filaExistente = mapaRepuestosVistos.get(claveUnicaClienteRepuesto) || mapaRepuestosVistos.get(clavePedidoCodigo)!;
      if (rawDesc && (!filaExistente.descripcionOficial || rawDesc.length > filaExistente.descripcionOficial.length)) {
        filaExistente.descripcionOficial = rawDesc;
      }
      if (cantNum > filaExistente.cantidadSolicitada) {
        filaExistente.cantidadSolicitada = cantNum;
      }
      continue; // Evitar a toda costa duplicar la línea
    }

    const indexEnPedido = (conteoLineasPorPedido.get(pedidoId) || 0) + 1;
    conteoLineasPorPedido.set(pedidoId, indexEnPedido);

    const lineaId = `LIN-${pedidoId}-${indexEnPedido}`;

    // Construcción del campo cotización / OR combinado
    let cotizacionOR = '';
    if (rawCotizacion && rawOT) {
      cotizacionOR = `COT: ${rawCotizacion} | OT: ${rawOT}`;
    } else if (rawCotizacion) {
      cotizacionOR = `COT: ${rawCotizacion}`;
    } else if (rawOT) {
      cotizacionOR = `OT: ${rawOT}`;
    } else {
      cotizacionOR = `PED-${prefixSuc}`;
    }

    // VIN / Placa
    const vinFinal = rawPlaca ? `PLACA: ${rawPlaca}` : 'POR VERIFICAR';

    const nuevaFila: FilaBackupProcesada = {
      lineaId,
      pedidoId,
      codigoRepuesto: rawCodigo,
      descripcionOficial: rawDesc || 'Repuesto Original Changan',
      cantidadSolicitada: cantNum,
      cantidadAsignada: 0,
      cantidadDespachada: 0,
      estatusLinea: 'Pendiente',
      contenedorAsignado: '',
      palletAsignado: '',
      packageNo: '',
      ubicacionCedis: '',
      sucursal: sucursalNormalizada,
      colaborador: asesorNormalizado,
      cliente: rawCliente || 'Cliente Mostrador / Taller',
      modeloChangan: modeloNormalizado,
      numeroOR: cotizacionOR,
      vin: vinFinal,
      fechaOriginal: fechaNormalizada,
      cotizacionOriginal: rawCotizacion,
      otOriginal: rawOT,
      placaOriginal: rawPlaca,
      esValida: true,
      advertencias: advertenciasFila,
    };

    filasValidas.push(nuevaFila);
    mapaRepuestosVistos.set(claveUnicaClienteRepuesto, nuevaFila);
    mapaRepuestosVistos.set(clavePedidoCodigo, nuevaFila);
  }

  // Estadísticas globales
  const setSucursales = new Set<string>();
  const resumenPorSucursal: Record<string, number> = {};
  const setPedidos = new Set<string>();

  filasValidas.forEach(f => {
    setSucursales.add(f.sucursal);
    resumenPorSucursal[f.sucursal] = (resumenPorSucursal[f.sucursal] || 0) + 1;
    setPedidos.add(f.pedidoId);
  });

  if (duplicadosOmitidosCount > 0) {
    advertenciasGlobales.push(
      `🛡️ Protección anti-duplicados: Se detectaron y omitieron ${duplicadosOmitidosCount} filas repetidas con el mismo cliente y código.`
    );
  }

  return {
    totalFilasArchivo: matrizCruda.length - 1,
    filasValidas,
    filasDescartadas,
    duplicadosOmitidosCount,
    duplicadosDetalle,
    pedidosUnicosCount: setPedidos.size,
    sucursalesInvolucradas: Array.from(setSucursales),
    resumenPorSucursal,
    advertenciasGlobales,
  };
}

/**
 * Parsea un archivo Excel binario o texto CSV y retorna los datos procesados
 */
export async function parsearArchivoBackupExcel(file: File): Promise<ResultadoImportacionBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const esCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';

    reader.onload = e => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;

        if (esCSV && typeof data === 'string') {
          // Para archivos CSV, XLSX interpreta la cadena de texto UTF-8 directamente sin dañar acentos
          workbook = XLSX.read(data, { type: 'string' });
        } else if (data instanceof ArrayBuffer) {
          workbook = XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
        } else {
          workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        }

        // Tomar la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a matriz 2D
        const matriz = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as any[][];

        const resultado = procesarMatrizBackup(matriz);
        resolve(resultado);
      } catch (err) {
        console.error('Error parseando archivo Excel o CSV:', err);
        reject(err);
      }
    };

    reader.onerror = err => reject(err);

    if (esCSV) {
      // Lectura en UTF-8 nativo para preservar caracteres en español (Código, Descripción, Cotización)
      reader.readAsText(file, 'utf-8');
    } else {
      // ArrayBuffer para archivos binarios de Excel (.xlsx, .xls)
      reader.readAsArrayBuffer(file);
    }
  });
}

/**
 * Parsea texto pegado desde el portapapeles (CSV o tabulado de Excel)
 */
export function parsearTextoPegadoBackup(texto: string): ResultadoImportacionBackup {
  try {
    const workbook = XLSX.read(texto.trim(), { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    if (sheetName) {
      const sheet = workbook.Sheets[sheetName];
      const matriz = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false,
      }) as any[][];

      if (matriz && matriz.length > 1) {
        return procesarMatrizBackup(matriz);
      }
    }
  } catch (err) {
    console.warn('Fallo XLSX al parsear texto, usando parser CSV alternativo:', err);
  }

  const lineas = texto.trim().split(/\r?\n/);
  const matriz: any[][] = [];

  for (const l of lineas) {
    if (!l.trim()) continue;

    // Detectar si está separado por tabulador (copiado directo de Excel) o por comas (CSV)
    if (l.includes('\t')) {
      matriz.push(l.split('\t').map(c => c.trim()));
    } else {
      const matches = l.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      if (matches.length > 2) {
        matriz.push(matches.map(m => m.replace(/^"|"$/g, '').trim()));
      } else {
        matriz.push(l.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
      }
    }
  }

  return procesarMatrizBackup(matriz);
}

