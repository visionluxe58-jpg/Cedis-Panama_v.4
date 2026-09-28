/**
 * Panel de Administración - CEDIS Changan Panamá
 */

import { useState, useEffect } from 'react';
import type { AuthState, DPLDetalle, DPLManifiesto, FilaRastreador } from '../../domain/models/types';
import { ModalRastreadorUniversal } from './ModalRastreadorUniversal';
import { calcularKPIs, ejecutarMatchingFIFO } from '../../domain/services';
import { CruceDPL } from './CruceDPL';
import {
  isSupabaseConfigured,
  obtenerFilasAdminSupabase,
  obtenerManifiestosSupabase,
  obtenerDetalleInventarioSupabase,
  suscribirCambiosPedidosSupabase,
} from '../../data/api/supabaseClient';

interface AdminDashboardProps {
  auth: AuthState;
  onLogout: () => void;
}

// Datos de demo para fallback si las tablas de Supabase están aún vacías
const DEMO_INVENTARIO: DPLDetalle[] = [
  { inventarioId: 'INV-001', contenedorId: 'CONT-2024-001', palletCaseNo: 'P001', packageNo: 'PKG-001', codigoRepuesto: '1422020-KC01', descripcion: 'Filtro de aceite motor', cantidadTotal: 100, cantidadAsignada: 30, cantidadDespachada: 20, saldoDisponible: 50, ubicacionCedis: 'CEDIS-A1-R1' },
  { inventarioId: 'INV-002', contenedorId: 'CONT-2024-001', palletCaseNo: 'P001', packageNo: 'PKG-002', codigoRepuesto: '2213010-B01', descripcion: 'Pastillas de freno delanteras', cantidadTotal: 80, cantidadAsignada: 25, cantidadDespachada: 15, saldoDisponible: 40, ubicacionCedis: 'CEDIS-A1-R2' },
  { inventarioId: 'INV-003', contenedorId: 'CONT-2024-002', palletCaseNo: 'P002', packageNo: 'PKG-001', codigoRepuesto: '3501010-B01', descripcion: 'Kit de correa de distribución', cantidadTotal: 60, cantidadAsignada: 20, cantidadDespachada: 10, saldoDisponible: 30, ubicacionCedis: 'CEDIS-B2-R1' },
  { inventarioId: 'INV-004', contenedorId: 'CONT-2024-002', palletCaseNo: 'P002', packageNo: 'PKG-002', codigoRepuesto: '4611010-KC1', descripcion: 'Amortiguador delantero izquierdo', cantidadTotal: 40, cantidadAsignada: 15, cantidadDespachada: 8, saldoDisponible: 17, ubicacionCedis: 'CEDIS-B2-R2' },
  { inventarioId: 'INV-005', contenedorId: 'CONT-2024-003', palletCaseNo: 'P003', packageNo: 'PKG-001', codigoRepuesto: '5201010-B01', descripcion: 'Bujías de ignición (set x4)', cantidadTotal: 200, cantidadAsignada: 80, cantidadDespachada: 50, saldoDisponible: 70, ubicacionCedis: 'CEDIS-C1-R1' }
];

const DEMO_MANIFIESTOS: DPLManifiesto[] = [
  { contenedorId: 'CONT-2024-001', proveedor: 'Changan China Parts', fechaArribo: '2024-01-15', poReferencia: 'PO-2024-001', tipoTransporte: 'Marítimo 40HQ', totalPiezas: 180, skusUnicos: 2, totalPallets: 1, estado: 'RECIBIDO', creadoPor: 'Admin', creadoEn: '2024-01-10', blReferencia: 'BL-2024-001' },
  { contenedorId: 'CONT-2024-002', proveedor: 'Changan China Parts', fechaArribo: '2024-01-20', poReferencia: 'PO-2024-002', tipoTransporte: 'Marítimo 40HQ', totalPiezas: 100, skusUnicos: 2, totalPallets: 1, estado: 'RECIBIDO', creadoPor: 'Admin', creadoEn: '2024-01-12', blReferencia: 'BL-2024-002' },
  { contenedorId: 'CONT-2024-003', proveedor: 'Changan China Parts', fechaArribo: '2024-01-25', poReferencia: 'PO-2024-003', tipoTransporte: 'Marítimo 20GP', totalPiezas: 200, skusUnicos: 1, totalPallets: 1, estado: 'ADUANA', creadoPor: 'Admin', creadoEn: '2024-01-15', blReferencia: 'BL-2024-003' }
];

