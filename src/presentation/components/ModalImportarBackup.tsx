/**
 * Modal Inteligente de Importación de Backups de Pedidos
 * Permite cargar archivos Excel (.xlsx, .xls) o pegar datos directamente,
 * normaliza sucursales, agrupa pedidos y los inserta en Supabase.
 * CEDIS Changan Panamá
 */

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  FileCheck,
  Building2,
  PackageCheck,
  Boxes,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { FilaRastreador } from '../../domain/models/types';
import {
  parsearArchivoBackupExcel,
  parsearTextoPegadoBackup,
  ResultadoImportacionBackup,
  FilaBackupProcesada
} from '../../domain/services/importadorBackupPedidos';
import { importarFilasBackupSupabase } from '../../data/api/supabaseClient';

interface ModalImportarBackupProps {
  isOpen: boolean;
  onClose: () => void;
  onImportacionExitosa: (totalLineas: number, pedidosUnicos: number) => void;
}

export const ModalImportarBackup: React.FC<ModalImportarBackupProps> = ({
  isOpen,
  onClose,
  onImportacionExitosa,
}) => {
  const [modoEntrada, setModoEntrada] = useState<'archivo' | 'pegar'>('archivo');
  const [textoPegado, setTextoPegado] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);

  const [procesandoLectura, setProcesandoLectura] = useState(false);
  const [resultadoParseo, setResultadoParseo] = useState<ResultadoImportacionBackup | null>(null);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);

  const [importandoASupabase, setImportandoASupabase] = useState(false);
  const [progresoImportacion, setProgresoImportacion] = useState(0);
  const [importacionFinalizada, setImportacionFinalizada] = useState(false);
  const [resumenSupabase, setResumenSupabase] = useState<{
    totalInsertadas: number;
    totalExistentesOmitidas: number;
    totalDespachadosActualizados?: number;
    pedidosUnicos: number;
  } | null>(null);
  const [mostrarDetalleDuplicados, setMostrarDetalleDuplicados] = useState(false);

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
      const res = await parsearArchivoBackupExcel(file);
      setResultadoParseo(res);
    } catch (err: any) {
      console.error('Error al procesar archivo Excel:', err);
      setErrorLectura('No se pudo leer el archivo Excel. Asegúrate de que no esté protegido con contraseña.');
    } finally {
      setProcesandoLectura(false);
    }
  };

  // Procesar texto pegado
  const handleProcesarTextoPegado = () => {
    if (!textoPegado.trim()) {
      setErrorLectura('Pega los datos del backup en el cuadro de texto.');
      return;
    }

    setErrorLectura(null);
    setProcesandoLectura(true);

    try {
      const res = parsearTextoPegadoBackup(textoPegado);
      setResultadoParseo(res);
    } catch (err: any) {
      console.error('Error al procesar texto:', err);
      setErrorLectura('Error al interpretar las columnas del texto pegado.');
    } finally {
      setProcesandoLectura(false);
    }
  };

  // Ejecutar importación en lote hacia Supabase
  const handleConfirmarImportacion = async () => {
    if (!resultadoParseo || resultadoParseo.filasValidas.length === 0) return;

    setImportandoASupabase(true);
    setProgresoImportacion(0);

    try {
      const filasAInsertar: FilaRastreador[] = resultadoParseo.filasValidas.map(f => ({
        lineaId: f.lineaId,
        pedidoId: f.pedidoId,
        codigoRepuesto: f.codigoRepuesto,
        descripcionOficial: f.descripcionOficial,
        cantidadSolicitada: f.cantidadSolicitada,
        cantidadAsignada: f.cantidadAsignada,
        cantidadDespachada: f.cantidadDespachada,
        estatusLinea: f.estatusLinea,
        contenedorAsignado: f.contenedorAsignado,
        palletAsignado: f.palletAsignado,
        packageNo: f.packageNo,
        ubicacionCedis: f.ubicacionCedis,
        sucursal: f.sucursal,
        colaborador: f.colaborador,
        cliente: f.cliente,
        modeloChangan: f.modeloChangan,
        numeroOR: f.numeroOR,
        vin: f.vin,
      }));

      const res = await importarFilasBackupSupabase(filasAInsertar, p => {
        setProgresoImportacion(p);
      });

      if (res.ok) {
        setResumenSupabase({
          totalInsertadas: res.totalInsertadas,
          totalExistentesOmitidas: res.totalExistentesOmitidas,
          totalDespachadosActualizados: res.totalDespachadosActualizados,
          pedidosUnicos: res.pedidosUnicos,
        });
        setImportacionFinalizada(true);
        onImportacionExitosa(res.totalInsertadas, res.pedidosUnicos);
      } else {
        alert('Hubo un inconveniente al insertar las filas. Revisa la conexión con Supabase.');
      }
    } catch (err: any) {
      console.error('Error en importación a Supabase:', err);
      alert(`Error en importación: ${err.message || err}`);
    } finally {
      setImportandoASupabase(false);
    }
  };

  const handleCerrar = () => {
    setResultadoParseo(null);
    setArchivoSeleccionado(null);
    setTextoPegado('');
    setImportacionFinalizada(false);
    setResumenSupabase(null);
    setMostrarDetalleDuplicados(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>Importador Inteligente de Backups de Pedidos</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-mono font-bold">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sube tu archivo de respaldo antiguo: el sistema normaliza sucursales, agrupa por orden y guarda en Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={handleCerrar}
            disabled={importandoASupabase}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pantalla de Éxito al finalizar */}
        {importacionFinalizada ? (
          <div className="py-8 px-4 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white">¡Importación Exitosa a Supabase!</h3>
            <p className="text-sm text-slate-300 max-w-lg mx-auto">
              Se han registrado <strong className="text-emerald-400">{resumenSupabase?.totalInsertadas ?? resultadoParseo?.filasValidas.length} repuestos nuevos</strong> organizados en <strong className="text-cyan-300">{resultadoParseo?.pedidosUnicosCount} órdenes de pedido</strong> en la tabla oficial <code className="text-xs bg-slate-800 px-2 py-0.5 rounded">matriz_pedidos</code>.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-w-md mx-auto text-xs text-slate-400 text-left space-y-2">
              <div className="flex justify-between">
                <span>Piezas nuevas guardadas en Supabase:</span>
                <strong className="text-emerald-400 font-mono">{resumenSupabase?.totalInsertadas ?? resultadoParseo?.filasValidas.length} u.</strong>
              </div>
              {Number(resumenSupabase?.totalExistentesOmitidas) > 0 && (
                <div className="flex justify-between text-amber-300 font-medium">
                  <span>Piezas ya existentes (Prevenidas de duplicarse):</span>
                  <strong className="font-mono">{resumenSupabase?.totalExistentesOmitidas} u.</strong>
                </div>
              )}
              {Number(resumenSupabase?.totalDespachadosActualizados) > 0 && (
                <div className="flex justify-between text-teal-300 font-medium">
                  <span>Despachos sincronizados/actualizados:</span>
                  <strong className="font-mono">{resumenSupabase?.totalDespachadosActualizados} u.</strong>
                </div>
              )}
              {Number(resultadoParseo?.duplicadosOmitidosCount) > 0 && (
                <div className="flex justify-between text-purple-300 font-medium">
                  <span>Duplicados en archivo consolidados:</span>
                  <strong className="font-mono">{resultadoParseo?.duplicadosOmitidosCount} líneas</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span>Pedidos agrupados:</span>
                <strong className="text-cyan-400">{resultadoParseo?.pedidosUnicosCount} órdenes</strong>
              </div>
              <div className="flex justify-between">
                <span>Sucursales impactadas:</span>
                <strong className="text-slate-200">{resultadoParseo?.sucursalesInvolucradas.join(', ')}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 text-emerald-300 font-semibold">
                <span>Estatus inicial:</span>
                <span>Pendiente (Listos para Matching FIFO)</span>
              </div>
            </div>

            <button
              onClick={handleCerrar}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 cursor-pointer transition"
            >
              Listo / Ver en Gestión de Pedidos &rarr;
            </button>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Selector de Modo de Entrada */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => {
                  setModoEntrada('archivo');
                  setResultadoParseo(null);
                  setErrorLectura(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  modoEntrada === 'archivo'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Archivo Excel / CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModoEntrada('pegar');
                  setResultadoParseo(null);
                  setErrorLectura(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  modoEntrada === 'pegar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Pegar Datos (Copiar de Excel)</span>
              </button>
            </div>

            {/* Zona 1: Subir Archivo Excel */}
            {modoEntrada === 'archivo' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleArchivoCambio}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white">
                  {archivoSeleccionado ? archivoSeleccionado.name : 'Haz clic aquí o arrastra tu archivo Excel / CSV de backup'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Formatos soportados: <code className="text-emerald-300">.xlsx</code>, <code className="text-emerald-300">.xls</code>, <code className="text-emerald-300">.csv</code>
                </p>
              </div>
            )}

            {/* Zona 2: Pegar Texto */}
            {modoEntrada === 'pegar' && (
              <div className="space-y-2">
                <textarea
                  value={textoPegado}
                  onChange={e => setTextoPegado(e.target.value)}
                  placeholder="Pega aquí las filas copiadas de tu Excel o CSV (incluyendo la fila de encabezados)..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleProcesarTextoPegado}
                    disabled={procesandoLectura || !textoPegado.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
                  >
                    {procesandoLectura ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                    <span>Interpretar y Mapear Datos</span>
                  </button>
                </div>
              </div>
            )}

            {/* Alerta de Error */}
            {errorLectura && (
              <div className="bg-rose-950/80 border border-rose-600/50 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorLectura}</span>
              </div>
            )}

            {/* Estado de Carga */}
            {procesandoLectura && (
              <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                <p>Analizando columnas y normalizando pedidos...</p>
              </div>
            )}

            {/* Resultados y Previsualización */}
            {resultadoParseo && (
              <div className="space-y-3 pt-2">
                {/* Métricas del Archivo */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Repuestos</p>
                    <p className="text-xl font-black text-emerald-400 mt-0.5">
                      {resultadoParseo.filasValidas.length} <span className="text-xs font-normal text-slate-400">líneas</span>
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Órdenes / Pedidos</p>
                    <p className="text-xl font-black text-cyan-300 mt-0.5">
                      {resultadoParseo.pedidosUnicosCount} <span className="text-xs font-normal text-slate-400">pedidos</span>
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-teal-500/30 rounded-xl p-3">
                    <p className="text-[10px] text-teal-300 uppercase font-bold flex items-center gap-1">
                      <PackageCheck className="w-3 h-3 text-teal-400" />
                      <span>Despachados</span>
                    </p>
                    <p className="text-xl font-black text-teal-300 mt-0.5">
                      {resultadoParseo.despachadosDetectadosCount} <span className="text-xs font-normal text-slate-400">entregados</span>
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-3">
                    <p className="text-[10px] text-purple-300 uppercase font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      <span>Duplicados Evitados</span>
                    </p>
                    <p className="text-xl font-black text-purple-300 mt-0.5">
                      {resultadoParseo.duplicadosOmitidosCount} <span className="text-xs font-normal text-slate-400">líneas</span>
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Filas Descartadas</p>
                    <p className="text-xl font-black text-amber-400 mt-0.5">
                      {resultadoParseo.filasDescartadas} <span className="text-xs font-normal text-slate-400">vacías</span>
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Sucursales</p>
                    <p className="text-xl font-black text-blue-300 mt-0.5">
                      {resultadoParseo.sucursalesInvolucradas.length}
                    </p>
                  </div>
                </div>

                {/* Banner Quirúrgico de Despachados Detectados */}
                {resultadoParseo.despachadosDetectadosCount > 0 && (
                  <div className="bg-teal-950/40 border border-teal-600/40 rounded-xl p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-teal-300 font-bold">
                      <PackageCheck className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>📦 Detección Quirúrgica de Despachados ({resultadoParseo.despachadosDetectadosCount} piezas identificadas)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Se detectaron repuestos con estatus de entrega/despacho en el archivo subido. El sistema los registrará con estatus <strong className="text-teal-300">Despachado</strong> directamente en Supabase y en la sección de <strong className="text-white">Entregas de Bodega y Traslados</strong>, asegurando que <u>no aparezcan como pendientes</u> ni se dupliquen o tripliquen pedidos.
                    </p>
                  </div>
                )}

                {/* Alerta de Protección Anti-Duplicados */}
                {resultadoParseo.duplicadosOmitidosCount > 0 && (
                  <div className="bg-purple-950/40 border border-purple-600/40 rounded-xl p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-300 font-bold">
                        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>🛡️ Protección Anti-Duplicados Activa ({resultadoParseo.duplicadosOmitidosCount} líneas repetidas consolidadas)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMostrarDetalleDuplicados(!mostrarDetalleDuplicados)}
                        className="text-[11px] text-purple-300 hover:text-white underline cursor-pointer font-medium"
                      >
                        {mostrarDetalleDuplicados ? 'Ocultar detalles ▲' : 'Ver repuestos protegidos ▼'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Se detectaron clientes con el mismo código de repuesto repetido en la misma cotización/orden. El sistema conservó una única versión oficial y consolidó la descripción para evitar duplicidad o triplicidad en la base de datos.
                    </p>
                    {mostrarDetalleDuplicados && (
                      <div className="bg-slate-950/90 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1 font-mono text-[10px] text-purple-200 border border-purple-800/40">
                        {resultadoParseo.duplicadosDetalle.map((d, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-purple-400 font-bold">•</span>
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Desglose por Sucursal */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Distribución Normalizada por Sucursal:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(resultadoParseo.resumenPorSucursal).map(([sucursal, count]) => (
                      <span
                        key={sucursal}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <strong className="text-white">{sucursal}:</strong>
                        <span className="text-slate-300 font-mono">{count} repuestos</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tabla de Previsualización (Primeras 10 filas) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Previsualización de Datos Procesados (Muestra de 10 filas):</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Mostrando {Math.min(10, resultadoParseo.filasValidas.length)} de {resultadoParseo.filasValidas.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-56">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 font-bold border-b border-slate-800">
                        <tr>
                          <th className="p-2">Pedido ID</th>
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Sucursal</th>
                          <th className="p-2">Asesor</th>
                          <th className="p-2">Cliente</th>
                          <th className="p-2">Modelo</th>
                          <th className="p-2">Cotización / OR</th>
                          <th className="p-2">Código OEM</th>
                          <th className="p-2">Descripción</th>
                          <th className="p-2 text-center">Cant.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px]">
                        {resultadoParseo.filasValidas.slice(0, 10).map((f, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-2 font-mono font-bold text-cyan-400">{f.pedidoId}</td>
                            <td className="p-2 font-mono text-slate-400">{f.fechaOriginal}</td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800">
                                {f.sucursal}
                              </span>
                            </td>
                            <td className="p-2 font-medium text-slate-200">{f.colaborador}</td>
                            <td className="p-2 text-slate-300 max-w-[130px] truncate" title={f.cliente}>
                              {f.cliente}
                            </td>
                            <td className="p-2 text-slate-300 font-medium">{f.modeloChangan}</td>
                            <td className="p-2 font-mono text-slate-400">{f.numeroOR}</td>
                            <td className="p-2 font-mono font-bold text-white">{f.codigoRepuesto}</td>
                            <td className="p-2 text-slate-300 max-w-[150px] truncate" title={f.descripcionOficial}>
                              {f.descripcionOficial}
                            </td>
                            <td className="p-2 text-center font-bold text-emerald-400 font-mono">
                              {f.cantidadSolicitada}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Barra de Progreso durante la importación */}
                {importandoASupabase && (
                  <div className="bg-slate-950 border border-blue-500/40 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-cyan-300 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Insertando filas en Supabase (matriz_pedidos)...</span>
                      </span>
                      <span className="font-mono text-white">{progresoImportacion}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progresoImportacion}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer con Acciones */}
        {!importacionFinalizada && (
          <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCerrar}
              disabled={importandoASupabase}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            {resultadoParseo && resultadoParseo.filasValidas.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmarImportacion}
                disabled={importandoASupabase}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition"
              >
                {importandoASupabase ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    <span>Iniciar Importación a Supabase ({resultadoParseo.filasValidas.length} repuestos)</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
