/**
 * Panel de Administración - CEDIS Changan Panamá
 */

import { useState } from 'react';
import type { AuthState, DPLDetalle, DPLManifiesto, FilaRastreador } from '../../domain/models/types';
import { ModalRastreadorUniversal } from './ModalRastreadorUniversal';
import { calcularKPIs, ejecutarMatchingFIFO } from '../../domain/services';
import { CruceDPL } from './CruceDPL';
import { ImportarDatosPanel } from './ImportarDatosPanel';
import { 
  obtenerAsesores, 
  obtenerManifiestos, 
  obtenerDetallesDPL, 
  obtenerPedidos 
} from '../../domain/services/importacionDatos';

interface AdminDashboardProps {
  auth: AuthState;
  onLogout: () => void;
}

// Obtener datos desde localStorage (importados desde Google Sheets)
const DEMO_INVENTARIO: DPLDetalle[] = obtenerDetallesDPL();
const DEMO_MANIFIESTOS: DPLManifiesto[] = obtenerManifiestos();
const DEMO_FILAS: FilaRastreador[] = obtenerPedidos();

export default function AdminDashboard({ auth, onLogout }: AdminDashboardProps) {
  const [modalRastreadorAbierto, setModalRastreadorAbierto] = useState(false);
  const [codigoInicial, setCodigoInicial] = useState('');
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'kpis' | 'matching' | 'cruceDPL' | 'importar'>('dashboard');
  const [modalDPLAbierto, setModalDPLAbierto] = useState(false);

  const handleAbrirRastreador = (codigo?: string) => {
    setCodigoInicial(codigo || '');
    setModalRastreadorAbierto(true);
  };

  const handleCerrarRastreador = () => {
    setModalRastreadorAbierto(false);
    setCodigoInicial('');
  };

  const kpis = calcularKPIs(DEMO_FILAS, DEMO_INVENTARIO);
  const matchingResult = ejecutarMatchingFIFO(DEMO_FILAS, DEMO_INVENTARIO);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-shield text-2xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold">Panel de Administración</h1>
                <p className="text-sm text-red-200">CEDIS Changan Panamá</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
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
          <button
            onClick={() => setVistaActiva('importar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActiva === 'importar' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-database mr-2"></i>Importar Datos
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
                    <p className="text-3xl font-bold text-gray-900 mt-2">{DEMO_INVENTARIO.reduce((sum, i) => sum + i.cantidadTotal, 0)}</p>
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
                    <p className="text-3xl font-bold text-gray-900 mt-2">{DEMO_MANIFIESTOS.length}</p>
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
                    <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">Actividad Reciente</h2>
              <div className="space-y-4">
                {DEMO_FILAS.slice(0, 3).map((fila) => (
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

        {/* Vista Importar Datos */}
        {vistaActiva === 'importar' && (
          <div className="fade-in">
            <ImportarDatosPanel />
          </div>
        )}
      </main>

      {/* Modal Rastreador */}
      <ModalRastreadorUniversal
        isOpen={modalRastreadorAbierto}
        onClose={handleCerrarRastreador}
        filas={DEMO_FILAS}
        inventario={DEMO_INVENTARIO}
        manifiestos={DEMO_MANIFIESTOS}
        codigoInicial={codigoInicial}
      />
    </div>
  );
}