const DEMO_FILAS: FilaRastreador[] = [
  { lineaId: 'LIN-001', pedidoId: 'PED-VL-001', codigoRepuesto: '1422020-KC01', descripcionOficial: 'Filtro de aceite motor', cantidadSolicitada: 10, cantidadAsignada: 10, cantidadDespachada: 5, estatusLinea: 'Asignado', contenedorAsignado: 'CONT-2024-001', palletAsignado: 'P001', packageNo: 'PKG-001', ubicacionCedis: 'CEDIS-A1-R1', sucursal: 'Villa Lucre', colaborador: 'Leidys Perez', cliente: 'María González', modeloChangan: 'CS35 Plus', numeroOR: 'OR-2024-001', vin: 'LS5A3ABR8NA000001' },
  { lineaId: 'LIN-002', pedidoId: 'PED-TM-001', codigoRepuesto: '2213010-B01', descripcionOficial: 'Pastillas de freno delanteras', cantidadSolicitada: 8, cantidadAsignada: 8, cantidadDespachada: 8, estatusLinea: 'Despachado', contenedorAsignado: 'CONT-2024-001', palletAsignado: 'P001', packageNo: 'PKG-002', ubicacionCedis: 'CEDIS-A1-R2', sucursal: 'Tumba Muerto', colaborador: 'Ulisses Urriola', cliente: 'Juan Rodríguez', modeloChangan: 'CS55 Plus', numeroOR: 'OR-2024-002', vin: 'LS5A3ABR8NA000002' },
  { lineaId: 'LIN-003', pedidoId: 'PED-C50-001', codigoRepuesto: '3501010-B01', descripcionOficial: 'Kit de correa de distribución', cantidadSolicitada: 5, cantidadAsignada: 5, cantidadDespachada: 0, estatusLinea: 'Asignado', contenedorAsignado: 'CONT-2024-002', palletAsignado: 'P002', packageNo: 'PKG-001', ubicacionCedis: 'CEDIS-B2-R1', sucursal: 'Calle 50', colaborador: 'Edilson Uribe', cliente: 'Ana Martínez', modeloChangan: 'UNI-K', numeroOR: 'OR-2024-003', vin: 'LS5A3ABR8NA000003' },
  { lineaId: 'LIN-004', pedidoId: 'PED-CV-001', codigoRepuesto: '4611010-KC1', descripcionOficial: 'Amortiguador delantero izquierdo', cantidadSolicitada: 3, cantidadAsignada: 0, cantidadDespachada: 0, estatusLinea: 'Sin Stock', contenedorAsignado: '', palletAsignado: '', packageNo: '', ubicacionCedis: '', sucursal: 'Costa Verde', colaborador: 'Arquimedes Jordan', cliente: 'Pedro Sánchez', modeloChangan: 'CS75 Plus', numeroOR: 'OR-2024-004', vin: 'LS5A3ABR8NA000004' },
  { lineaId: 'LIN-005', pedidoId: 'PED-CH-001', codigoRepuesto: '5201010-B01', descripcionOficial: 'Bujías de ignición (set x4)', cantidadSolicitada: 15, cantidadAsignada: 15, cantidadDespachada: 10, estatusLinea: 'Asignado', contenedorAsignado: 'CONT-2024-003', palletAsignado: 'P003', packageNo: 'PKG-001', ubicacionCedis: 'CEDIS-C1-R1', sucursal: 'Chiriquí', colaborador: 'Nivardo Gutierres', cliente: 'Laura Fernández', modeloChangan: 'Alsvin', numeroOR: 'OR-2024-005', vin: 'LS5A3ABR8NA000005' }
];

