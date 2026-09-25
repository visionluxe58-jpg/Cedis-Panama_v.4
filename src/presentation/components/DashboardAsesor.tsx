/**
 * Dashboard de Asesores - Formulario Completo de Captura de Pedidos
 */

import { useState, useEffect } from 'react';
import type { AuthState, LineaPedido, ClasificacionRepuesto } from '../../domain/models/types';
import { nuevoFolio, transmitirPedido } from '../../data/api/client';
import { clasificarRepuesto } from '../../domain/services';

interface DashboardAsesorProps {
  auth: AuthState;
  onLogout: () => void;
}

const MODELOS_CHANGAN = ['CS15', 'CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'CS95', 'UNI-K', 'UNI-T', 'UNI-V', 'Alsvin', 'Hunter', 'Deepal S7', 'Deepal SL03', 'Lumin', 'E-Star'];
const CANALES = ['Mostrador', 'Taller', 'Chapistería', 'Bodega', 'Garantía', 'Interno'];

export function DashboardAsesor({ auth, onLogout }: DashboardAsesorProps) {
  const [view, setView] = useState<'main' | 'newOrder' | 'confirm' | 'transmitting' | 'success'>('main');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [pedidoLoading, setPedidoLoading] = useState(false);
  
  // Datos del pedido
  const [canal, setCanal] = useState('');
  const [cliente, setCliente] = useState('');
  const [modelo, setModelo] = useState('');
  const [vin, setVin] = useState('');
  const [noCotizacion, setNoCotizacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Líneas de repuestos
  const [lineas, setLineas] = useState<LineaPedido[]>([
    { codigoRepuesto: '', descripcion: '', cantidad: 1, motivo: '' }
  ]);
  const [clasificaciones, setClasificaciones] = useState<(ClasificacionRepuesto | null)[]>([null]);
  
  const [timestamp, setTimestamp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (view === 'newOrder' && !numeroPedido) {
      generarNumeroPedido();
    }
  }, [view]);

  const generarNumeroPedido = async () => {
    setPedidoLoading(true);
    const res = await nuevoFolio(auth.sucursal || '');
    if (res.folio) setNumeroPedido(res.folio);
    setPedidoLoading(false);
  };

  const addLinea = () => {
    setLineas([...lineas, { codigoRepuesto: '', descripcion: '', cantidad: 1, motivo: '' }]);
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

    // Clasificación automática
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

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!canal) newErrors.canal = 'Seleccione un canal';
    if (!cliente.trim()) newErrors.cliente = 'Ingrese el nombre del cliente';
    if (!modelo) newErrors.modelo = 'Seleccione el modelo Changan';
    if (!vin.trim()) newErrors.vin = 'Ingrese el VIN';
    else if (vin.length !== 17) newErrors.vin = 'El VIN debe tener 17 caracteres';
    
    // Validar líneas
    lineas.forEach((linea, idx) => {
      if (!linea.codigoRepuesto.trim()) {
        newErrors[`linea_${idx}_codigo`] = 'Código requerido';
      }
      if (!linea.descripcion.trim()) {
        newErrors[`linea_${idx}_desc`] = 'Descripción requerida';
      }
      if (linea.cantidad < 1) {
        newErrors[`linea_${idx}_cant`] = 'Mínimo 1';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinuar = () => {
    if (validarFormulario()) {
      setView('confirm');
    }
  };

  const handleTransmitir = async () => {
    setView('transmitting');
    const res = await transmitirPedido({
      folio: numeroPedido,
      sucursal: auth.sucursal,
      colaborador: auth.nombre,
      tipoPedido: canal,
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
    setNumeroPedido('');
    setCanal('');
    setCliente('');
    setModelo('');
    setVin('');
    setNoCotizacion('');
    setObservaciones('');
    setLineas([{ codigoRepuesto: '', descripcion: '', cantidad: 1, motivo: '' }]);
    setClasificaciones([null]);
    setErrors({});
    setView('newOrder');
  };

  const totalUnidades = lineas.reduce((sum, l) => sum + l.cantidad, 0);
  const totalAereos = clasificaciones.filter(c => c?.transporte === 'Aereo').length;
  const totalMaritimos = clasificaciones.filter(c => c?.transporte === 'Maritimo').length;

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
              <p className="text-xs text-blue-200">Sistema de Pedidos Especiales</p>
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
            {/* Número de Pedido */}
            <div className="glass-card rounded-2xl p-4 mb-4">
              {pedidoLoading ? (
                <div className="text-center py-2">
                  <i className="fas fa-spinner fa-spin text-changan-accent text-xl"></i>
                  <p className="text-gray-500 text-sm mt-1">Generando número de pedido...</p>
                </div>
              ) : numeroPedido ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-600"></i>
                    <span className="text-sm text-green-700">Pedido N°:</span>
                    <span className="font-mono font-bold text-changan-blue">{numeroPedido}</span>
                  </div>
                  <button onClick={() => setView('main')} className="text-gray-500 hover:text-gray-700">
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Datos del Pedido */}
            <div className="glass-card rounded-2xl p-6 mb-4">
              <h3 className="text-lg font-bold text-changan-blue mb-4 flex items-center gap-2">
                <i className="fas fa-clipboard-list text-changan-accent"></i>
                Datos del Pedido
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Canal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Canal * <span className="text-xs text-gray-500">(Departamento/Área)</span>
                  </label>
                  <select 
                    value={canal} 
                    onChange={(e) => { setCanal(e.target.value); setErrors({...errors, canal: ''}); }}
                    className={`w-full px-4 py-2 border rounded-xl ${errors.canal ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">— Seleccionar canal —</option>
                    {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.canal && <p className="text-xs text-red-600 mt-1">{errors.canal}</p>}
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                  <input 
                    type="text" 
                    value={cliente} 
                    onChange={(e) => { setCliente(e.target.value); setErrors({...errors, cliente: ''}); }}
                    placeholder="Nombre del cliente"
                    className={`w-full px-4 py-2 border rounded-xl ${errors.cliente ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.cliente && <p className="text-xs text-red-600 mt-1">{errors.cliente}</p>}
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo Changan *</label>
                  <select 
                    value={modelo} 
                    onChange={(e) => { setModelo(e.target.value); setErrors({...errors, modelo: ''}); }}
                    className={`w-full px-4 py-2 border rounded-xl ${errors.modelo ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">— Seleccionar modelo —</option>
                    {MODELOS_CHANGAN.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {errors.modelo && <p className="text-xs text-red-600 mt-1">{errors.modelo}</p>}
                </div>

                {/* VIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VIN (17 caracteres) *</label>
                  <input 
                    type="text" 
                    value={vin} 
                    onChange={(e) => { setVin(e.target.value.toUpperCase().slice(0, 17)); setErrors({...errors, vin: ''}); }}
                    placeholder="Ej: LS5A3ABR8NA000001"
                    className={`w-full px-4 py-2 border rounded-xl font-mono ${errors.vin ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.vin && <p className="text-xs text-red-600">{errors.vin}</p>}
                    <p className="text-xs text-gray-400 ml-auto">{vin.length}/17</p>
                  </div>
                </div>

                {/* No. Cotización */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. de Cotización</label>
                  <input 
                    type="text" 
                    value={noCotizacion} 
                    onChange={(e) => setNoCotizacion(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea 
                    value={observaciones} 
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales (opcional)"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Líneas de Repuestos */}
            <div className="glass-card rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-changan-blue flex items-center gap-2">
                  <i className="fas fa-cogs text-changan-accent"></i>
                  Líneas de Repuestos
                </h3>
                <button 
                  onClick={addLinea} 
                  className="px-4 py-2 bg-changan-accent hover:bg-changan-blue text-white rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-plus mr-1"></i> Agregar Línea
                </button>
              </div>

              {/* Resumen de Clasificación con Tiempos Estimados */}
              {clasificaciones.some(c => c !== null) && (
                <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-route text-changan-accent"></i>
                    <h4 className="text-sm font-bold text-gray-800">Clasificación Logística Automática</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* VÍA AÉREA */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-plane text-white text-sm"></i>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-blue-800 block">VÍA AÉREA</span>
                          <span className="text-[10px] text-blue-600">Express</span>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 mb-1">{totalAereos}</p>
                      <p className="text-xs text-blue-600 mb-2">repuesto(s)</p>
                      <div className="bg-blue-100 rounded px-2 py-1 flex items-center gap-1">
                        <i className="fas fa-clock text-blue-600 text-xs"></i>
                        <span className="text-xs font-bold text-blue-700">~30 días</span>
                      </div>
                    </div>

                    {/* VÍA MARÍTIMA */}
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-ship text-white text-sm"></i>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-orange-800 block">VÍA MARÍTIMA</span>
                          <span className="text-[10px] text-orange-600">Contenedor</span>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-orange-700 mb-1">{totalMaritimos}</p>
                      <p className="text-xs text-orange-600 mb-2">repuesto(s)</p>
                      <div className="bg-orange-100 rounded px-2 py-1 flex items-center gap-1">
                        <i className="fas fa-clock text-orange-600 text-xs"></i>
                        <span className="text-xs font-bold text-orange-700">~90 días</span>
                      </div>
                    </div>
                  </div>

                  {/* Tiempo Estimado Total */}
                  {totalAereos > 0 && totalMaritimos > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-info-circle text-yellow-600"></i>
                        <p className="text-xs text-yellow-800">
                          <strong>Pedido mixto:</strong> Los repuestos aéreos llegarán en ~30 días y los marítimos en ~90 días.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {lineas.map((linea, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-changan-blue">Línea {idx + 1}</span>
                      {lineas.length > 1 && (
                        <button 
                          onClick={() => removeLinea(idx)} 
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          <i className="fas fa-trash mr-1"></i>Eliminar
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Código OEM */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Código OEM *</label>
                        <input 
                          type="text" 
                          value={linea.codigoRepuesto} 
                          onChange={(e) => updateLinea(idx, 'codigoRepuesto', e.target.value)}
                          placeholder="Ej: 1422020-KC01"
                          className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${errors[`linea_${idx}_codigo`] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        />
                        {errors[`linea_${idx}_codigo`] && <p className="text-xs text-red-600 mt-1">{errors[`linea_${idx}_codigo`]}</p>}
                      </div>

                      {/* Descripción */}
                      <div className="md:col-span-5">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción *</label>
                        <input 
                          type="text" 
                          value={linea.descripcion} 
                          onChange={(e) => updateLinea(idx, 'descripcion', e.target.value)}
                          placeholder="Descripción del repuesto"
                          className={`w-full px-3 py-2 border rounded-lg text-sm ${errors[`linea_${idx}_desc`] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        />
                        {errors[`linea_${idx}_desc`] && <p className="text-xs text-red-600 mt-1">{errors[`linea_${idx}_desc`]}</p>}
                      </div>

                      {/* Cantidad */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad *</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={linea.cantidad} 
                          onChange={(e) => updateLinea(idx, 'cantidad', parseInt(e.target.value) || 1)}
                          className={`w-full px-3 py-2 border rounded-lg text-sm text-center ${errors[`linea_${idx}_cant`] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        />
                      </div>

                      {/* Motivo */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Motivo</label>
                        <input 
                          type="text" 
                          value={linea.motivo || ''} 
                          onChange={(e) => updateLinea(idx, 'motivo', e.target.value)}
                          placeholder="Opcional"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Clasificación Visual con Tiempo Estimado */}
                    {clasificaciones[idx] && (
                      <div className={`mt-3 p-3 rounded-lg border-l-4 ${
                        clasificaciones[idx]!.transporte === 'Aereo' 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-orange-50 border-orange-500'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            clasificaciones[idx]!.transporte === 'Aereo' 
                              ? 'bg-blue-500' 
                              : 'bg-orange-500'
                          }`}>
                            <i className={`fas ${
                              clasificaciones[idx]!.transporte === 'Aereo' 
                                ? 'fa-plane text-white' 
                                : 'fa-ship text-white'
                            }`}></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                clasificaciones[idx]!.transporte === 'Aereo' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {clasificaciones[idx]!.transporte === 'Aereo' ? '✈ VÍA AÉREA' : '🚢 VÍA MARÍTIMA'}
                              </span>
                              <span className="text-xs font-medium text-gray-700">
                                {clasificaciones[idx]!.categoria}
                              </span>
                              {clasificaciones[idx]!.esDGR && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                                  ⚠️ DGR
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {clasificaciones[idx]!.motivo}
                            </p>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                              clasificaciones[idx]!.transporte === 'Aereo' 
                                ? 'bg-blue-100' 
                                : 'bg-orange-100'
                            }`}>
                              <i className={`fas fa-clock text-xs ${
                                clasificaciones[idx]!.transporte === 'Aereo' 
                                  ? 'text-blue-600' 
                                  : 'text-orange-600'
                              }`}></i>
                              <span className={`text-xs font-bold ${
                                clasificaciones[idx]!.transporte === 'Aereo' 
                                  ? 'text-blue-700' 
                                  : 'text-orange-700'
                              }`}>
                                Tiempo estimado: {clasificaciones[idx]!.transporte === 'Aereo' ? '~30 días' : '~90 días'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3">
              <button 
                onClick={() => setView('main')} 
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                <i className="fas fa-arrow-left mr-2"></i>Cancelar
              </button>
              <button
                onClick={handleContinuar}
                disabled={!numeroPedido || pedidoLoading}
                className="btn-primary flex-1 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
              >
                <i className="fas fa-check mr-2"></i>Continuar
              </button>
            </div>
          </div>
        )}

        {/* Vista de Confirmación */}
        {view === 'confirm' && (
          <div className="fade-in">
            <div className="glass-card rounded-2xl p-6 mb-4">
              <h3 className="text-lg font-bold text-changan-blue mb-4 flex items-center gap-2">
                <i className="fas fa-clipboard-check text-changan-accent"></i>
                Confirmación del Pedido
              </h3>

              <div className="bg-changan-light rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Pedido N°</span>
                    <span className="font-mono font-bold text-changan-blue">{numeroPedido}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Canal</span>
                    <span className="font-medium">{canal}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Sucursal</span>
                    <span className="font-medium">{auth.sucursal}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Cliente</span>
                    <span className="font-medium">{cliente}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Modelo</span>
                    <span className="font-medium">{modelo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">VIN</span>
                    <span className="font-mono text-xs">{vin}</span>
                  </div>
                  {noCotizacion && (
                    <div>
                      <span className="text-gray-500 block text-xs">Cotización</span>
                      <span className="font-medium">{noCotizacion}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block text-xs">Colaborador</span>
                    <span className="font-medium">{auth.nombre}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Líneas</span>
                    <span className="font-bold text-changan-accent">{lineas.length}</span>
                  </div>
                </div>
              </div>

              {/* Resumen de Clasificación */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-plane text-blue-600"></i>
                    <span className="text-xs font-bold text-blue-800">VÍA AÉREA</span>
                  </div>
                  <p className="text-xl font-bold text-blue-700">{totalAereos} repuesto(s)</p>
                  <p className="text-xs text-blue-600">~30 días de entrega</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-ship text-orange-600"></i>
                    <span className="text-xs font-bold text-orange-800">VÍA MARÍTIMA</span>
                  </div>
                  <p className="text-xl font-bold text-orange-700">{totalMaritimos} repuesto(s)</p>
                  <p className="text-xs text-orange-600">~90 días de entrega</p>
                </div>
              </div>

              {/* Resumen de Líneas */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Cant.</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Vía</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Tiempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lineas.map((l, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-xs">{l.codigoRepuesto}</td>
                        <td className="px-3 py-2">{l.descripcion}</td>
                        <td className="px-3 py-2 text-center font-bold">{l.cantidad}</td>
                        <td className="px-3 py-2 text-center">
                          {clasificaciones[i] && (
                            <span className={`text-xs font-bold ${
                              clasificaciones[i]!.transporte === 'Aereo' ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {clasificaciones[i]!.transporte === 'Aereo' ? '✈ Aéreo' : '🚢 Marítimo'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {clasificaciones[i] && (
                            <span className={`text-xs font-bold ${
                              clasificaciones[i]!.transporte === 'Aereo' ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {clasificaciones[i]!.transporte === 'Aereo' ? '~30 días' : '~90 días'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                <i className="fas fa-info-circle mt-0.5"></i>
                <span>
                  Al transmitir, el pedido se registrará en el sistema con estado "TRANSMITIDO". 
                  Se generará un PDF de confirmación para archivo físico.
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setView('newOrder')} 
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                <i className="fas fa-arrow-left mr-2"></i>Volver
              </button>
              <button
                onClick={handleTransmitir}
                className="btn-primary flex-1 text-white px-6 py-3 rounded-xl font-medium"
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
              <p className="text-gray-500">Pedido N°: <span className="font-mono font-bold">{numeroPedido}</span></p>
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
              <p className="text-gray-500 mb-6">El pedido ha sido registrado exitosamente.</p>
              
              <div className="bg-changan-light rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Pedido N°:</span>
                  <span className="font-mono font-bold text-changan-blue">{numeroPedido}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Cliente:</span>
                  <span className="font-medium">{cliente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Modelo:</span>
                  <span className="font-medium">{modelo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Líneas:</span>
                  <span className="font-medium">{lineas.length} repuesto(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Total Unidades:</span>
                  <span className="font-medium">{totalUnidades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Estado:</span>
                  <span className="text-green-600 font-bold">TRANSMITIDO</span>
                </div>
              </div>

              {/* Resumen de Tiempos de Entrega */}
              {(totalAereos > 0 || totalMaritimos > 0) && (
                <div className="mb-6 space-y-2">
                  <p className="text-sm font-bold text-gray-700 mb-2">Tiempos Estimados de Entrega:</p>
                  {totalAereos > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <i className="fas fa-plane text-blue-600"></i>
                      <span className="text-sm text-blue-800">
                        <strong>{totalAereos} repuesto(s) vía aérea:</strong> ~30 días
                      </span>
                    </div>
                  )}
                  {totalMaritimos > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                      <i className="fas fa-ship text-orange-600"></i>
                      <span className="text-sm text-orange-800">
                        <strong>{totalMaritimos} repuesto(s) vía marítima:</strong> ~90 días
                      </span>
                    </div>
                  )}
                  {totalAereos > 0 && totalMaritimos > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <i className="fas fa-info-circle text-yellow-600"></i>
                      <span className="text-xs text-yellow-800">
                        <strong>Pedido mixto:</strong> Los repuestos llegarán en diferentes fechas según la vía de transporte.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => { setView('main'); handleNuevoPedido(); }} 
                className="btn-primary text-white px-6 py-3 rounded-xl font-medium w-full"
              >
                <i className="fas fa-plus mr-2"></i>Crear Nuevo Pedido
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
