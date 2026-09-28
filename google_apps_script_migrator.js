/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: MIGRACIÓN AUTOMÁTICA CEDIS CHANGAN A SUPABASE
 * ==============================================================================
 * Instrucciones:
 * 1. En tu Google Sheet ve a: Extensiones -> Apps Script
 * 2. Pega este código reemplazando todo lo que haya.
 * 3. Coloca tu SUPABASE_URL y tu SUPABASE_ANON_KEY abajo.
 * 4. Selecciona la función "migrarTodoASupabase" y dale a "Ejecutar".
 * ==============================================================================
 */

const SUPABASE_URL = "PEGA_AQUI_TU_SUPABASE_URL"; // Ejemplo: https://xyz.supabase.co
const SUPABASE_ANON_KEY = "PEGA_AQUI_TU_SUPABASE_ANON_KEY"; // La clave larga anon

/**
 * Función que crea un menú en la barra de Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Supabase Sync')
    .addItem('Subir Todo el Historial a Supabase', 'migrarTodoASupabase')
    .addToUi();
}

/**
 * Función principal de migración
 */
function migrarTodoASupabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (SUPABASE_URL.includes("PEGA_AQUI") || SUPABASE_ANON_KEY.includes("PEGA_AQUI")) {
    SpreadsheetApp.getUi().alert("⚠️ Por favor configura tu SUPABASE_URL y SUPABASE_ANON_KEY en las primeras líneas del código.");
    return;
  }

  Logger.log("Iniciando migración a Supabase...");

  // 1. Migrar Matriz_Central -> matriz_pedidos
  migrarMatrizCentral(ss);

  // 2. Migrar DPL_Manifiestos -> dpl_manifiestos
  migrarDPLManifiestos(ss);

  // 3. Migrar DPL_Detalle -> dpl_detalle
  migrarDPLDetalle(ss);

  // 4. Migrar BD_Encargados -> bd_encargados
  migrarBDEncargados(ss);

  SpreadsheetApp.getUi().alert("🎉 ¡Migración completada exitosamente! Todos los datos de tus pestañas están ahora en Supabase.");
}

/**
 * 1. Migra la pestaña Matriz_Central a la tabla matriz_pedidos
 */
function migrarMatrizCentral(ss) {
  const sheet = ss.getSheetByName('Matriz_Central');
  if (!sheet) {
    Logger.log("No se encontró la hoja Matriz_Central");
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const registros = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const pedidoId = String(row[0] || '').trim();
    if (!pedidoId) continue; // Saltar filas vacías

    const parseNum = (val) => {
      if (typeof val === 'number') return val;
      const clean = String(val || '').replace(/[^0-9.-]/g, '');
      return parseInt(clean, 10) || 0;
    };

    registros.push({
      pedido_id: pedidoId,
      tipo_pedido: String(row[1] || 'Taller Mecánico').trim(),
      fecha_creacion: String(row[2] || ''),
      sucursal: String(row[3] || '').trim(),
      colaborador: String(row[4] || '').trim(),
      cliente: String(row[5] || '').trim(),
      modelo_changan: String(row[6] || '').trim(),
      vin: String(row[7] || '').trim(),
      cotizacion_numero_or: String(row[8] || '').trim(),
      codigo_repuesto: String(row[9] || '').trim(),
      descripcion_oficial: String(row[10] || '').trim(),
      cantidad_solicitada: parseNum(row[11]),
      cantidad_asignada: parseNum(row[12]),
      cantidad_despachada: parseNum(row[13]),
      estatus_linea: String(row[14] || 'Pendiente').trim(),
      contenedor_asignado: String(row[15] || '').trim(),
      pallet_asignado: String(row[16] || '').trim(),
      package_no: String(row[17] || '').trim(),
      ubicacion_cedis: String(row[18] || '').trim()
    });
  }

  Logger.log(`Subiendo ${registros.length} filas de Matriz_Central a matriz_pedidos...`);
  enviarASupabase('matriz_pedidos', registros);
}

