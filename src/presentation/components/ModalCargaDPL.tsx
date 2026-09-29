/**
 * Modal de Carga de Manifiestos DPL (Disposición de Pedidos Logísticos)
 * Permite subir archivos Excel (.xlsx/.xls), CSV o pegar texto de celdas
 * CEDIS Changan Panamá
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { DPLManifiesto, DPLDetalle, EstatusDPL } from '../../domain/models/types';
import { guardarDPLCompletoSupabase } from '../../data/api/supabaseClient';

interface ModalCargaDPLProps {
  isOpen: boolean;
  onClose: () => void;
  onDPLCargado: (manifiesto: DPLManifiesto, detalles: DPLDetalle[]) => void;
}

export const ModalCargaDPL: React.FC<ModalCargaDPLProps> = ({
  isOpen,
  onClose,
  onDPLCargado,
}) => {
  // Metadatos del Contenedor
  const [contenedorId, setContenedorId] = useState('');
  const [proveedor, setProveedor] = useState('Changan China Parts (Mobitech)');
  const [fechaArribo, setFechaArribo] = useState(new Date().toISOString().slice(0, 10));
  const [poReferencia, setPoReferencia] = useState('');
  const [blReferencia, setBlReferencia] = useState('');
  const [tipoTransporte, setTipoTransporte] = useState('Marítimo 40HQ');
  const [estadoInicial, setEstadoInicial] = useState<EstatusDPL>('EN TRÁNSITO');

  // Modo de entrada: 'archivo' o 'pegar'
  const [modoEntrada, setModoEntrada] = useState<'archivo' | 'pegar'>('archivo');
  const [textoPegado, setTextoPegado] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');

  // Filas parseadas
  const [lineasPrevisualizacion, setLineasPrevisualizacion] = useState<DPLDetalle[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Parser genérico de matriz de objetos/filas
  const procesarFilasCrudas = (filas: any[][]) => {
    if (!filas || filas.length < 2) {
      setErrorMensaje('El archivo o texto no contiene suficientes filas con encabezados.');
      return;
    }

    // Encabezados en minúsculas
    const encabezados = filas[0].map((h: any) => String(h || '').trim().toLowerCase());

    const idxPallet = encabezados.findIndex((h: string) => h.includes('pallet') || h.includes('case') || h.includes('bulto'));
    const idxPkg = encabezados.findIndex((h: string) => h.includes('package') || h.includes('caja') || h.includes('pkg'));
    const idxCodigo = encabezados.findIndex((h: string) => h.includes('part') || h.includes('codigo') || h.includes('código') || h.includes('item'));
    const idxDesc = encabezados.findIndex((h: string) => h.includes('desc') || h.includes('nombre') || h.includes('repuesto'));
    const idxCant = encabezados.findIndex((h: string) => h.includes('cant') || h.includes('qty') || h.includes('piezas') || h.includes('total'));

    if (idxCodigo === -1 && idxDesc === -1) {
      setErrorMensaje('No se detectaron columnas de Código de Repuesto o Descripción en la primera fila.');
      return;
    }

    const contId = contenedorId.trim().toUpperCase() || `CONT-${Date.now().toString().slice(-6)}`;
    const lineas: DPLDetalle[] = [];

    for (let i = 1; i < filas.length; i++) {
      const row = filas[i];
      if (!row || row.length === 0) continue;

      const rawCod = idxCodigo !== -1 ? String(row[idxCodigo] || '').trim() : '';
      const rawDesc = idxDesc !== -1 ? String(row[idxDesc] || '').trim() : '';
      if (!rawCod && !rawDesc) continue;

      const rawPallet = idxPallet !== -1 ? String(row[idxPallet] || '').trim() : `P${Math.floor(lineas.length / 10) + 1}`;
      const rawPkg = idxPkg !== -1 ? String(row[idxPkg] || '').trim() : '';
      const rawCant = idxCant !== -1 ? Number(row[idxCant]) || 1 : 1;

      lineas.push({
        inventarioId: `DPL-${contId}-${lineas.length + 1}`,
        contenedorId: contId,
        palletCaseNo: rawPallet || 'P001',
        packageNo: rawPkg,
        codigoRepuesto: rawCod.toUpperCase(),
        descripcion: rawDesc || 'Repuesto Original Changan',
        cantidadTotal: rawCant > 0 ? rawCant : 1,
        cantidadAsignada: 0,
        cantidadDespachada: 0,
        saldoDisponible: rawCant > 0 ? rawCant : 1,
        ubicacionCedis: `CEDIS-${rawPallet || 'P001'}`,
      });
    }

    if (lineas.length === 0) {
      setErrorMensaje('No se pudieron extraer repuestos válidos de los datos proporcionados.');
      return;
    }

    setLineasPrevisualizacion(lineas);
    setErrorMensaje(null);
  };

  // Procesar archivo Excel / CSV
  const handleArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMensaje(null);
    setNombreArchivo(file.name);

    // Auto-completar contenedor ID si está vacío basándose en el nombre de archivo
    if (!contenedorId) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
      setContenedorId(cleanName.slice(0, 18));
    }

    try {
      setCargando(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const primerHoja = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[primerHoja];
      const jsonRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      procesarFilasCrudas(jsonRows);
    } catch (err: any) {
      console.error('Error leyendo archivo DPL:', err);
      setErrorMensaje(`Error al leer el archivo: ${err.message || 'Formato no soportado'}`);
    } finally {
      setCargando(false);
    }
  };

  // Procesar texto copiado y pegado de Excel
  const handleProcesarTextoPegado = () => {
    if (!textoPegado.trim()) {
      setErrorMensaje('Por favor pega el contenido de las celdas de tu hoja de cálculo.');
      return;
    }

    const lineas = textoPegado.trim().split(/\r?\n/);
    const matriz = lineas.map(l => {
      if (l.includes('\t')) return l.split('\t');
      if (l.includes(';')) return l.split(';');
      return l.split(',');
    });

    procesarFilasCrudas(matriz);
  };

  // Guardar y Registrar DPL
  const handleGuardarDPL = async () => {
    if (!contenedorId.trim()) {
      alert('Por favor ingrese el Identificador del Contenedor (Ej: MSCU1234567 o CONT-01).');
      return;
    }

    if (lineasPrevisualizacion.length === 0) {
      alert('No hay repuestos cargados para registrar.');
      return;
    }

    setCargando(true);
    try {
      const finalContId = contenedorId.trim().toUpperCase();
      const skusUnicos = new Set(lineasPrevisualizacion.map(l => l.codigoRepuesto)).size;
      const palletsUnicos = new Set(lineasPrevisualizacion.map(l => l.palletCaseNo)).size;
      const totalPiezas = lineasPrevisualizacion.reduce((acc, l) => acc + l.cantidadTotal, 0);

      const nuevoManifiesto: DPLManifiesto = {
        contenedorId: finalContId,
        proveedor: proveedor.trim() || 'Changan China Parts',
        fechaArribo: fechaArribo || new Date().toISOString().slice(0, 10),
        poReferencia: poReferencia.trim() || `PO-${finalContId}`,
        tipoTransporte,
        totalPiezas,
        skusUnicos,
        totalPallets: palletsUnicos,
        estado: estadoInicial,
        creadoPor: 'Admin CEDIS',
        creadoEn: new Date().toISOString(),
        blReferencia: blReferencia.trim() || `BL-${finalContId}`,
      };

      const lineasAjustadas = lineasPrevisualizacion.map(l => ({
        ...l,
        contenedorId: finalContId,
      }));

      await guardarDPLCompletoSupabase(nuevoManifiesto, lineasAjustadas);

      onDPLCargado(nuevoManifiesto, lineasAjustadas);
      onClose();
    } catch (err: any) {
      console.error('Error guardando DPL:', err);
      alert(`Error al registrar el DPL: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-lg">
              <i className="fas fa-file-excel"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Carga de Manifiesto DPL / Embarque</h2>
              <p className="text-xs text-slate-400">Importación de Packing List y Contenedores Changan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Metadatos del Contenedor */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <i className="fas fa-ship"></i> 1. Datos Principales del Embarque
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">ID Contenedor *</label>
              <input
                type="text"
                value={contenedorId}
                onChange={e => setContenedorId(e.target.value.toUpperCase())}
                placeholder="Ej: MSCU7849201 o CONT-01"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Proveedor</label>
              <input
                type="text"
                value={proveedor}
                onChange={e => setProveedor(e.target.value)}
                placeholder="Changan China Parts"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Fecha de Arribo (ETA)</label>
              <input
                type="date"
                value={fechaArribo}
                onChange={e => setFechaArribo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Referencia PO</label>
              <input
                type="text"
                value={poReferencia}
                onChange={e => setPoReferencia(e.target.value)}
                placeholder="Ej: PO-2024-004"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tipo de Transporte</label>
              <select
                value={tipoTransporte}
                onChange={e => setTipoTransporte(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
              >
                <option value="Marítimo 40HQ">Marítimo 40HQ</option>
                <option value="Marítimo 20GP">Marítimo 20GP</option>
                <option value="Aéreo Express">Aéreo Express</option>
                <option value="Terrestre Local">Terrestre Local</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Estado Inicial del Contenedor</label>
              <select
                value={estadoInicial}
                onChange={e => setEstadoInicial(e.target.value as EstatusDPL)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="EN TRÁNSITO">🚢 EN TRÁNSITO (Altamar / Pre-arribo)</option>
                <option value="ADUANA">🛃 ADUANA (En Aforo Portuario)</option>
                <option value="RECIBIDO">🏢 RECIBIDO EN CEDIS (Físico)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Selector de Modo de Entrada */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setModoEntrada('archivo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                modoEntrada === 'archivo'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-800'
              }`}
            >
              <i className="fas fa-file-upload"></i> Subir Archivo Excel o CSV
            </button>
            <button
              type="button"
              onClick={() => setModoEntrada('pegar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                modoEntrada === 'pegar'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-800'
              }`}
            >
              <i className="fas fa-paste"></i> Pegar Celdas de Excel / Portapapeles
            </button>
          </div>

          {modoEntrada === 'archivo' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-slate-950/60 hover:bg-slate-950 p-6 rounded-xl text-center cursor-pointer transition space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleArchivoSeleccionado}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center text-xl mx-auto">
                <i className="fas fa-cloud-upload-alt"></i>
              </div>
              <p className="text-xs font-bold text-slate-200">
                {nombreArchivo ? `Archivo seleccionado: ${nombreArchivo}` : 'Haz clic para seleccionar o arrastra tu archivo Excel (.xlsx, .xls) o CSV'}
              </p>
              <p className="text-[11px] text-slate-500">
                El sistema detectará automáticamente columnas de Pallet, Código OEM, Descripción y Cantidad
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={textoPegado}
                onChange={e => setTextoPegado(e.target.value)}
                placeholder="Copia las celdas desde Excel o Google Sheets con sus encabezados (Pallet, Código, Descripción, Cantidad) y pégalas aquí..."
                rows={4}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={handleProcesarTextoPegado}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <i className="fas fa-cogs"></i> Procesar Texto Pegado
              </button>
            </div>
          )}
        </div>

        {errorMensaje && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <i className="fas fa-exclamation-circle text-rose-400"></i>
            <span>{errorMensaje}</span>
          </div>
        )}

        {/* Previsualización de Datos */}
        {lineasPrevisualizacion.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <i className="fas fa-check-circle"></i>
                {lineasPrevisualizacion.length} repuestos detectados ({lineasPrevisualizacion.reduce((a, b) => a + b.cantidadTotal, 0)} piezas totales)
              </span>
              <span className="text-slate-400 text-[11px]">
                {new Set(lineasPrevisualizacion.map(l => l.palletCaseNo)).size} pallets distintos
              </span>
            </div>

            <div className="overflow-x-auto max-h-48 border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Pallet / Case</th>
                    <th className="py-2 px-3">Código OEM</th>
                    <th className="py-2 px-3">Descripción</th>
                    <th className="py-2 px-3 text-center">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono text-[11px]">
                  {lineasPrevisualizacion.slice(0, 100).map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-1.5 px-3 text-cyan-300 font-bold">{l.palletCaseNo}</td>
                      <td className="py-1.5 px-3 font-bold text-white">{l.codigoRepuesto}</td>
                      <td className="py-1.5 px-3 text-slate-300 font-sans truncate max-w-xs">{l.descripcion}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-emerald-400">{l.cantidadTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lineasPrevisualizacion.length > 100 && (
              <p className="text-[10px] text-slate-400 italic">Mostrando las primeras 100 filas de {lineasPrevisualizacion.length}.</p>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={cargando || lineasPrevisualizacion.length === 0}
            onClick={handleGuardarDPL}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-blue-900/40 flex items-center gap-2 disabled:opacity-50"
          >
            <i className={`fas fa-check ${cargando ? 'animate-spin' : ''}`}></i>
            <span>{cargando ? 'Guardando en Supabase...' : `Registrar Manifiesto (${lineasPrevisualizacion.length} repuestos)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
