import { useState } from 'react';
import type { DPLDetalle, DPLManifiesto, FilaRastreador } from '../../domain/models/types';
import { ModalRastreadorUniversal } from './ModalRastreadorUniversal';

// Datos de demo para el inventario DPL
const DEMO_INVENTARIO: DPLDetalle[] = [
  {
    inventarioId: 'INV-001',
    contenedorId: 'CONT-2024-001',
    palletCaseNo: 'P001',
    packageNo: 'PKG-001',
    codigoRepuesto: '1422020-KC01',
    descripcion: 'Filtro de aceite motor',
    cantidadTotal: 100,
    cantidadAsignada: 30,
    cantidadDespachada: 20,
    saldoDisponible: 50,
    ubicacionCedis: 'CEDIS-A1-R1'
  },
  {
    inventarioId: 'INV-002',
    contenedorId: 'CONT-2024-001',
    palletCaseNo: 'P001',
    packageNo: 'PKG-002',
    codigoRepuesto: '2213010-B01',
    descripcion: 'Pastillas de freno delanteras',
    cantidadTotal: 80,
    cantidadAsignada: 25,
    cantidadDespachada: 15,
    saldoDisponible: 40,
    ubicacionCedis: 'CEDIS-A1-R2'
  },
  {
    inventarioId: 'INV-003',
    contenedorId: 'CONT-2024-002',
    palletCaseNo: 'P002',
    packageNo: 'PKG-001',
    codigoRepuesto: '3501010-B01',
    descripcion: 'Kit de correa de distribución',
    cantidadTotal: 60,
    cantidadAsignada: 20,
    cantidadDespachada: 10,
    saldoDisponible: 30,
    ubicacionCedis: 'CEDIS-B2-R1'
  },
  {
    inventarioId: 'INV-004',
    contenedorId: 'CONT-2024-002',
    palletCaseNo: 'P002',
    packageNo: 'PKG-002',
    codigoRepuesto: '4611010-KC1',
    descripcion: 'Amortiguador delantero izquierdo',
    cantidadTotal: 40,
    cantidadAsignada: 15,
    cantidadDespachada: 8,
    saldoDisponible: 17,
    ubicacionCedis: 'CEDIS-B2-R2'
  },
  {
    inventarioId: 'INV-005',
    contenedorId: 'CONT-2024-003',
    palletCaseNo: 'P003',
    packageNo: 'PKG-001',
    codigoRepuesto: '5201010-B01',
    descripcion: 'Bujías de ignición (set x4)',
    cantidadTotal: 200,
    cantidadAsignada: 80,
    cantidadDespachada: 50,
    saldoDisponible: 70,
    ubicacionCedis: 'CEDIS-C1-R1'
  }
];

// Datos de demo para manifiestos
const DEMO_MANIFIESTOS: DPLManifiesto[] = [
  {
    contenedorId: 'CONT-2024-001',
    proveedor: 'Changan China Parts',
    fechaArribo: '2024-01-15',
    poReferencia: 'PO-2024-001',
    tipoTransporte: 'Marítimo 40HQ',
    totalPiezas: 180,
    skusUnicos: 2,
    totalPallets: 1,
    estado: 'RECIBIDO',
    creadoPor: 'Admin',
    creadoEn: '2024-01-10',
    blReferencia: 'BL-2024-001'
  },
  {
    contenedorId: 'CONT-2024-002',
    proveedor: 'Changan China Parts',
    fechaArribo: '2024-01-20',
    poReferencia: 'PO-2024-002',
    tipoTransporte: 'Marítimo 40HQ',
    totalPiezas: 100,
    skusUnicos: 2,
    totalPallets: 1,
    estado: 'RECIBIDO',
    creadoPor: 'Admin',
    creadoEn: '2024-01-12',
    blReferencia: 'BL-2024-002'
  },
  {
    contenedorId: 'CONT-2024-003',
    proveedor: 'Changan China Parts',
    fechaArribo: '2024-01-25',
    poReferencia: 'PO-2024-003',
    tipoTransporte: 'Marítimo 20GP',
    totalPiezas: 200,
    skusUnicos: 1,
    totalPallets: 1,
    estado: 'ADUANA',
    creadoPor: 'Admin',
    creadoEn: '2024-01-15',
    blReferencia: 'BL-2024-003'
  }
];

