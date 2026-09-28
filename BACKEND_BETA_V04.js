/**
 * CEDIS Changan Panamá - Backend Google Apps Script
 * Versión Beta v04 - Producción
 * 
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Abre tu Google Sheet
 * 2. Ve a Extensiones → Apps Script
 * 3. Copia y pega TODO este código
 * 4. Cambia SPREADSHEET_ID por el ID de tu hoja
 * 5. Ejecuta setupHojasAuxiliares() una vez
 * 6. Deploy → New deployment → Web app
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Copia la URL del Web App
 * 10. Pégala en la configuración de la app
 */

// ========== CONFIGURACIÓN ==========
const SPREADSHEET_ID = '1YcV3D-d9zk_oqmHrgG4blnC05ElejvYZ7RT47nrJqfM';

function getSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

const SHEET_MATRIZ = 'Matriz_Central';
const SHEET_FOLIOS = 'Folios_Index';
const SHEET_ENCARGADOS = 'BD_Encargados';
const SHEET_LOG_ERRORES = 'Log_Errores_Transmision';

// Columnas de Matriz_Central
const COL = {
  pedidoId: 1, tipoPedido: 2, fechaCreacion: 3, sucursal: 4, colaborador: 5,
  cliente: 6, modeloChangan: 7, vin: 8, noCotizacion: 9, codigoRepuesto: 10,
  descripcionOficial: 11, cantidadSolicitada: 12, cantidadAsignada: 13,
  estatusDetallado: 14, contenedorAsignado: 15, palletAsignado: 16,
  packageNo: 17, observaciones: 18, motivo: 19, folioEstado: 20
};

const CODIGOS_SUCURSAL = { 
  'Villa Lucre': 'VL', 
  'Tumba Muerto': 'TM', 
  'Calle 50': 'C50', 
  'Costa Verde': 'CV', 
  'Chiriquí': 'CH',
  'Chiriqui': 'CH'
};

// ========== ROUTER ==========
function doGet(e) {
  const accion = e.parameter.accion;
  try {
    if (accion === 'getAsesores') {
      return jsonOut(getAsesores());
    }
    if (accion === 'nuevoFolio') {
      return jsonOut(nuevoFolio(e.parameter.sucursal));
    }
    if (accion === 'ping') {
      return jsonOut({ ok: true, ts: new Date().toISOString() });
    }
    return jsonOut({ error: 'ACCION_DESCONOCIDA' });
  } catch (err) {
    return jsonOut({ error: 'INTERNAL_ERROR', detalle: String(err) });
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ error: 'VALIDATION_ERROR', detalle: 'Body inválido' });
  }
  const accion = body.accion;
  try {
    if (accion === 'verificarDuplicado') {
      return jsonOut(verificarDuplicado(body.oem, body.vin));
    }
    if (accion === 'bulkUploadMatriz') {
      return jsonOut(bulkUploadMatriz(body));
    }
    if (accion === 'reportarErrorVault') {
      return jsonOut(reportarErrorVault(body));
    }
    return jsonOut({ error: 'ACCION_DESCONOCIDA' });
  } catch (err) {
    return jsonOut({ error: 'INTERNAL_ERROR', detalle: String(err) });
  }
}

// ========== OBTENER ASESORES ==========
function getAsesores() {
  const sh = getSS().getSheetByName(SHEET_ENCARGADOS);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  
  const colNombre = headers.indexOf('Nombre del Encargado');
  const colSucursal = headers.indexOf('Sucursal');
  const colDepartamento = headers.indexOf('Departamento / Canal');
  const colCargo = headers.indexOf('Cargo / Rol Operativo');
  const colTelefono = headers.indexOf('Teléfono / WhatsApp');
  const colCorreo = headers.indexOf('Correo Electrónico');
  
  if (colNombre === -1 || colSucursal === -1) {
    return { error: 'ESTRUCTURA_INVALIDA', detalle: 'Columnas requeridas no encontradas en BD_Encargados' };
  }
  
  const asesores = [];
  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    if (fila[colNombre] && fila[colSucursal]) {
      asesores.push({
        id: i,
        nombre: String(fila[colNombre]).trim(),
        sucursal: String(fila[colSucursal]).trim(),
        departamento: colDepartamento !== -1 ? String(fila[colDepartamento] || '') : '',
        cargo: colCargo !== -1 ? String(fila[colCargo] || '') : '',
        telefono: colTelefono !== -1 ? String(fila[colTelefono] || '') : '',
        correo: colCorreo !== -1 ? String(fila[colCorreo] || '') : ''
      });
    }
  }
  
  return { asesores: asesores };
}

// ========== NUEVO FOLIO ==========
function nuevoFolio(sucursalNombre) {
  const codigo = CODIGOS_SUCURSAL[sucursalNombre] || 'GEN';
  const lock = LockService.getScriptLock();
  const consiguio = lock.tryLock(10000);
  if (!consiguio) return { error: 'LOCK_BUSY' };

  try {
    const props = PropertiesService.getScriptProperties();
    const key = 'FOLIO_COUNTER_' + codigo;
    let n = parseInt(props.getProperty(key) || '0', 10) + 1;
    props.setProperty(key, String(n));
    const folio = 'PED-' + codigo + '-' + String(n).padStart(3, '0');

    const sh = getSS().getSheetByName(SHEET_MATRIZ);
    const row = new Array(20).fill('');
    row[COL.pedidoId - 1] = folio;
    row[COL.fechaCreacion - 1] = new Date();
    row[COL.sucursal - 1] = sucursalNombre;
    row[COL.folioEstado - 1] = 'BORRADOR';
    sh.appendRow(row);

    const shFolios = getSS().getSheetByName(SHEET_FOLIOS);
    shFolios.appendRow([folio, sucursalNombre, new Date(), 'BORRADOR']);

    return { folio: folio, estado: 'BORRADOR' };
  } finally {
    lock.releaseLock();
  }
}