/**
 * 2. Migra la pestaña DPL_Manifiestos a la tabla dpl_manifiestos
 */
function migrarDPLManifiestos(ss) {
  const sheet = ss.getSheetByName('DPL_Manifiestos');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const registros = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const contenedorId = String(row[0] || '').trim();
    if (!contenedorId) continue;

    registros.push({
      contenedor_id: contenedorId,
      proveedor: String(row[1] || 'Changan China Parts').trim(),
      fecha_arribo: String(row[2] || ''),
      po_referencia: String(row[3] || '').trim(),
      tipo_transporte: String(row[4] || 'Marítimo 40HQ').trim(),
      total_piezas: parseInt(row[5], 10) || 0,
      skus_unicos: parseInt(row[6], 10) || 0,
      total_pallets: parseInt(row[7], 10) || 0,
      estado: String(row[8] || 'EN TRÁNSITO').trim(),
      creado_por: String(row[9] || 'Admin').trim(),
      creado_en: String(row[10] || ''),
      bl_referencia: String(row[11] || '').trim()
    });
  }

  Logger.log(`Subiendo ${registros.length} manifiestos a dpl_manifiestos...`);
  enviarASupabase('dpl_manifiestos', registros);
}

/**
 * 3. Migra la pestaña DPL_Detalle a la tabla dpl_detalle
 */
function migrarDPLDetalle(ss) {
  const sheet = ss.getSheetByName('DPL_Detalle');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const registros = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const inventarioId = String(row[0] || '').trim();
    if (!inventarioId) continue;

    registros.push({
      inventario_id: inventarioId,
      contenedor_id: String(row[1] || '').trim(),
      pallet_case_no: String(row[2] || '').trim(),
      package_no: String(row[3] || '').trim(),
      codigo_repuesto: String(row[4] || '').trim(),
      descripcion: String(row[5] || '').trim(),
      cantidad_total: parseInt(row[6], 10) || 0,
      cantidad_asignada: parseInt(row[7], 10) || 0,
      cantidad_despachada: parseInt(row[8], 10) || 0,
      saldo_disponible: parseInt(row[9], 10) || 0,
      ubicacion_cedis: String(row[10] || '').trim()
    });
  }

  Logger.log(`Subiendo ${registros.length} repuestos a dpl_detalle...`);
  enviarASupabase('dpl_detalle', registros);
}

/**
 * 4. Migra la pestaña BD_Encargados a la tabla bd_encargados
 */
function migrarBDEncargados(ss) {
  const sheet = ss.getSheetByName('BD_Encargados');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const registros = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nombre = String(row[1] || row[0] || '').trim();
    if (!nombre) continue;

    registros.push({
      nombre: nombre,
      sucursal: String(row[2] || '').trim(),
      departamento: String(row[3] || 'Taller / Mostrador').trim(),
      cargo: String(row[4] || 'Ejecutivo de Venta').trim(),
      telefono: String(row[5] || '').trim(),
      correo: String(row[6] || '').trim()
    });
  }

  Logger.log(`Subiendo ${registros.length} encargados a bd_encargados...`);
  enviarASupabase('bd_encargados', registros);
}

/**
 * Función auxiliar para enviar datos a Supabase en paquetes de 100 filas
 */
function enviarASupabase(tabla, items) {
  if (!items || items.length === 0) return;

  const BATCH_SIZE = 100;
  const endpoint = `${SUPABASE_URL}/rest/v1/${tabla}`;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    
    const options = {
      method: 'post',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify(batch),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(endpoint, options);
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      Logger.log(`✅ Lote ${i + 1}-${i + batch.length} enviado a ${tabla} con éxito.`);
    } else {
      Logger.log(`❌ Error enviando lote a ${tabla} (Código ${code}): ${response.getContentText()}`);
    }
  }
}
