/**
 * Dashboard de Asesores - Formulario Completo de Captura de Pedidos
 */

import { useState, useEffect } from 'react';
import type { AuthState, LineaPedido, ClasificacionRepuesto } from '../../domain/models/types';
import { nuevoFolio, transmitirPedido } from '../../data/api/client';
import { clasificarRepuesto } from '../../domain/services';
import { IAReconocimientoRepuestos, type RepuestoChangan } from '../../domain/services/iaReconocimientoRepuestos';
import { SmartSAPPdfExtractorModal } from './SmartSAPPdfExtractorModal';
import { generarPDFPedido } from '../../infrastructure/pdf/pdfGenerator';

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
  const [modalExtractorAbierto, setModalExtractorAbierto] = useState(false);
  const [pasoActual, setPasoActual] = useState(1);
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'success' | 'error' | 'info' | 'warning'; texto: string } | null>(null);
  
  // Datos del pedido
  const [canal, setCanal] = useState('');
  const [cliente, setCliente] = useState('');
  const [modelo, setModelo] = useState('');
  const [vin, setVin] = useState('');
  const [placa, setPlaca] = useState('');
  const [noCotizacion, setNoCotizacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Líneas de repuestos
  const [lineas, setLineas] = useState<LineaPedido[]>([
    { codigoRepuesto: '', descripcion: '', cantidad: 1, motivo: '' }
  ]);
  const [clasificaciones, setClasificaciones] = useState<(ClasificacionRepuesto | null)[]>([null]);
  const [repuestosIA, setRepuestosIA] = useState<(RepuestoChangan | null)[]>([null]);
  const [sugerenciasIA, setSugerenciasIA] = useState<(RepuestoChangan[] | null)[]>([null]);
  
  const [timestamp, setTimestamp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (view === 'newOrder' && !numeroPedido) {
      generarNumeroPedido();
    }
    
    // Descargar PDF automáticamente al llegar a la vista de éxito
    if (view === 'success' && numeroPedido && timestamp) {
      const datosPDF = {
        numeroPedido,
        canal,
        sucursal: auth.sucursal || '',
        colaborador: auth.nombre,
        cliente,
        modelo,
        vin,
        placa,
        noCotizacion,
        observaciones,
        lineas,
        timestamp
      };
      
      // Esperar un momento para que la vista se renderice
      setTimeout(() => {
        generarPDFPedido(datosPDF);
      }, 500);
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
    setRepuestosIA([...repuestosIA, null]);
    setSugerenciasIA([...sugerenciasIA, null]);
  };

  const removeLinea = (idx: number) => {
    if (lineas.length <= 1) return;
    setLineas(lineas.filter((_, i) => i !== idx));
    setClasificaciones(clasificaciones.filter((_, i) => i !== idx));
    setRepuestosIA(repuestosIA.filter((_, i) => i !== idx));
    setSugerenciasIA(sugerenciasIA.filter((_, i) => i !== idx));
  };

  const updateLinea = (idx: number, field: keyof LineaPedido, value: string | number) => {
    const updated = [...lineas];
    updated[idx] = { ...updated[idx], [field]: value };
    setLineas(updated);

    // Clasificación automática con IA
    if (field === 'codigoRepuesto' || field === 'descripcion') {
      const codigo = field === 'codigoRepuesto' ? String(value) : updated[idx].codigoRepuesto;
      const descripcion = field === 'descripcion' ? String(value) : updated[idx].descripcion;
      
      if (codigo || descripcion) {
        // Usar IA para reconocimiento
        const resultadoIA = IAReconocimientoRepuestos.reconocerRepuesto(codigo || descripcion);
        
        // Actualizar clasificación
        const newClasificaciones = [...clasificaciones];
        if (resultadoIA.clasificacion) {
          newClasificaciones[idx] = {
            transporte: resultadoIA.clasificacion.viaTransporte,
            pesoUnitarioKg: resultadoIA.repuesto?.peso || 2,
            largoCm: resultadoIA.repuesto?.dimensiones.largo || 30,
            anchoCm: resultadoIA.repuesto?.dimensiones.ancho || 20,
            altoCm: resultadoIA.repuesto?.dimensiones.alto || 15,
            pesoVolumetricoKg: resultadoIA.repuesto ? 
              IAReconocimientoRepuestos.calcularPesoVolumetrico(resultadoIA.repuesto.dimensiones) : 1.8,
            categoria: resultadoIA.clasificacion.categoria as any,
            motivo: resultadoIA.repuesto ? 
              `Repuesto reconocido por IA - ${resultadoIA.repuesto.categoria}` : 
              'Clasificación automática',
            esDGR: resultadoIA.clasificacion.esDGR
          };
        }
        setClasificaciones(newClasificaciones);

        // Actualizar repuesto reconocido
        const newRepuestosIA = [...repuestosIA];
        newRepuestosIA[idx] = resultadoIA.repuesto || null;
        setRepuestosIA(newRepuestosIA);

        // Actualizar sugerencias
        const newSugerenciasIA = [...sugerenciasIA];
        newSugerenciasIA[idx] = resultadoIA.sugerencias || null;
        setSugerenciasIA(newSugerenciasIA);

        // Auto-completar descripción si se encontró el repuesto
        if (resultadoIA.repuesto && field === 'codigoRepuesto' && !updated[idx].descripcion) {
          updated[idx].descripcion = resultadoIA.repuesto.descripcion;
          setLineas([...updated]);
        }
      }
    }
  };

  const seleccionarSugerenciaIA = (idx: number, repuesto: RepuestoChangan) => {
    const updated = [...lineas];
    updated[idx] = {
      ...updated[idx],
      codigoRepuesto: repuesto.codigo,
      descripcion: repuesto.descripcion
    };
    setLineas(updated);

    // Actualizar clasificación
    const newClasificaciones = [...clasificaciones];
    newClasificaciones[idx] = {
      transporte: IAReconocimientoRepuestos.determinarViaTransporte(repuesto),
      pesoUnitarioKg: repuesto.peso,
      largoCm: repuesto.dimensiones.largo,
      anchoCm: repuesto.dimensiones.ancho,
      altoCm: repuesto.dimensiones.alto,
      pesoVolumetricoKg: IAReconocimientoRepuestos.calcularPesoVolumetrico(repuesto.dimensiones),
      categoria: repuesto.categoria as any,
      motivo: `Repuesto reconocido por IA - ${repuesto.categoria}`,
      esDGR: repuesto.esDGR
    };
    setClasificaciones(newClasificaciones);

    // Actualizar repuesto
    const newRepuestosIA = [...repuestosIA];
    newRepuestosIA[idx] = repuesto;
    setRepuestosIA(newRepuestosIA);

    // Limpiar sugerencias
    const newSugerenciasIA = [...sugerenciasIA];
    newSugerenciasIA[idx] = null;
    setSugerenciasIA(newSugerenciasIA);
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
      setPasoActual(3);
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
      placa,
      noCotizacion,
      observaciones,
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
    setPlaca('');
    setNoCotizacion('');
    setObservaciones('');
    setLineas([{ codigoRepuesto: '', descripcion: '', cantidad: 1, motivo: '' }]);
    setClasificaciones([null]);
    setRepuestosIA([null]);
    setSugerenciasIA([null]);
    setErrors({});
    setPasoActual(1);
    setMensajeAlerta(null);
    setView('newOrder');
  };

  const handleDatosExtraidosIA = (datos: {
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
  }) => {
    // Llenar datos del cliente
    if (datos.cliente) setCliente(datos.cliente);
    if (datos.vin) setVin(datos.vin);
    if (datos.placa) setPlaca(datos.placa);
    if (datos.cotizacion) setNoCotizacion(datos.cotizacion);
    if (datos.modeloAuto) {
      // Intentar extraer el modelo del texto
      const modeloDetectado = MODELOS_CHANGAN.find(m => 
        datos.modeloAuto?.toUpperCase().includes(m.toUpperCase())
      );
      if (modeloDetectado) setModelo(modeloDetectado);
    }

    // Llenar líneas de repuestos (evitando duplicados)
    if (datos.items && datos.items.length > 0) {
      setLineas(prev => {
        const codigosExistentes = new Set(prev.map(p => p.codigoRepuesto.toUpperCase()));
        const nuevos = datos.items.filter(it => !codigosExistentes.has(it.codigoRepuesto.toUpperCase()));
        
        const nuevasLineas = nuevos.map(r => ({
          codigoRepuesto: r.codigoRepuesto,
          descripcion: r.descripcionOficial,
          cantidad: r.cantidadSolicitada,
          motivo: ''
        }));
        
        const todasLasLineas = [...prev, ...nuevasLineas];
        
        // Inicializar clasificaciones y repuestosIA para las nuevas líneas
        setClasificaciones(prev => [...prev, ...nuevasLineas.map(() => null)]);
        setRepuestosIA(prev => [...prev, ...nuevasLineas.map(() => null)]);
        setSugerenciasIA(prev => [...prev, ...nuevasLineas.map(() => null)]);
        
        // Trigger classification for each new line
        nuevasLineas.forEach((linea, idx) => {
          const resultadoIA = IAReconocimientoRepuestos.reconocerRepuesto(linea.codigoRepuesto);
          if (resultadoIA.clasificacion) {
            const newClasificaciones = [...clasificaciones];
            const realIdx = prev.length + idx;
            newClasificaciones[realIdx] = {
              transporte: resultadoIA.clasificacion.viaTransporte,
              pesoUnitarioKg: resultadoIA.repuesto?.peso || 2,
              largoCm: resultadoIA.repuesto?.dimensiones.largo || 30,
              anchoCm: resultadoIA.repuesto?.dimensiones.ancho || 20,
              altoCm: resultadoIA.repuesto?.dimensiones.alto || 15,
              pesoVolumetricoKg: resultadoIA.repuesto ? 
                IAReconocimientoRepuestos.calcularPesoVolumetrico(resultadoIA.repuesto.dimensiones) : 1.8,
              categoria: resultadoIA.clasificacion.categoria as any,
              motivo: resultadoIA.repuesto ? 
                `Repuesto reconocido por IA - ${resultadoIA.repuesto.categoria}` : 
                'Clasificación automática',
              esDGR: resultadoIA.clasificacion.esDGR
            };
            setClasificaciones(newClasificaciones);
          }
          if (resultadoIA.repuesto) {
            const newRepuestosIA = [...repuestosIA];
            const realIdx = prev.length + idx;
            newRepuestosIA[realIdx] = resultadoIA.repuesto;
            setRepuestosIA(newRepuestosIA);
          }
        });
        
        return todasLasLineas;
      });
    }

    // Avanzar automáticamente al Paso 2 de revisión de ítems
    setPasoActual(2);
    setMensajeAlerta({
      tipo: 'info',
      texto: `✨ ¡Extracción SAP completada! Se cargaron los datos de ${datos.cliente} y ${datos.items.length} repuestos oficiales Changan.`
    });

    // Cambiar a vista de nuevo pedido
    setView('newOrder');
    
    // Auto-ocultar mensaje después de 5 segundos
    setTimeout(() => setMensajeAlerta(null), 5000);
  };

  const totalUnidades = lineas.reduce((sum, l) => sum + l.cantidad, 0);

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <button
                onClick={() => setModalExtractorAbierto(true)}
                className="glass-card rounded-2xl p-6 text-left hover:shadow-lg transition-all group cursor-pointer border-2 border-transparent hover:border-purple-400/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-robot text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-changan-blue">Extraer de Cotización</h3>
                    <p className="text-sm text-gray-500 mt-1">IA extrae datos de PDF/imagen</p>
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
              
              {/* Indicador de Pasos */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  pasoActual === 1 ? 'bg-changan-accent text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                  Datos del Pedido
                </div>
                <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  pasoActual === 2 ? 'bg-changan-accent text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
                  Repuestos
                </div>
                <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  pasoActual === 3 ? 'bg-changan-accent text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
                  Confirmar
                </div>
              </div>
            </div>

            {/* Mensaje de Alerta */}
            {mensajeAlerta && (
              <div className={`rounded-2xl p-4 mb-4 flex items-start gap-3 fade-in ${
                mensajeAlerta.tipo === 'success' ? 'bg-green-50 border border-green-200' :
                mensajeAlerta.tipo === 'error' ? 'bg-red-50 border border-red-200' :
                mensajeAlerta.tipo === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <i className={`fas ${
                  mensajeAlerta.tipo === 'success' ? 'fa-check-circle text-green-600' :
                  mensajeAlerta.tipo === 'error' ? 'fa-exclamation-circle text-red-600' :
                  mensajeAlerta.tipo === 'warning' ? 'fa-exclamation-triangle text-yellow-600' :
                  'fa-info-circle text-blue-600'
                } text-xl mt-0.5`}></i>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    mensajeAlerta.tipo === 'success' ? 'text-green-800' :
                    mensajeAlerta.tipo === 'error' ? 'text-red-800' :
                    mensajeAlerta.tipo === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {mensajeAlerta.texto}
                  </p>
                </div>
                <button 
                  onClick={() => setMensajeAlerta(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

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

                {/* Placa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placa del Vehículo</label>
                  <input 
                    type="text" 
                    value={placa} 
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="Ej: ABC123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl font-mono uppercase"
                  />
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
                  <span className="text-xs bg-changan-light text-changan-accent px-2 py-1 rounded-full">
                    <i className="fas fa-robot mr-1"></i>IA Activa
                  </span>
                </h3>
              </div>

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

                    {/* Sugerencias de IA */}
                    {sugerenciasIA[idx] && sugerenciasIA[idx]!.length > 0 && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <i className="fas fa-robot text-purple-600"></i>
                          <span className="text-xs font-bold text-purple-800">Sugerencias de IA:</span>
                        </div>
                        <div className="space-y-2">
                          {sugerenciasIA[idx]!.map((sug, sugIdx) => (
                            <button
                              key={sugIdx}
                              onClick={() => seleccionarSugerenciaIA(idx, sug)}
                              className="w-full text-left p-2 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-mono font-bold text-purple-900">{sug.codigo}</p>
                                  <p className="text-xs text-gray-600">{sug.descripcion}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-green-600">${sug.precioEstimado}</p>
                                  <p className="text-[10px] text-gray-500">{sug.peso} kg</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Botón Agregar Línea - AL FINAL */}
                <button 
                  onClick={addLinea} 
                  className="w-full py-3 border-2 border-dashed border-changan-accent/30 hover:border-changan-accent text-changan-accent hover:bg-changan-light rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus"></i>
                  Agregar Línea de Repuesto
                </button>
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
                  {placa && (
                    <div>
                      <span className="text-gray-500 block text-xs">Placa</span>
                      <span className="font-mono font-medium">{placa}</span>
                    </div>
                  )}
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

              {/* Resumen de Líneas */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Cant.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lineas.map((l, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-xs">{l.codigoRepuesto}</td>
                        <td className="px-3 py-2">{l.descripcion}</td>
                        <td className="px-3 py-2 text-center font-bold">{l.cantidad}</td>
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
                onClick={() => { setPasoActual(2); setView('newOrder'); }} 
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
              <p className="text-gray-500 mb-2">El pedido ha sido registrado exitosamente.</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 flex items-center gap-2">
                <i className="fas fa-file-pdf text-red-600"></i>
                <p className="text-sm text-green-800">
                  <strong>PDF generado automáticamente</strong> — Revisa tu carpeta de descargas
                </p>
              </div>
              
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
                {vin && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">VIN:</span>
                    <span className="font-mono text-xs">{vin}</span>
                  </div>
                )}
                {placa && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Placa:</span>
                    <span className="font-mono font-medium">{placa}</span>
                  </div>
                )}
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

              {/* Botón para re-descargar PDF */}
              <button 
                onClick={() => {
                  const datosPDF = {
                    numeroPedido,
                    canal,
                    sucursal: auth.sucursal || '',
                    colaborador: auth.nombre,
                    cliente,
                    modelo,
                    vin,
                    placa,
                    noCotizacion,
                    observaciones,
                    lineas,
                    timestamp
                  };
                  generarPDFPedido(datosPDF);
                }}
                className="w-full mb-3 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-file-pdf"></i>
                Descargar PDF Nuevamente
              </button>

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

      {/* Modal Extractor Inteligente de Cotizaciones SAP */}
      <SmartSAPPdfExtractorModal
        isOpen={modalExtractorAbierto}
        onClose={() => setModalExtractorAbierto(false)}
        onAplicarDatos={handleDatosExtraidosIA}
      />
    </div>
  );
}
