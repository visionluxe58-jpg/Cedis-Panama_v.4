/**
 * Dashboard de Asesores - Captura de Pedidos
 */

import { useState, useEffect } from 'react';
import type { AuthState, PedidoState, LineaPedido, ClasificacionRepuesto } from '../../domain/models/types';
import { nuevoFolio, transmitirPedido } from '../../data/api/client';
import { clasificarRepuesto } from '../../domain/services';

interface DashboardAsesorProps {
  auth: AuthState;
  onLogout: () => void;
}

const MODELOS_CHANGAN = ['CS15', 'CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'CS95', 'UNI-K', 'UNI-T', 'UNI-V', 'Alsvin', 'Hunter'];
const TIPOS_PEDIDO = ['Repuestos', 'Garantía', 'Mantenimiento', 'Carrocero', 'Interno'];

export function DashboardAsesor({ auth, onLogout }: DashboardAsesorProps) {
  const [view, setView] = useState<'main' | 'newOrder' | 'transmitting' | 'success'>('main');
  const [folio, setFolio] = useState('');
  const [folioLoading, setFolioLoading] = useState(false);
  const [tipoPedido, setTipoPedido] = useState('');
  const [cliente, setCliente] = useState('');
  const [modelo, setModelo] = useState('');
  const [vin, setVin] = useState('');
  const [noCotizacion, setNoCotizacion] = useState('');
  const [lineas, setLineas] = useState<LineaPedido[]>([{ codigoRepuesto: '', descripcion: '', cantidad: 1 }]);
  const [clasificaciones, setClasificaciones] = useState<(ClasificacionRepuesto | null)[]>([null]);
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    if (view === 'newOrder' && !folio) {
      generarFolio();
    }
  }, [view]);

  const generarFolio = async () => {
    setFolioLoading(true);
    const res = await nuevoFolio(auth.sucursal || '');
    if (res.folio) setFolio(res.folio);
    setFolioLoading(false);
  };

  const addLinea = () => {
    setLineas([...lineas, { codigoRepuesto: '', descripcion: '', cantidad: 1 }]);
    setClasificaciones([...clasificaciones, null]);
  };

  const removeLinea = (idx: number) => {
    if (lineas.length <= 1) return;
    setLineas(lineas.filter((_, i) => i !== idx));
    setClasificaciones(clasificaciones.filter((_, i) => i !== idx));
  };

  const updateLinea = (idx: number, field: keyof LineaPedido, value: string | number) => {
    const updated = [...lineas];
    updated[idx] = { ...updated[idx], [field]: value };
    setLineas(updated);

    if (field === 'codigoRepuesto' || field === 'descripcion') {
      const codigo = field === 'codigoRepuesto' ? String(value) : updated[idx].codigoRepuesto;
      const descripcion = field === 'descripcion' ? String(value) : updated[idx].descripcion;
      if (codigo || descripcion) {
        const clasif = clasificarRepuesto(codigo, descripcion);
        const newClasificaciones = [...clasificaciones];
        newClasificaciones[idx] = clasif;
        setClasificaciones(newClasificaciones);
      }
    }
  };

  const handleTransmitir = async () => {
    setView('transmitting');
    const res = await transmitirPedido({
      folio,
      sucursal: auth.sucursal,
      colaborador: auth.nombre,
      tipoPedido,
      cliente,
      modeloChangan: modelo,
      vin,
      noCotizacion,
      lineas
    });
    if (res.estado === 'TRANSMITIDO') {
      setTimestamp(res.timestamp || new Date().toISOString());
      setView('success');
    }
  };

  const handleNuevoPedido = () => {
    setFolio('');
    setTipoPedido('');
    setCliente('');
    setModelo('');
    setVin('');
    setNoCotizacion('');
    setLineas([{ codigoRepuesto: '', descripcion: '', cantidad: 1 }]);
    setClasificaciones([null]);
    setView('newOrder');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-changan-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-truck-fast text-changan-gold text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">CEDIS Changan Panamá</h1>
              <p className="text-xs text-blue-200">Módulo de Captura de Pedidos</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <i className="fas fa-building text-blue-300"></i>
              <span className="text-blue-100">{auth.sucursal}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <i className="fas fa-user text-blue-300"></i>
              <span className="text-blue-100">{auth.nombre}</span>
            </div>
            <button onClick={onLogout} className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm">
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Vista Principal */}
        {view === 'main' && (
          <div className="fade-in">
            <div className="glass-card rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-changan-blue">¡Bienvenido, {auth.nombre}! 👋</h2>
              <p className="text-gray-500 mt-1">
                Sucursal: <span className="font-medium text-changan-blue">{auth.sucursal}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleNuevoPedido}
                className="glass-card rounded-2xl p-6 text-left hover:shadow-lg transition-all group cursor-pointer border-2 border-transparent hover:border-changan-accent/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-changan-blue to-changan-accent rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-plus text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-changan-blue">Nuevo Pedido</h3>
                    <p className="text-sm text-gray-500 mt-1">Crear un nuevo pedido de repuestos</p>
                  </div>
                </div>
              </button>

              <div className="glass-card rounded-2xl p-6 border-2 border-dashed border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-history text-gray-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-400">Historial</h3>
                    <p className="text-sm text-gray-400 mt-1">Próximamente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Nuevo Pedido */}
        {view === 'newOrder' && (
          <div className="fade-in">
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-changan-blue">Nuevo Pedido</h3>
                <button onClick={() => setView('main')} className="text-gray-500 hover:text-gray-700">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {folioLoading ? (
                <div className="text-center py-4">
                  <i className="fas fa-spinner fa-spin text-changan-accent text-2xl"></i>
                  <p className="text-gray-500 mt-2">Generando folio...</p>
                </div>
              ) : folio ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-green-700">
                    <i className="fas fa-check-circle mr-2"></i>
                    Folio reservado: <span className="font-mono font-bold">{folio}</span>
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pedido *</label>
                  <select value={tipoPedido} onChange={(e) => setTipoPedido(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                    <option value="">— Seleccionar —</option>
                    {TIPOS_PEDIDO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                  <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo Changan *</label>
                  <select value={modelo} onChange={(e) => setModelo(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                    <option value="">— Seleccionar —</option>
                    {MODELOS_CHANGAN.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VIN *</label>
                  <input type="text" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase().slice(0, 17))} className="w-full px-4 py-2 border border-gray-300 rounded-xl font-mono" />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-changan-blue">Líneas de Repuestos</h3>
                <button onClick={addLinea} className="px-4 py-2 bg-changan-accent text-white rounded-lg text-sm">
                  <i className="fas fa-plus mr-1"></i> Agregar Línea
                </button>
              </div>

              <div className="space-y-4">
                {lineas.map((linea, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-changan-blue">Línea {idx + 1}</span>
                      {lineas.length > 1 && (
                        <button onClick={() => removeLinea(idx)} className="text-red-500 hover:text-red-700">
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input type="text" placeholder="Código OEM" value={linea.codigoRepuesto} onChange={(e) => updateLinea(idx, 'codigoRepuesto', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" />
                      <input type="text" placeholder="Descripción" value={linea.descripcion} onChange={(e) => updateLinea(idx, 'descripcion', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <input type="number" min="1" value={linea.cantidad} onChange={(e) => updateLinea(idx, 'cantidad', parseInt(e.target.value) || 1)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-center" />
                      <input type="text" placeholder="Motivo" value={linea.motivo || ''} onChange={(e) => updateLinea(idx, 'motivo', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    {clasificaciones[idx] && (
                      <div className={`mt-3 p-3 rounded-lg border-l-4 ${clasificaciones[idx]!.transporte === 'Aereo' ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500'}`}>
                        <div className="flex items-center gap-2">
                          <i className={`fas ${clasificaciones[idx]!.transporte === 'Aereo' ? 'fa-plane text-blue-600' : 'fa-ship text-orange-600'}`}></i>
                          <span className="text-xs font-bold">{clasificaciones[idx]!.transporte === 'Aereo' ? 'VÍA AÉREA' : 'VÍA MARÍTIMA'}</span>
                          <span className="text-xs text-gray-600">{clasificaciones[idx]!.categoria}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setView('main')} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">
                <i className="fas fa-arrow-left mr-2"></i>Cancelar
              </button>
              <button
                onClick={handleTransmitir}
                disabled={!folio || !tipoPedido || !cliente || !modelo || !vin || lineas.some(l => !l.codigoRepuesto)}
                className="btn-primary flex-1 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
              >
                <i className="fas fa-paper-plane mr-2"></i>Transmitir Pedido
              </button>
            </div>
          </div>
        )}

        {/* Transmitiendo */}
        {view === 'transmitting' && (
          <div className="max-w-lg mx-auto py-16 text-center fade-in">
            <div className="glass-card rounded-2xl p-8">
              <i className="fas fa-sync-alt text-changan-accent text-4xl animate-spin mb-4"></i>
              <h2 className="text-xl font-bold text-changan-blue mb-2">Transmitiendo Pedido</h2>
              <p className="text-gray-500">Folio: <span className="font-mono font-bold">{folio}</span></p>
            </div>
          </div>
        )}

        {/* Éxito */}
        {view === 'success' && (
          <div className="max-w-lg mx-auto py-16 text-center fade-in">
            <div className="glass-card rounded-2xl p-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 text-4xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-changan-blue mb-2">¡Pedido Transmitido!</h2>
              <div className="bg-changan-light rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Folio:</span>
                  <span className="font-mono font-bold text-changan-blue">{folio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Cliente:</span>
                  <span className="font-medium">{cliente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Líneas:</span>
                  <span className="font-medium">{lineas.length} repuesto(s)</span>
                </div>
              </div>
              <button onClick={() => { setView('main'); handleNuevoPedido(); }} className="btn-primary text-white px-6 py-3 rounded-xl font-medium w-full">
                <i className="fas fa-plus mr-2"></i>Crear Nuevo Pedido
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
