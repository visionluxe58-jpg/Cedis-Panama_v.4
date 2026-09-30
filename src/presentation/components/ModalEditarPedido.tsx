/**
 * Modal para Editar la Información Completa de un Pedido / Repuesto
 * Permite al Administrador corregir cliente, cotización, código, descripción,
 * cantidades, sucursales y ubicaciones en Supabase y memoria local.
 * CEDIS Changan Panamá
 */

import React, { useState, useEffect } from 'react';
import {
  Edit3,
  X,
  Save,
  Loader2,
  Building2,
  User,
  Hash,
  Car,
  Package,
  Boxes,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { FilaRastreador } from '../../domain/models/types';
import {
  actualizarFilaAdminSupabase,
  DatosEdicionPedido,
} from '../../data/api/supabaseClient';

interface ModalEditarPedidoProps {
  isOpen: boolean;
  fila: FilaRastreador | null;
  onClose: () => void;
  onGuardadoExitoso: (filaActualizada: FilaRastreador) => void;
}

const SUCURSALES_OFICIALES = [
  'Villa Lucre',
  'Calle 50',
  'Tumba Muerto',
  'Costa Verde',
  'Chiriquí',
  'Bodega Central',
];

const ESTATUS_OPCIONES = [
  'Pendiente',
  'Asignado',
  'Asignado Parcial',
  'En Picking',
  'Despachado',
  'Sin Stock',
];

export const ModalEditarPedido: React.FC<ModalEditarPedidoProps> = ({
  isOpen,
  fila,
  onClose,
  onGuardadoExitoso,
}) => {
  const [formData, setFormData] = useState<DatosEdicionPedido>({
    cliente: '',
    sucursal: 'Villa Lucre',
    colaborador: '',
    numeroOR: '',
    modeloChangan: '',
    vin: '',
    codigoRepuesto: '',
    descripcionOficial: '',
    cantidadSolicitada: 1,
    estatusLinea: 'Pendiente',
    contenedorAsignado: '',
    palletAsignado: '',
    ubicacionCedis: '',
  });

  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (fila) {
      setFormData({
        cliente: fila.cliente || '',
        sucursal: fila.sucursal || 'Villa Lucre',
        colaborador: fila.colaborador || '',
        numeroOR: fila.numeroOR || '',
        modeloChangan: fila.modeloChangan || '',
        vin: fila.vin || '',
        codigoRepuesto: fila.codigoRepuesto || '',
        descripcionOficial: fila.descripcionOficial || '',
        cantidadSolicitada: fila.cantidadSolicitada || 1,
        estatusLinea: fila.estatusLinea || 'Pendiente',
        contenedorAsignado: fila.contenedorAsignado || '',
        palletAsignado: fila.palletAsignado || '',
        ubicacionCedis: fila.ubicacionCedis || '',
      });
      setErrorMsg(null);
    }
  }, [fila, isOpen]);

  if (!isOpen || !fila) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigoRepuesto.trim()) {
      setErrorMsg('El código OEM del repuesto no puede estar vacío.');
      return;
    }
    if (!formData.cliente.trim()) {
      setErrorMsg('El nombre del cliente no puede estar vacío.');
      return;
    }

    setGuardando(true);
    setErrorMsg(null);

    try {
      const res = await actualizarFilaAdminSupabase(fila, formData);
      if (res.ok) {
        const filaActualizada: FilaRastreador = {
          ...fila,
          cliente: formData.cliente.trim(),
          sucursal: formData.sucursal,
          colaborador: formData.colaborador.trim(),
          numeroOR: formData.numeroOR.trim(),
          modeloChangan: formData.modeloChangan.trim(),
          vin: formData.vin.trim(),
          codigoRepuesto: formData.codigoRepuesto.trim().toUpperCase(),
          descripcionOficial: formData.descripcionOficial.trim(),
          cantidadSolicitada: Math.max(1, Number(formData.cantidadSolicitada) || 1),
          estatusLinea: formData.estatusLinea as any,
          contenedorAsignado: formData.contenedorAsignado?.trim() || '',
          palletAsignado: formData.palletAsignado?.trim() || '',
          ubicacionCedis: formData.ubicacionCedis?.trim() || '',
        };
        onGuardadoExitoso(filaActualizada);
        onClose();
      } else {
        setErrorMsg(res.error || 'No se pudo guardar la información en Supabase.');
      }
    } catch (err: any) {
      console.error('Error al editar pedido:', err);
      setErrorMsg(err.message || 'Error inesperado al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[94vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Editar Información de Pedido
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  {fila.pedidoId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modifica los datos del cliente, vehículo, código OEM o estatus. Los cambios se sincronizan en Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={guardando}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-600/50 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bloque 1: Cliente y Sucursal */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Datos del Cliente y Asesor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Cliente / Aseguradora / Taller *
                </label>
                <input
                  type="text"
                  value={formData.cliente}
                  onChange={e => setFormData({ ...formData, cliente: e.target.value })}
                  placeholder="Ej: SEGUROS SURAMERICANA S.A."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Sucursal Destino *
                </label>
                <select
                  value={formData.sucursal}
                  onChange={e => setFormData({ ...formData, sucursal: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                >
                  {SUCURSALES_OFICIALES.map(suc => (
                    <option key={suc} value={suc}>
                      {suc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Asesor / Responsable
                </label>
                <input
                  type="text"
                  value={formData.colaborador}
                  onChange={e => setFormData({ ...formData, colaborador: e.target.value })}
                  placeholder="Ej: Edwin Blanco"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Cotización / Orden de Trabajo (OT)
                </label>
                <input
                  type="text"
                  value={formData.numeroOR}
                  onChange={e => setFormData({ ...formData, numeroOR: e.target.value })}
                  placeholder="Ej: COT: 79834 | OT: 25879-02"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Vehículo */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Car className="w-3.5 h-3.5 text-blue-400" />
              <span>Datos del Vehículo Changan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Modelo del Vehículo
                </label>
                <input
                  type="text"
                  value={formData.modeloChangan}
                  onChange={e => setFormData({ ...formData, modeloChangan: e.target.value })}
                  placeholder="Ej: Oshan X7 Plus, Deepal G318, UNI-K"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Placa o VIN
                </label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={e => setFormData({ ...formData, vin: e.target.value })}
                  placeholder="Ej: EW6517 o LS6..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Repuesto Solicitado */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Repuesto Solicitado y Estatus</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Código OEM / Part Number *
                </label>
                <input
                  type="text"
                  value={formData.codigoRepuesto}
                  onChange={e => setFormData({ ...formData, codigoRepuesto: e.target.value.toUpperCase() })}
                  placeholder="Ej: F202F280503-0702-AA"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Descripción Oficial del Repuesto
                </label>
                <input
                  type="text"
                  value={formData.descripcionOficial}
                  onChange={e => setFormData({ ...formData, descripcionOficial: e.target.value })}
                  placeholder="Ej: TAIL LAMP RH, PARACHOQUE TRASERO, ETC."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Cantidad Solicitada (Unidades) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={formData.cantidadSolicitada}
                  onChange={e => setFormData({ ...formData, cantidadSolicitada: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Estatus de la Línea
                </label>
                <select
                  value={formData.estatusLinea}
                  onChange={e => setFormData({ ...formData, estatusLinea: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
                >
                  {ESTATUS_OPCIONES.map(est => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bloque 4: Ubicación y Contenedor */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Asignación Logística (Opcional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Ubicación en Bodega CEDIS
                </label>
                <input
                  type="text"
                  value={formData.ubicacionCedis}
                  onChange={e => setFormData({ ...formData, ubicacionCedis: e.target.value.toUpperCase() })}
                  placeholder="Ej: RACK A-02, PISO-01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Contenedor Asignado
                </label>
                <input
                  type="text"
                  value={formData.contenedorAsignado}
                  onChange={e => setFormData({ ...formData, contenedorAsignado: e.target.value.toUpperCase() })}
                  placeholder="Ej: 2609M00008EA0061"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Pallet / Case Asignado
                </label>
                <input
                  type="text"
                  value={formData.palletAsignado}
                  onChange={e => setFormData({ ...formData, palletAsignado: e.target.value.toUpperCase() })}
                  placeholder="Ej: P0001277357"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer transition"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Guardando Cambios en Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
