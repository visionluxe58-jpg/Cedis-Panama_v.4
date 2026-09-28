/**
 * Cliente API - Comunicación con Google Apps Script Backend
 * Incluye modo demo para desarrollo
 */

import type { Asesor, FolioResponse, TransmisionResponse } from '../../domain/models/types';
import {
  isSupabaseConfigured,
  obtenerSiguienteFolioSupabase,
  guardarPedidoSupabase,
} from './supabaseClient';

const STORAGE_KEY = 'cedis_webapp_url';
const DEMO_MODE = !isSupabaseConfigured(); // Usa Supabase si está disponible, sino Demo

// ========== CONFIGURACIÓN ==========

export function getWebAppUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setWebAppUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url);
}

export function isConfigured(): boolean {
  return isSupabaseConfigured() || (!DEMO_MODE && getWebAppUrl().includes('script.google.com'));
}

// ========== DATOS DEMO ==========

const ASESORES_DEMO: Asesor[] = [
  { id: 1, nombre: 'Leidys Perez', sucursal: 'Villa Lucre', departamento: 'Mostrador', cargo: 'Ejecutiva de Venta', telefono: '6561-1360', correo: 'repuestos@changanpanama.com' },
  { id: 2, nombre: 'Edwin Blanco', sucursal: 'Villa Lucre', departamento: 'Chapistería', cargo: 'Ejecutivo de Venta', telefono: '6374-8911', correo: 'repuestos4@changanpanama.com' },
  { id: 3, nombre: 'Pedro Guerrel', sucursal: 'Villa Lucre', departamento: 'Taller Mecánico', cargo: 'Facturador', telefono: '6511-1363', correo: '' },
  { id: 4, nombre: 'Ulisses Urriola', sucursal: 'Tumba Muerto', departamento: 'Taller / Mostrador', cargo: 'Ejecutivo de Venta', telefono: '6979-9581', correo: 'repuestostm@changanpanama.com' },
  { id: 5, nombre: 'Edilson Uribe', sucursal: 'Calle 50', departamento: 'Taller / Mostrador', cargo: 'Ejecutivo de Venta', telefono: '6849-7262', correo: 'repuestoscalle50@changanpanama.com' },
  { id: 6, nombre: 'Arquimedes Jordan', sucursal: 'Costa Verde', departamento: 'Taller / Mostrador', cargo: 'Ejecutivo de Venta', telefono: '6378-4144', correo: 'repuestospanamaoeste@changanpanama.com' },
  { id: 7, nombre: 'Nivardo Gutierres', sucursal: 'Chiriquí', departamento: 'Taller / Mostrador', cargo: 'Ejecutivo de Venta', telefono: '6495-6069', correo: 'bodegachiriqui@changanpanama.com' },
  { id: 8, nombre: 'Juan Arrocha', sucursal: 'Costa Verde', departamento: 'Taller / Mostrador', cargo: 'Asistente de Bodega', telefono: '6027-0421', correo: 'bodegacostaverde@changanpanama.com' },
  { id: 9, nombre: 'Roberto Tibbet', sucursal: 'Chiriquí', departamento: 'Taller / Mostrador', cargo: 'Jefe de Bodega', telefono: '6157-3504', correo: '' }
];

let folioCounter = 100;

// ========== API CALLS ==========

export async function ping(): Promise<{ ok: boolean; ts: string }> {
  if (isSupabaseConfigured()) {
    return { ok: true, ts: new Date().toISOString() };
  }
  if (DEMO_MODE) {
    return { ok: true, ts: new Date().toISOString() };
  }
  try {
    const res = await fetch(`${getWebAppUrl()}?accion=ping`);
    return await res.json();
  } catch {
    return { ok: false, ts: '' };
  }
}

export async function getAsesores(): Promise<{ asesores?: Asesor[]; error?: string }> {
  if (DEMO_MODE || isSupabaseConfigured()) {
    await new Promise(r => setTimeout(r, 100));
    return { asesores: ASESORES_DEMO };
  }
  try {
    const res = await fetch(`${getWebAppUrl()}?accion=getAsesores`);
    return await res.json();
  } catch {
    return { error: 'Error de conexión' };
  }
}

export async function nuevoFolio(sucursal: string): Promise<FolioResponse> {
  if (isSupabaseConfigured()) {
    const folio = await obtenerSiguienteFolioSupabase(sucursal);
    return { folio, estado: 'BORRADOR' };
  }

  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    folioCounter++;
    const codigos: Record<string, string> = {
      'Villa Lucre': 'VL', 'Tumba Muerto': 'TM',
      'Calle 50': 'C50', 'Costa Verde': 'CV', 'Chiriquí': 'CH'
    };
    const codigo = codigos[sucursal] || 'GEN';
    return { folio: `PED-${codigo}-${folioCounter}`, estado: 'BORRADOR' };
  }

  try {
    const res = await fetch(`${getWebAppUrl()}?accion=nuevoFolio&sucursal=${encodeURIComponent(sucursal)}`);
    return await res.json();
  } catch {
    return { error: 'Error de conexión' };
  }
}

export async function transmitirPedido(payload: any): Promise<TransmisionResponse> {
  if (isSupabaseConfigured()) {
    const res = await guardarPedidoSupabase(payload);
    return {
      estado: res.ok ? 'TRANSMITIDO' : 'BORRADOR',
      folio: res.folio,
      timestamp: res.timestamp,
      error: res.error,
    };
  }

  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 1000));
    return {
      estado: 'TRANSMITIDO',
      folio: payload.folio,
      timestamp: new Date().toISOString()
    };
  }

  try {
    const res = await fetch(getWebAppUrl(), {
      method: 'POST',
      body: JSON.stringify({ accion: 'bulkUploadMatriz', ...payload })
    });
    return await res.json();
  } catch {
    return { error: 'Error de conexión' };
  }
}