// ========== VERIFICAR DUPLICADO ==========
function verificarDuplicado(oem, vin) {
  const sh = getSS().getSheetByName(SHEET_MATRIZ);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    const filaOem = fila[COL.codigoRepuesto - 1];
    const filaVin = fila[COL.vin - 1];
    const estado = fila[COL.estatusDetallado - 1];
    if (filaOem === oem && filaVin === vin && estado !== 'Despachado' && estado !== 'Cancelado') {
      return { duplicado: true, folioExistente: fila[COL.pedidoId - 1] };
    }
  }
  return { duplicado: false };
}

// ========== TRANSMITIR PEDIDO ==========
function bulkUploadMatriz(payload) {
  const { folio, sucursal, tipoPedido, colaborador, cliente, modeloChangan,
          vin, noCotizacion, lineas } = payload;

  if (!folio || !lineas || !lineas.length) {
    return { error: 'VALIDATION_ERROR', detalle: 'Faltan datos obligatorios' };
  }

  const shFolios = getSS().getSheetByName(SHEET_FOLIOS);
  const folioIndexData = shFolios.getDataRange().getValues();
  for (let i = 1; i < folioIndexData.length; i++) {
    if (folioIndexData[i][0] === folio && folioIndexData[i][3] === 'TRANSMITIDO') {
      return { estado: 'TRANSMITIDO', folio: folio, timestamp: folioIndexData[i][2], idempotente: true };
    }
  }

  const lock = LockService.getScriptLock();
  const consiguio = lock.tryLock(10000);
  if (!consiguio) return { error: 'LOCK_BUSY' };

  try {
    const sh = getSS().getSheetByName(SHEET_MATRIZ);
    const data = sh.getDataRange().getValues();

    let filaBorradorIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][COL.pedidoId - 1] === folio && data[i][COL.folioEstado - 1] === 'BORRADOR') {
        filaBorradorIdx = i;
        break;
      }
    }
    if (filaBorradorIdx === -1) return { error: 'VALIDATION_ERROR', detalle: 'Folio no reservado previamente' };

    const timestamp = new Date();
    const filas = lineas.map(function (linea) {
      const fila = new Array(20).fill('');
      fila[COL.pedidoId - 1] = folio;
      fila[COL.tipoPedido - 1] = sanitize(tipoPedido || '');
      fila[COL.fechaCreacion - 1] = timestamp;
      fila[COL.sucursal - 1] = sucursal;
      fila[COL.colaborador - 1] = sanitize(colaborador || '');
      fila[COL.cliente - 1] = sanitize(cliente || '');
      fila[COL.modeloChangan - 1] = modeloChangan || '';
      fila[COL.vin - 1] = sanitize(vin || '');
      fila[COL.noCotizacion - 1] = sanitize(noCotizacion || '');
      fila[COL.codigoRepuesto - 1] = sanitize(linea.codigoRepuesto || '');
      fila[COL.descripcionOficial - 1] = sanitize(linea.descripcion || '');
      fila[COL.cantidadSolicitada - 1] = linea.cantidad || 1;
      fila[COL.cantidadAsignada - 1] = 0;
      fila[COL.estatusDetallado - 1] = 'Pendiente';
      fila[COL.motivo - 1] = sanitize(linea.motivo || '');
      fila[COL.folioEstado - 1] = 'TRANSMITIDO';
      return fila;
    });

    sh.getRange(filaBorradorIdx + 1, 1, 1, 20).setValues([filas[0]]);
    if (filas.length > 1) {
      sh.getRange(sh.getLastRow() + 1, 1, filas.length - 1, 20).setValues(filas.slice(1));
    }

    for (let i = 1; i < folioIndexData.length; i++) {
      if (folioIndexData[i][0] === folio) {
        shFolios.getRange(i + 1, 4).setValue('TRANSMITIDO');
        break;
      }
    }

    return { estado: 'TRANSMITIDO', folio: folio, timestamp: timestamp.toISOString() };
  } catch (err) {
    return { error: 'INTERNAL_ERROR', detalle: String(err) };
  } finally {
    lock.releaseLock();
  }
}

// ========== LOG DE ERRORES ==========
function reportarErrorVault(body) {
  const sh = getSS().getSheetByName(SHEET_LOG_ERRORES);
  sh.appendRow([body.folio || '', body.sucursal || '', new Date(), body.tipoError || '', body.detalle || '']);
  return { ok: true };
}

// ========== SANITIZACIÓN ==========
function sanitize(valor) {
  const s = String(valor);
  if (/^[=+\-@]/.test(s)) return "'" + s;
  return s;
}

// ========== HELPER ==========
function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ========== SETUP INICIAL ==========
function setupHojasAuxiliares() {
  const ss = getSS();
  if (!ss.getSheetByName(SHEET_FOLIOS)) {
    const sh = ss.insertSheet(SHEET_FOLIOS);
    sh.appendRow(['Folio', 'Sucursal', 'Timestamp', 'Estado']);
  }
  if (!ss.getSheetByName(SHEET_LOG_ERRORES)) {
    const sh = ss.insertSheet(SHEET_LOG_ERRORES);
    sh.appendRow(['Folio', 'Sucursal', 'Timestamp', 'TipoError', 'Detalle']);
  }
  Logger.log('Hojas auxiliares creadas exitosamente');
}
