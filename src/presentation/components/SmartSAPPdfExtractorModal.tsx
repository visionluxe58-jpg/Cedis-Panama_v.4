import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Car,
  User,
  Hash,
  Barcode,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  analizarCotizacion,
  analizarMuestraDemo,
} from '../../domain/services/agenteCotizaciones';
import type {
  ItemCotizacionExtraido,
  MetadatosCotizacion,
  ConceptoDescartado,
  ResultadoAnalisisCotizacion,
} from '../../domain/models/types';

export interface SmartSAPPdfExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAplicarDatos: (datos: {
    cliente: string;
    cotizacion: string;
    placa: string;
    vin: string;
    modeloAuto: string;
    items: Array<{
      codigoRepuesto: string;
      descripcionOficial: string;
      cantidadSolicitada: number;
    }>;
  }) => void;
}

export const SmartSAPPdfExtractorModal: React.FC<SmartSAPPdfExtractorModalProps> = ({
  isOpen,
  onClose,
  onAplicarDatos,
}) => {
  const [archivoNombre, setArchivoNombre] = useState<string>('');
  const [analizando, setAnalizando] = useState<boolean>(false);
  const [faseEscaneo, setFaseEscaneo] = useState<string>('');

  const [resultado, setResultado] = useState<ResultadoAnalisisCotizacion | null>(null);
  const [metadatos, setMetadatos] = useState<MetadatosCotizacion>({
    cliente: '',
    noCotizacion: '',
    placa: '',
    vin: '',
    modeloAuto: 'CS35 Plus 2023-2024',
  });

  const [itemsValidados, setItemsValidados] = useState<
    Array<ItemCotizacionExtraido & { seleccionado: boolean }>
  >([]);
  const [conceptosDescartados, setConceptosDescartados] = useState<ConceptoDescartado[]>([]);
  const [mostrarDescartados, setMostrarDescartados] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const ejecutarAnalisis = async (file: File | null, esDemo: boolean = false) => {
    setAnalizando(true);
    setResultado(null);
    setFaseEscaneo('1/4: Lectura y decodificación de estructura de documento SAP...');

    try {
      if (esDemo) {
        await new Promise((r) => setTimeout(r, 500));
        setFaseEscaneo('2/4: Reconocimiento OCR de tablas de cotización...');
        await new Promise((r) => setTimeout(r, 500));
        setFaseEscaneo('3/4: Filtrado inteligente de códigos OEM Changan vs mano de obra...');
        await new Promise((r) => setTimeout(r, 400));
        setFaseEscaneo('4/4: Extrayendo cliente, cotización, VIN y lista de repuestos...');

        const res = await analizarMuestraDemo();
        cargarResultadoEnEstado(res);
      } else if (file) {
        setArchivoNombre(file.name);
        setFaseEscaneo('2/4: Procesando documento con motor de visión e inteligencia...');

        const res = await analizarCotizacion(file, false);
        setFaseEscaneo('3/4: Clasificando números de parte Changan y excluyendo servicios...');
        await new Promise((r) => setTimeout(r, 300));
        setFaseEscaneo('4/4: Consolidando metadatos y cantidades...');
        cargarResultadoEnEstado(res);
      }
    } catch (err: any) {
      alert('Error en el escáner SAP PDF: ' + (err.message || 'Error desconocido'));
    } finally {
      setAnalizando(false);
    }
  };

  const cargarResultadoEnEstado = (res: ResultadoAnalisisCotizacion) => {
    setResultado(res);
    setArchivoNombre(res.nombreArchivo);

    if (res.metadatos) {
      setMetadatos({
        cliente: res.metadatos.cliente || 'CLIENTE SAP CHANGAN',
        noCotizacion: res.metadatos.noCotizacion || 'COT-SAP-2026',
        placa: res.metadatos.placa || '',
        vin: res.metadatos.vin || '',
        modeloAuto: res.metadatos.modeloAuto || 'CS35 Plus 2023-2024',
        fechaDocumento: res.metadatos.fechaDocumento,
      });
    }

    setItemsValidados(
      res.repuestos.map((r) => ({
        ...r,
        seleccionado: true,
      }))
    );

    setConceptosDescartados(res.conceptosDescartados || []);
  };

  const toggleSeleccionItem = (index: number) => {
    setItemsValidados((prev) =>
      prev.map((item, i) => (i === index ? { ...item, seleccionado: !item.seleccionado } : item))
    );
  };

  const actualizarCantidad = (index: number, delta: number) => {
    setItemsValidados((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const nuevaCant = Math.max(1, (item.cantidadSolicitada || 1) + delta);
          return { ...item, cantidadSolicitada: nuevaCant };
        }
        return item;
      })
    );
  };

  const eliminarItem = (index: number) => {
    setItemsValidados((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmarYEnviar = () => {
    const itemsSeleccionados = itemsValidados
      .filter((item) => item.seleccionado)
      .map((item) => ({
        codigoRepuesto: item.codigoRepuesto,
        descripcionOficial: item.descripcionOficial,
        cantidadSolicitada: item.cantidadSolicitada,
      }));

    if (itemsSeleccionados.length === 0) {
      alert('Debe seleccionar al menos un repuesto para inyectar al formulario.');
      return;
    }

    onAplicarDatos({
      cliente: metadatos.cliente || 'CLIENTE SAP',
      cotizacion: metadatos.noCotizacion || '',
      placa: metadatos.placa || '',
      vin: metadatos.vin || '',
      modeloAuto: metadatos.modeloAuto || 'CS35 Plus 2023-2024',
      items: itemsSeleccionados,
    });

    onClose();
  };

  const totalPiezasSeleccionadas = itemsValidados
    .filter((i) => i.seleccionado)
    .reduce((acc, curr) => acc + curr.cantidadSolicitada, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div
        className="bg-[#080d19] border border-indigo-500/50 rounded-3xl shadow-2xl shadow-indigo-950/70 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-6 pt-5 pb-4 border-b border-indigo-950/80 bg-gradient-to-r from-indigo-950/60 via-slate-950/80 to-indigo-950/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-[11px] uppercase tracking-wider font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>SMART SAP PDF EXTRACTOR // IA v4.0</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Extractor Inteligente de Cotizaciones SAP Changan
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar extractor"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!resultado && !analizando && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) ejecutarAnalisis(file, false);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all bg-indigo-950/10 hover:bg-indigo-950/20 group space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) ejecutarAnalisis(file, false);
                  }}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    Arrastre su cotización PDF u Orden de Taller aquí
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatos: PDF, JPG, PNG emitidos por SAP Business One u órdenes de sucursal.
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition">
                    <FileText className="w-4 h-4" /> Seleccionar Archivo PDF
                  </span>
                </div>
              </div>

              {/* Botón de Demostración Inmediata */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      ¿Desea evaluar el flujo con un PDF real?
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Pruebe con la cotización de Seguros FEDPA S.A. (CS35 Plus) emitida en SAP.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => ejecutarAnalisis(null, true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  Probar con Cotización Demo SAP
                </button>
              </div>
            </div>
          )}

          {/* Animación de escaneo */}
          {analizando && (
            <div className="py-16 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center"></div>
                <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">
                  Escaneando Documento con IA Automotriz
                </h3>
                <p className="text-xs text-indigo-300 font-mono bg-indigo-950/60 py-1.5 px-3 rounded-full border border-indigo-800/60 inline-block animate-pulse">
                  {faseEscaneo}
                </p>
              </div>
            </div>
          )}

          {/* Vista Interactiva con Resultados Extraídos */}
          {resultado && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-sm">{resultado.mensaje}</h4>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Archivo: <strong className="text-white">{archivoNombre}</strong> &bull;
                      Confianza IA: <strong className="text-white">{resultado.confianzaPromedio}%</strong> &bull;
                      Tiempo: <strong className="text-white">{resultado.tiempoProcesamientoMs}ms</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setResultado(null)}
                  className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Re-escanear
                </button>
              </div>

              {/* Ficha 1: Metadatos SAP */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4" /> 1. Datos del Cliente & Vehículo (Detectados de SAP)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-cyan-400" /> Cliente / Taller:
                    </label>
                    <input
                      type="text"
                      value={metadatos.cliente}
                      onChange={(e) => setMetadatos({ ...metadatos, cliente: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-amber-400" /> N° Cotización SAP:
                    </label>
                    <input
                      type="text"
                      value={metadatos.noCotizacion}
                      onChange={(e) => setMetadatos({ ...metadatos, noCotizacion: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                      <Barcode className="w-3 h-3 text-emerald-400" /> Placa:
                    </label>
                    <input
                      type="text"
                      value={metadatos.placa}
                      onChange={(e) => setMetadatos({ ...metadatos, placa: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs uppercase focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-sky-400" /> Chasis / VIN:
                    </label>
                    <input
                      type="text"
                      value={metadatos.vin}
                      onChange={(e) => setMetadatos({ ...metadatos, vin: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs uppercase focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                      <Car className="w-3 h-3 text-indigo-400" /> Modelo Changan:
                    </label>
                    <input
                      type="text"
                      value={metadatos.modeloAuto}
                      onChange={(e) => setMetadatos({ ...metadatos, modeloAuto: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Ficha 2: Tabla de Repuestos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Repuestos Físicos Validados ({itemsValidados.filter((i) => i.seleccionado).length} de{' '}
                      {itemsValidados.length})
                    </h3>
                  </div>
                  <span className="text-xs text-indigo-300 font-bold">
                    Total: {totalPiezasSeleccionadas} piezas seleccionadas
                  </span>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-3 text-center w-10">Sel.</th>
                          <th className="py-3 px-3">Código OEM (Item Code)</th>
                          <th className="py-3 px-3">Descripción Oficial</th>
                          <th className="py-3 px-3">Subsistema</th>
                          <th className="py-3 px-3 text-center">Cant.</th>
                          <th className="py-3 px-3 text-right">P. Unit. Estimado</th>
                          <th className="py-3 px-3 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {itemsValidados.map((item, idx) => (
                          <tr
                            key={idx}
                            className={`transition hover:bg-slate-900/80 ${
                              item.seleccionado ? 'bg-indigo-950/20' : 'opacity-40 bg-transparent'
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.seleccionado}
                                onChange={() => toggleSeleccionItem(idx)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-cyan-300 text-xs">
                                  {item.codigoRepuesto}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold border border-emerald-800">
                                  {item.confianza}%
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3 font-medium text-slate-200">
                              {item.descripcionOficial}
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                {item.subsistema || 'Repuesto Original'}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => actualizarCantidad(idx, -1)}
                                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-white w-6 text-center">
                                  {item.cantidadSolicitada}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => actualizarCantidad(idx, 1)}
                                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-slate-300">
                              {item.precioUnitarioEstimado ? `$${item.precioUnitarioEstimado.toFixed(2)}` : 'N/D'}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => eliminarItem(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Conceptos Descartados */}
              {conceptosDescartados.length > 0 && (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                  <button
                    type="button"
                    onClick={() => setMostrarDescartados(!mostrarDescartados)}
                    className="w-full px-4 py-3 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-xs text-slate-400 font-bold transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Conceptos Excluidos Automáticamente ({conceptosDescartados.length} descartados)</span>
                    </div>
                    {mostrarDescartados ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {mostrarDescartados && (
                    <div className="p-4 space-y-2 border-t border-slate-800 text-xs">
                      <p className="text-[11px] text-slate-400">
                        La IA descartó las siguientes líneas del documento por ser conceptos de taller no facturables
                        como repuesto físico CEDIS:
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {conceptosDescartados.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80"
                          >
                            <span className="font-medium text-slate-300">{c.descripcion}</span>
                            <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                              {c.razon}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-900 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            CANCELAR
          </button>

          {resultado && (
            <button
              type="button"
              onClick={handleConfirmarYEnviar}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Inyectar ({totalPiezasSeleccionadas} piezas) al Formulario</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