export default function AdminDashboard({ auth, onLogout }: AdminDashboardProps) {
  const [modalRastreadorAbierto, setModalRastreadorAbierto] = useState(false);
  const [codigoInicial, setCodigoInicial] = useState('');
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'kpis' | 'matching' | 'cruceDPL'>('dashboard');
  const [modalDPLAbierto, setModalDPLAbierto] = useState(false);

  // Estado reactivo centralizado con Supabase
  const [filas, setFilas] = useState<FilaRastreador[]>(DEMO_FILAS);
  const [inventario, setInventario] = useState<DPLDetalle[]>(DEMO_INVENTARIO);
  const [manifiestos, setManifiestos] = useState<DPLManifiesto[]>(DEMO_MANIFIESTOS);
  const [isLive, setIsLive] = useState<boolean>(isSupabaseConfigured());
  const [cargando, setCargando] = useState<boolean>(false);
  const [ultimoSync, setUltimoSync] = useState<string>('');
  const [registrosCargados, setRegistrosCargados] = useState({
    pedidos: 0,
    inventario: 0,
    manifiestos: 0,
    usandoDatosReales: false,
  });

  const cargarDatos = async () => {
    if (!isSupabaseConfigured()) return;
    setCargando(true);
    try {
      const [realFilas, realManifiestos, realInventario] = await Promise.all([
        obtenerFilasAdminSupabase(),
        obtenerManifiestosSupabase(),
        obtenerDetalleInventarioSupabase(),
      ]);

      const hayFilas = realFilas && realFilas.length > 0;
      const hayManifiestos = realManifiestos && realManifiestos.length > 0;
      const hayInventario = realInventario && realInventario.length > 0;

      if (hayFilas) setFilas(realFilas);
      if (hayManifiestos) setManifiestos(realManifiestos);
      if (hayInventario) setInventario(realInventario);

      const usandoReales = hayFilas || hayManifiestos || hayInventario;
      if (usandoReales) {
        setIsLive(true);
      }

      setRegistrosCargados({
        pedidos: hayFilas ? realFilas.length : 0,
        manifiestos: hayManifiestos ? realManifiestos.length : 0,
        inventario: hayInventario ? realInventario.length : 0,
        usandoDatosReales: Boolean(usandoReales),
      });

      setUltimoSync(new Date().toLocaleTimeString('es-PA'));
    } catch (err) {
      console.error('Error cargando datos de Supabase en Admin:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    // Suscripción a cambios en tiempo real en Supabase
    const desuscribir = suscribirCambiosPedidosSupabase(() => {
      cargarDatos();
    });

    return () => {
      desuscribir();
    };
  }, []);

  const handleAbrirRastreador = (codigo?: string) => {
    setCodigoInicial(codigo || '');
    setModalRastreadorAbierto(true);
  };

  const handleCerrarRastreador = () => {
    setModalRastreadorAbierto(false);
    setCodigoInicial('');
  };

  const kpis = calcularKPIs(filas, inventario);
  const matchingResult = ejecutarMatchingFIFO(filas, inventario);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-shield text-2xl"></i>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold">Panel de Administración</h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      registrosCargados.usandoDatosReales
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                        : isLive
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30'
                        : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    ></span>
                    {registrosCargados.usandoDatosReales
                      ? `Supabase en Vivo (${registrosCargados.pedidos} pedidos, ${registrosCargados.inventario} repuestos)`
                      : isLive
                      ? 'Supabase Conectado (Esperando datos)'
                      : 'Modo Demo'}
                  </span>
                </div>
                <p className="text-sm text-red-200">CEDIS Changan Panamá</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Botón de Sincronización Manual */}
              <button
                onClick={cargarDatos}
                disabled={cargando}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-lg text-xs font-semibold transition-all border border-white/20 disabled:opacity-50 shadow-sm"
                title="Actualizar datos directamente desde Supabase"
              >
                <i className={`fas fa-sync-alt ${cargando ? 'animate-spin text-cyan-300' : 'text-white'}`}></i>
                <span>{cargando ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>

              {ultimoSync && (
                <span className="text-[11px] text-red-200 hidden lg:inline">
                  Sinc: {ultimoSync}
                </span>
              )}

              <div className="text-right hidden sm:block border-l border-white/20 pl-3 ml-1">
                <p className="text-sm font-medium">{auth.nombre}</p>
                <p className="text-xs text-red-200">{auth.email}</p>
              </div>
              <button onClick={onLogout} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                <i className="fas fa-sign-out-alt mr-2"></i>Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Navegación de Vistas */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setVistaActiva('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActiva === 'dashboard' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-tachometer-alt mr-2"></i>Dashboard
          </button>
          <button
            onClick={() => setVistaActiva('kpis')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActiva === 'kpis' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-chart-line mr-2"></i>KPIs Logísticos
          </button>
          <button
            onClick={() => setVistaActiva('matching')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActiva === 'matching' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-random mr-2"></i>Matching FIFO
          </button>
          <button
            onClick={() => setVistaActiva('cruceDPL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActiva === 'cruceDPL' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-ship mr-2"></i>Gestión DPL
          </button>
        </div>

        {/* Vista Dashboard */}
        {vistaActiva === 'dashboard' && (
          <div className="fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Pedidos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.totalPedidos}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {registrosCargados.pedidos > 0 ? `${registrosCargados.pedidos} líneas en Supabase` : `${filas.length} líneas cargadas`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-file-alt text-blue-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Inventario DPL</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {inventario.reduce((sum, i) => sum + i.cantidadTotal, 0)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {registrosCargados.inventario > 0 ? `${registrosCargados.inventario} SKUs en Supabase` : `${inventario.length} ítems en almacén`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-boxes text-green-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contenedores</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{manifiestos.length}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {registrosCargados.manifiestos > 0 ? `${registrosCargados.manifiestos} en Supabase` : `${manifiestos.length} manifiestos DPL`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-ship text-purple-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Sucursales</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {new Set(filas.map(f => f.sucursal).filter(Boolean)).size || 5}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Red CEDIS Panamá</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-building text-orange-600 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleAbrirRastreador()}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <i className="fas fa-search text-xl"></i>
                  <div className="text-left">
                    <p className="font-bold">Rastreador Universal</p>
                    <p className="text-xs text-cyan-100">Buscar repuestos en todo el sistema</p>
                  </div>
                </button>

                <button
                  onClick={() => setVistaActiva('kpis')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <i className="fas fa-chart-line text-xl"></i>
                  <div className="text-left">
                    <p className="font-bold">KPIs Logísticos</p>
                    <p className="text-xs text-indigo-100">Ver indicadores clave</p>
                  </div>
                </button>

                <button
                  onClick={() => setVistaActiva('matching')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <i className="fas fa-random text-xl"></i>
                  <div className="text-left">
                    <p className="font-bold">Matching FIFO</p>
                    <p className="text-xs text-rose-100">Conciliación automática</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Actividad Reciente {isLive ? '(Tiempo Real)' : '(Modo Demo)'}</h2>
                {cargando && <span className="text-xs text-gray-400">Actualizando...</span>}
              </div>
              <div className="space-y-4">
                {filas.slice(0, 6).map((fila) => (
                  <div key={fila.lineaId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-box text-blue-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{fila.codigoRepuesto}</p>
                        <p className="text-sm text-gray-500">{fila.descripcionOficial}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {fila.sucursal} • {fila.colaborador} • {fila.cliente}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        fila.estatusLinea === 'Despachado' ? 'bg-green-100 text-green-700' :
                        fila.estatusLinea === 'Asignado' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {fila.estatusLinea}
                      </span>
                      <button
                        onClick={() => handleAbrirRastreador(fila.codigoRepuesto)}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Rastrear
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vista KPIs */}
        {vistaActiva === 'kpis' && (
          <div className="fade-in">
            <div className="bg-slate-950 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">KPIs Logísticos Internacionales</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Fill Rate</span>
                    <i className="fas fa-chart-pie text-emerald-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.fillRate}%</div>
                  <div className="text-xs text-slate-400 mt-1">{kpis.piezasCubiertas} de {kpis.totalPiezasSolicitadas} piezas</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>OTIF</span>
                    <i className="fas fa-check-circle text-sky-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.otif}%</div>
                  <div className="text-xs text-slate-400 mt-1">On-Time In-Full</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Quiebre Stock</span>
                    <i className="fas fa-exclamation-triangle text-amber-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.quiebreStock}%</div>
                  <div className="text-xs text-slate-400 mt-1">Líneas sin stock</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Tiempo Ciclo</span>
                    <i className="fas fa-clock text-indigo-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.tiempoCiclo}h</div>
                  <div className="text-xs text-slate-400 mt-1">Promedio horas</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Exactitud Inv.</span>
                    <i className="fas fa-warehouse text-purple-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.exactitudInventario}%</div>
                  <div className="text-xs text-slate-400 mt-1">IRA</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Picking</span>
                    <i className="fas fa-bullseye text-teal-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.exactitudPicking}%</div>
                  <div className="text-xs text-slate-400 mt-1">Con PDT</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Cruce DPL</span>
                    <i className="fas fa-exchange-alt text-orange-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.efectividadCruce}%</div>
                  <div className="text-xs text-slate-400 mt-1">Automático</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Pedido Perfecto</span>
                    <i className="fas fa-award text-yellow-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.pedidoPerfecto}%</div>
                  <div className="text-xs text-slate-400 mt-1">Sin errores</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista Matching FIFO */}
        {vistaActiva === 'matching' && (
          <div className="fade-in">
            <div className="bg-slate-950 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Motor de Conciliación FIFO</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-xs font-semibold uppercase mb-2">Total Líneas</div>
                  <div className="text-3xl font-black text-white">{matchingResult.totalLineas}</div>
                </div>

                <div className="bg-slate-900 border border-emerald-800/50 rounded-xl p-4 border-t-2 border-t-emerald-500">
                  <div className="text-emerald-400 text-xs font-semibold uppercase mb-2">Asignadas Total</div>
                  <div className="text-3xl font-black text-emerald-400">{matchingResult.asignadasTotales}</div>
                </div>

                <div className="bg-slate-900 border border-amber-800/50 rounded-xl p-4 border-t-2 border-t-amber-500">
                  <div className="text-amber-400 text-xs font-semibold uppercase mb-2">Asignadas Parcial</div>
                  <div className="text-3xl font-black text-amber-400">{matchingResult.asignadasParciales}</div>
                </div>

                <div className="bg-slate-900 border border-rose-800/50 rounded-xl p-4 border-t-2 border-t-rose-500">
                  <div className="text-rose-400 text-xs font-semibold uppercase mb-2">Sin Stock</div>
                  <div className="text-3xl font-black text-rose-400">{matchingResult.sinStock}</div>
                </div>

                <div className="bg-slate-900 border border-sky-800/50 rounded-xl p-4 border-t-2 border-t-sky-500">
                  <div className="text-sky-400 text-xs font-semibold uppercase mb-2">Piezas Asignadas</div>
                  <div className="text-3xl font-black text-sky-400">{matchingResult.piezasAsignadas}</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-300">{matchingResult.mensaje}</p>
                <p className="text-xs text-slate-500 mt-1">Ejecutado: {new Date(matchingResult.timestamp).toLocaleString('es-PA')}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50 border-b border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Pedido</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Código</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Solicitado</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Asignado</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Contenedor</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {matchingResult.detalles.map((detalle: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-slate-300 font-mono text-xs">{detalle.pedidoId}</td>
                          <td className="px-4 py-3 text-cyan-400 font-mono text-xs font-bold">{detalle.codigoRepuesto}</td>
                          <td className="px-4 py-3 text-center text-white font-bold">{detalle.cantidadSolicitada}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${
                              detalle.cantidadAsignada === detalle.cantidadSolicitada ? 'text-emerald-400' :
                              detalle.cantidadAsignada > 0 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {detalle.cantidadAsignada}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">{detalle.contenedorAsignado || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                              detalle.estatusLinea === 'Asignado' ? 'bg-emerald-500/20 text-emerald-400' :
                              detalle.estatusLinea === 'Asignado Parcial' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-rose-500/20 text-rose-400'
                            }`}>
                              {detalle.estatusLinea}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista Gestión DPL */}
        {vistaActiva === 'cruceDPL' && (
          <div className="fade-in">
            <div className="bg-slate-950 rounded-2xl p-6">
              <CruceDPL
                usuario={{
                  id: auth.id,
                  nombre: auth.nombre,
                  rol: 'ADMINISTRADOR_CEDIS',
                  sucursal: auth.sucursal
                }}
                onAbrirModalDPL={() => setModalDPLAbierto(true)}
                onAbrirRastreador={handleAbrirRastreador}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modal Rastreador Universal */}
      <ModalRastreadorUniversal
        isOpen={modalRastreadorAbierto}
        onClose={handleCerrarRastreador}
        filas={filas}
        inventario={inventario}
        manifiestos={manifiestos}
        codigoInicial={codigoInicial}
      />
    </div>
  );
}