// Datos de demo para filas de pedidos
const DEMO_FILAS: FilaRastreador[] = [
  {
    lineaId: 'LIN-001',
    pedidoId: 'PED-VL-001',
    codigoRepuesto: '1422020-KC01',
    descripcionOficial: 'Filtro de aceite motor',
    cantidadSolicitada: 10,
    cantidadAsignada: 10,
    cantidadDespachada: 5,
    estatusLinea: 'Asignado',
    contenedorAsignado: 'CONT-2024-001',
    palletAsignado: 'P001',
    packageNo: 'PKG-001',
    ubicacionCedis: 'CEDIS-A1-R1',
    sucursal: 'Villa Lucre',
    colaborador: 'Leidys Perez',
    cliente: 'María González',
    modeloChangan: 'CS35 Plus',
    numeroOR: 'OR-2024-001',
    vin: 'LS5A3ABR8NA000001'
  },
  {
    lineaId: 'LIN-002',
    pedidoId: 'PED-TM-001',
    codigoRepuesto: '2213010-B01',
    descripcionOficial: 'Pastillas de freno delanteras',
    cantidadSolicitada: 8,
    cantidadAsignada: 8,
    cantidadDespachada: 8,
    estatusLinea: 'Despachado',
    contenedorAsignado: 'CONT-2024-001',
    palletAsignado: 'P001',
    packageNo: 'PKG-002',
    ubicacionCedis: 'CEDIS-A1-R2',
    sucursal: 'Tumba Muerto',
    colaborador: 'Ulisses Urriola',
    cliente: 'Juan Rodríguez',
    modeloChangan: 'CS55 Plus',
    numeroOR: 'OR-2024-002',
    vin: 'LS5A3ABR8NA000002'
  },
  {
    lineaId: 'LIN-003',
    pedidoId: 'PED-C50-001',
    codigoRepuesto: '3501010-B01',
    descripcionOficial: 'Kit de correa de distribución',
    cantidadSolicitada: 5,
    cantidadAsignada: 5,
    cantidadDespachada: 0,
    estatusLinea: 'Asignado',
    contenedorAsignado: 'CONT-2024-002',
    palletAsignado: 'P002',
    packageNo: 'PKG-001',
    ubicacionCedis: 'CEDIS-B2-R1',
    sucursal: 'Calle 50',
    colaborador: 'Edilson Uribe',
    cliente: 'Ana Martínez',
    modeloChangan: 'UNI-K',
    numeroOR: 'OR-2024-003',
    vin: 'LS5A3ABR8NA000003'
  },
  {
    lineaId: 'LIN-004',
    pedidoId: 'PED-CV-001',
    codigoRepuesto: '4611010-KC1',
    descripcionOficial: 'Amortiguador delantero izquierdo',
    cantidadSolicitada: 3,
    cantidadAsignada: 0,
    cantidadDespachada: 0,
    estatusLinea: 'Sin Stock',
    contenedorAsignado: '',
    palletAsignado: '',
    packageNo: '',
    ubicacionCedis: '',
    sucursal: 'Costa Verde',
    colaborador: 'Arquimedes Jordan',
    cliente: 'Pedro Sánchez',
    modeloChangan: 'CS75 Plus',
    numeroOR: 'OR-2024-004',
    vin: 'LS5A3ABR8NA000004'
  },
  {
    lineaId: 'LIN-005',
    pedidoId: 'PED-CH-001',
    codigoRepuesto: '5201010-B01',
    descripcionOficial: 'Bujías de ignición (set x4)',
    cantidadSolicitada: 15,
    cantidadAsignada: 15,
    cantidadDespachada: 10,
    estatusLinea: 'Asignado',
    contenedorAsignado: 'CONT-2024-003',
    palletAsignado: 'P003',
    packageNo: 'PKG-001',
    ubicacionCedis: 'CEDIS-C1-R1',
    sucursal: 'Chiriquí',
    colaborador: 'Nivardo Gutierres',
    cliente: 'Laura Fernández',
    modeloChangan: 'Alsvin',
    numeroOR: 'OR-2024-005',
    vin: 'LS5A3ABR8NA000005'
  }
];

export default function AdminDashboard() {
  const [modalRastreadorAbierto, setModalRastreadorAbierto] = useState(false);
  const [codigoInicial, setCodigoInicial] = useState('');

  const handleAbrirRastreador = (codigo?: string) => {
    setCodigoInicial(codigo || '');
    setModalRastreadorAbierto(true);
  };

  const handleCerrarRastreador = () => {
    setModalRastreadorAbierto(false);
    setCodigoInicial('');
  };

  const handleSeleccionarRepuesto = (codigo: string) => {
    console.log('Repuesto seleccionado:', codigo);
    // Aquí puedes implementar la lógica para usar el repuesto en una requisición
    alert(`Repuesto ${codigo} seleccionado para requisición`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-shield text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-500">CEDIS Changan Panamá</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Administrador</p>
                <p className="text-xs text-gray-500">admin@changanpanama.com</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                <i className="fas fa-sign-out-alt mr-2"></i>Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Pedidos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
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
                <p className="text-3xl font-bold text-gray-900 mt-2">580</p>
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
                <p className="text-3xl font-bold text-gray-900 mt-2">3</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-ship text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Sucursales Activas</p>
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

            <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md">
              <i className="fas fa-file-excel text-xl"></i>
              <div className="text-left">
                <p className="font-bold">Reporte a Fábrica</p>
                <p className="text-xs text-green-100">Generar reporte oficial</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md">
              <i className="fas fa-chart-line text-xl"></i>
              <div className="text-left">
                <p className="font-bold">KPIs Logísticos</p>
                <p className="text-xs text-purple-100">Ver indicadores clave</p>
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
                    fila.estatusLinea === 'Despachado'
                      ? 'bg-green-100 text-green-700'
                      : fila.estatusLinea === 'Asignado'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
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
      </main>

      {/* Modal Rastreador Universal */}
      <ModalRastreadorUniversal
        isOpen={modalRastreadorAbierto}
        onClose={handleCerrarRastreador}
        filas={DEMO_FILAS}
        inventario={DEMO_INVENTARIO}
        manifiestos={DEMO_MANIFIESTOS}
        codigoInicial={codigoInicial}
        onSeleccionarRepuesto={handleSeleccionarRepuesto}
      />
    </div>
  );
}
