/**
 * Modal para Importar Historial de Despachos (CSV / Excel)
 * CEDIS Changan Panamá
 * 
 * Sanitiza automáticamente fechas en formato JS (eliminando errores de "gmt-0500"),
 * limpia unidades de cantidad ("1 u." -> 1), y carga los registros a Supabase y caché local.
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  FileCheck,
  Building2,
  PackageCheck,
  Truck,
  ArrowRight,
} from 'lucide-react';
import type { DespachoRegistro } from '../../domain/models/types';
import { importarDespachosLoteSupabase } from '../../data/api/supabaseClient';

interface ModalImportarDespachosProps {
  isOpen: boolean;
  onClose: () => void;
  onImportacionExitosa: (despachosImportados: DespachoRegistro[]) => void;
}

// Limpia texto con posibles mojibakes
function limpiarTexto(val: any): string {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  str = str.replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú');
  str = str.replace(/Ã/g, 'Á').replace(/Ã‰/g, 'É').replace(/Ã/g, 'Í').replace(/Ã“/g, 'Ó').replace(/Ãš/g, 'Ú');
  str = str.replace(/Ã±/g, 'ñ').replace(/Ã‘/g, 'Ñ');
  return str.trim();
}

// Limpia cantidad numérica eliminando "u.", "unidades", etc.
function limpiarCantidad(val: any): number {
  if (typeof val === 'number' && !isNaN(val)) return Math.max(1, Math.round(val));
  const str = String(val || '');
  const match = str.match(/(\d+)/);
  return match ? Math.max(1, parseInt(match[1], 10)) : 1;
}

// Normaliza fechas en formato JavaScript "Sun Aug 30 2026 19:00:00 GMT-0500..." a formato estándar limpio
function normalizarFechaDespacho(val: any): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  const str = String(val).trim();
  
  // Si ya tiene formato YYYY-MM-DD o YYYY-MM-DD HH:mm
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 16);
  }

  // Intentar parsear fecha JS
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }
  } catch {}

  return str.slice(0, 25);
}

export const ModalImportarDespachos: React.FC<ModalImportarDespachosProps> = ({
  isOpen,
  onClose,
  onImportacionExitosa,
}) => {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [procesandoLectura, setProcesandoLectura] = useState(false);
  const [despachosParseados, setDespachosParseados] = useState<DespachoRegistro[]>([]);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);

  const [importandoASupabase, setImportandoASupabase] = useState(false);
  const [importacionFinalizada, setImportacionFinalizada] = useState(false);
  const [totalGuardados, setTotalGuardados] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Procesar archivo seleccionado
  const handleArchivoCambio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoSeleccionado(file);
    setErrorLectura(null);
    setProcesandoLectura(true);

    try {
      const esCSV = file.name.toLowerCase().endsWith('.csv');
      let workbook: XLSX.WorkBook;

      if (esCSV) {
        const text = await file.text();
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        const buffer = await file.arrayBuffer();
        workbook = XLSX.read(buffer, { type: 'array' });
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawData.length < 2) {
        setErrorLectura('El archivo no contiene suficientes filas de datos.');
        setProcesandoLectura(false);
        return;
      }

      // Identificar cabeceras
      const headers = rawData[0].map(h => limpiarTexto(h).toLowerCase());

      const getColIdx = (patterns: string[]): number => {
        return headers.findIndex(h => patterns.some(p => h.includes(p)));
      };

      const idxPedido = getColIdx(['id pedido', 'pedido', 'folio', 'orden']);
      const idxSucursal = getColIdx(['sucursal', 'destino']);
      const idxCliente = getColIdx(['cliente', 'aseguradora', 'taller']);
      const idxPallet = getColIdx(['pallet', 'contenedor']);
      const idxSku = getColIdx(['sku', 'repuesto', 'codigo', 'código', 'parte']);
      const idxDesc = getColIdx(['descripci', 'pieza', 'nombre']);
      const idxCant = getColIdx(['cantidad', 'piezas', 'cant']);
      const idxEstado = getColIdx(['estado', 'estatus']);
      const idxFechaDesp = getColIdx(['fecha/hora despacho', 'fecha despacho', 'fecha_despacho']);
      const idxFechaAsig = getColIdx(['fecha/hora asignaci', 'fecha asignaci']);
      const idxUsuario = getColIdx(['usuario', 'responsable', 'asesor', 'despachador']);
      const idxObs = getColIdx(['observaci', 'notas', 'comentario']);

      const listaDespachos: DespachoRegistro[] = [];

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        const pedidoId = idxPedido !== -1 ? limpiarTexto(row[idxPedido]) : `PED-HIST-${i}`;
        const sku = idxSku !== -1 ? limpiarTexto(row[idxSku]).toUpperCase() : '';
        const desc = idxDesc !== -1 ? limpiarTexto(row[idxDesc]) : '';
        const sucursal = idxSucursal !== -1 ? limpiarTexto(row[idxSucursal]) : 'Villa Lucre';
        const cliente = idxCliente !== -1 ? limpiarTexto(row[idxCliente]) : '';
        const palletCont = idxPallet !== -1 ? limpiarTexto(row[idxPallet]) : '';
        const cantidad = idxCant !== -1 ? limpiarCantidad(row[idxCant]) : 1;
        const estado = idxEstado !== -1 ? limpiarTexto(row[idxEstado]) : 'DESPACHADO';
        const usuario = idxUsuario !== -1 ? limpiarTexto(row[idxUsuario]) : 'CEDIS Central';
        const rawFechaDesp = idxFechaDesp !== -1 ? row[idxFechaDesp] : (idxFechaAsig !== -1 ? row[idxFechaAsig] : '');
        const fechaDespacho = normalizarFechaDespacho(rawFechaDesp);
        const obsRaw = idxObs !== -1 ? limpiarTexto(row[idxObs]) : '';

        // Si la fila no tiene pedido ni código, omitir
        if (!pedidoId && !sku) continue;

        const lineasJson = JSON.stringify([{
          codigoRepuesto: sku,
          descripcionOficial: desc,
          cantidadSolicitada: cantidad,
          cantidadDespachada: cantidad,
          estatusLinea: estado,
          cliente,
          sucursal,
          contenedorAsignado: palletCont,
        }]);

        const despachoItem: DespachoRegistro = {
          id: `DSP-${pedidoId}-${sku || i}`,
          numeroGuia: `ACTA-${pedidoId}`,
          pedidoId: pedidoId,
          sucursalDestino: sucursal || 'Villa Lucre',
          transportista: usuario || 'Retiro en Bodega CEDIS',
          placaVehiculo: 'RETIRO EN CEDIS',
          despachadorCedis: usuario || 'Bodega Central CEDIS',
          fechaDespacho: fechaDespacho || new Date().toISOString().slice(0, 10),
          totalPiezas: cantidad,
          totalLineas: 1,
          estadoEntrega: 'ENTREGADO',
          observaciones: `${sku ? sku + ' - ' + desc : 'Repuestos retirados'} | Cliente: ${cliente || 'N/A'}${palletCont ? ' | ' + palletCont : ''}${obsRaw ? ' | ' + obsRaw : ''}`,
          lineasJson: lineasJson,
        };

        listaDespachos.push(despachoItem);
      }

      if (listaDespachos.length === 0) {
        setErrorLectura('No se encontraron filas válidas de despachos en el archivo.');
      } else {
        setDespachosParseados(listaDespachos);
      }
    } catch (err: any) {
      console.error('Error al procesar archivo de despachos:', err);
      setErrorLectura(err.message || 'Error al interpretar el archivo de despachos.');
    } finally {
      setProcesandoLectura(false);
    }
  };

  // Enviar a Supabase y Caché
  const handleConfirmarImportacion = async () => {
    if (despachosParseados.length === 0) return;

    setImportandoASupabase(true);
    try {
      const res = await importarDespachosLoteSupabase(despachosParseados);
      setTotalGuardados(res.guardados);
      setImportacionFinalizada(true);
      onImportacionExitosa(despachosParseados);
    } catch (err: any) {
      console.error('Error al guardar despachos en Supabase:', err);
      setErrorLectura(err.message || 'Error al sincronizar con Supabase.');
    } finally {
      setImportandoASupabase(false);
    }
  };

  const handleReiniciar = () => {
    setArchivoSeleccionado(null);
    setDespachosParseados([]);
    setErrorLectura(null);
    setImportacionFinalizada(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[94vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Importar Historial de Despachos y Retiros
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  CSV / Excel
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sube el archivo de despachos oficiales. Las fechas y unidades de cantidad se sanitizan automáticamente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={importandoASupabase}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {errorLectura && (
            <div className="bg-rose-950/80 border border-rose-600/50 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorLectura}</span>
            </div>
          )}

          {!importacionFinalizada ? (
            <>
              {/* Selector de Archivo */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-slate-950/80 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleArchivoCambio}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {archivoSeleccionado ? archivoSeleccionado.name : 'Haz clic o arrastra el archivo de Despachos aquí'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatos soportados: <span className="text-slate-300 font-mono">.CSV, .XLSX, .XLS</span> (ej: Base de Datos Oficial - Despachos.csv)
                  </p>
                </div>
              </div>

              {procesandoLectura && (
                <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  <span className="text-xs font-semibold">Procesando y sanitizando fechas de despachos...</span>
                </div>
              )}

              {/* Vista Previa de Datos Parseados */}
              {despachosParseados.length > 0 && !procesandoLectura && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Vista Previa ({despachosParseados.length} registros listos)
                      </span>
                    </div>
                    <button
                      onClick={handleReiniciar}
                      className="text-[11px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
                    >
                      Cambiar archivo
                    </button>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Pedido</th>
                          <th className="py-2.5 px-3">Sucursal</th>
                          <th className="py-2.5 px-3">Detalle Repuesto</th>
                          <th className="py-2.5 px-3 text-center">Cant.</th>
                          <th className="py-2.5 px-3">Fecha Despacho</th>
                          <th className="py-2.5 px-3">Responsable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-medium">
                        {despachosParseados.slice(0, 15).map((d, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono font-bold text-emerald-400">{d.pedidoId}</td>
                            <td className="py-2 px-3 text-slate-300">{d.sucursalDestino}</td>
                            <td className="py-2 px-3 max-w-xs truncate text-slate-200" title={d.observaciones}>
                              {d.observaciones || 'Despachado'}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-white">{d.totalPiezas}</td>
                            <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">{d.fechaDespacho}</td>
                            <td className="py-2 px-3 text-slate-300 text-[11px]">{d.despachadorCedis}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {despachosParseados.length > 15 && (
                    <p className="text-[11px] text-center text-slate-500 italic">
                      ... y {despachosParseados.length - 15} registros más listos para guardar en Supabase.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Pantalla de Éxito */
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 text-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-white">
                ¡Historial de Despachos Importado con Éxito!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Se guardaron exitosamente <span className="font-bold text-emerald-400">{totalGuardados} registros</span> en Supabase y en la memoria local del sistema.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={importandoASupabase}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {importacionFinalizada ? 'Cerrar' : 'Cancelar'}
          </button>

          {!importacionFinalizada && despachosParseados.length > 0 && (
            <button
              onClick={handleConfirmarImportacion}
              disabled={importandoASupabase}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition"
            >
              {importandoASupabase ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Guardando en Supabase...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>Confirmar e Importar {despachosParseados.length} Despachos</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
