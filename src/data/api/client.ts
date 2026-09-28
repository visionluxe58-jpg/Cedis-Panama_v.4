/**
 * Cliente API - Comunicación con Base de Datos Local
 * Versión Beta v04.1 - Protección de Datos
 * 
 * Los datos se cargan manualmente desde Google Sheets y se guardan en localStorage.
 * No hay sincronización automática con Google Sheets.
 */

import type { Asesor, FolioResponse, TransmisionResponse } from '../../domain/models/types';
import { 
  obtenerAsesores, 
  obtenerPedidos, 
  agregarPedido 
} from '../../domain/services/importacionDatos';

const STORAGE_KEY = 'cedis_webapp_url';
const DEMO_MODE = false; // Beta v04.1 - Modo producción con datos locales

// ========== CONFIGURACIÓN ==========

export function getWebAppUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setWebAppUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url);
}

export function isConfigured(): boolean {
  // En Beta v04.1, siempre está configurado si hay datos en localStorage
  return obtenerAsesores().length > 0;
}

// ========== FIN DE DATOS DEMO ==========
// Los datos ahora se cargan desde localStorage mediante importacionDatos.ts

// ========== API CALLS (USANDO DATOS LOCALES) ==========

export async function ping(): Promise<{ ok: boolean; ts: string }> {
  // Siempre funciona porque usamos datos locales
  return { ok: true, ts: new Date().toISOString() };
}

export async function getAsesores(): Promise<{ asesores?: Asesor[]; error?: string }> {
  // Obtener asesores desde localStorage
  const asesores = obtenerAsesores();
  
  if (asesores.length === 0) {
    return { 
      error: 'No hay asesores importados. Por favor, importa datos desde Google Sheets en el Panel de Administración.' 
    };
  }
  
  return { asesores };
}

export async function nuevoFolio(sucursal: string): Promise<FolioResponse> {
  // Generar folio localmente
  await new Promise(r => setTimeout(r, 300)); // Simular delay
  
  // Obtener contador actual de localStorage
  const contadorKey = `cedis_folio_counter_${sucursal.replace(/\s+/g, '_')}`;
  let contador = parseInt(localStorage.getItem(contadorKey) || '0', 10);
  contador++;
  localStorage.setItem(contadorKey, contador.toString());
  
  const codigos: Record<string, string> = {
    'Villa Lucre': 'VL', 'Tumba Muerto': 'TM',
    'Calle 50': 'C50', 'Costa Verde': 'CV', 'Chiriquí': 'CH',
    'Chiriqui': 'CH'
  };
  const codigo = codigos[sucursal] || 'GEN';
  
  return { 
    folio: `PED-${codigo}-${contador.toString().padStart(3, '0')}`, 
    estado: 'BORRADOR' 
  };
}

export async function transmitirPedido(payload: any): Promise<TransmisionResponse> {
  // Guardar pedido en localStorage
  await new Promise(r => setTimeout(r, 500)); // Simular delay
  
  try {
    // Convertir payload a formato de pedido
    const pedido = {
      lineaId: `LIN-${Date.now()}`,
      pedidoId: payload.folio,
      codigoRepuesto: payload.lineas?.[0]?.codigoRepuesto || '',
      descripcionOficial: payload.lineas?.[0]?.descripcion || '',
      cantidadSolicitada: payload.lineas?.[0]?.cantidad || 1,
      cantidadAsignada: 0,
      cantidadDespachada: 0,
      estatusLinea: 'Pendiente',
      contenedorAsignado: '',
      palletAsignado: '',
      packageNo: '',
      ubicacionCedis: '',
      sucursal: payload.sucursal || '',
      colaborador: payload.colaborador || '',
      cliente: payload.cliente || '',
      modeloChangan: payload.modeloChangan || '',
      numeroOR: payload.noCotizacion || '',
      vin: payload.vin || ''
    };
    
    // Guardar en localStorage
    agregarPedido(pedido);
    
    return {
      estado: 'TRANSMITIDO',
      folio: payload.folio,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { 
      error: 'Error al guardar el pedido',
      folio: payload.folio
    };
  }
}
