/**
 * Panel de Administración Integral - CEDIS Changan Panamá
 * Sistema WMS/TMS Corporativo de Repuestos y Logística
 */

import { useState, useEffect, useMemo } from 'react';
import type {
  AuthState,
  DPLDetalle,
  DPLManifiesto,
  FilaRastreador,
  DespachoRegistro,
  EncargadoSucursal,
} from '../../domain/models/types';
import { ModalRastreadorUniversal } from './ModalRastreadorUniversal';
import { calcularKPIs, ejecutarMatchingFIFO } from '../../domain/services';
import { CruceDPL } from './CruceDPL';
import {
  isSupabaseConfigured,
  obtenerFilasAdminSupabase,
  obtenerManifiestosSupabase,
  obtenerDetalleInventarioSupabase,
  suscribirCambiosPedidosSupabase,
  actualizarEstatusPedidoSupabase,
  guardarDespachoSupabase,
  obtenerDespachosSupabase,
  actualizarUbicacionRepuestoSupabase,
  obtenerEncargadosSupabase,
} from '../../data/api/supabaseClient';
import { descargarGuiaDespacho } from '../../domain/services/generadorGuiasPDF';

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

type VistaAdmin = 'dashboard' | 'despachos' | 'inventario' | 'kpis' | 'matching' | 'cruceDPL' | 'encargados';

export default function AdminDashboard({ auth, onLogout }: AdminDashboardProps) {
  const [vistaActiva, setVistaActiva] = useState<VistaAdmin>('dashboard');
  const [modalRastreadorAbierto, setModalRastreadorAbierto] = useState(false);
  const [codigoInicial, setCodigoInicial] = useState('');
  const [modalDPLAbierto, setModalDPLAbierto] = useState(false);

  // Estados reactivos de datos
  const [filas, setFilas] = useState<FilaRastreador[]>(DEMO_FILAS);
  const [inventario, setInventario] = useState<DPLDetalle[]>(DEMO_INVENTARIO);
  const [manifiestos, setManifiestos] = useState<DPLManifiesto[]>(DEMO_MANIFIESTOS);
  const [despachos, setDespachos] = useState<DespachoRegistro[]>([]);
  const [encargados, setEncargados] = useState<EncargadoSucursal[]>([]);
  const [isLive, setIsLive] = useState<boolean>(isSupabaseConfigured());
  const [cargando, setCargando] = useState<boolean>(false);
  const [ultimoSync, setUltimoSync] = useState<string>('');
  const [mensajeNotificacion, setMensajeNotificacion] = useState<string | null>(null);

  // Filtros de búsqueda en pedidos
  const [filtroSucursal, setFiltroSucursal] = useState<string>('TODAS');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('TODOS');
  const [busquedaPedido, setBusquedaPedido] = useState<string>('');

  // Filtros de inventario
  const [busquedaInventario, setBusquedaInventario] = useState<string>('');
  const [filtroRack, setFiltroRack] = useState<string>('TODOS');

  // Filtros de despachos
  const [busquedaDespacho, setBusquedaDespacho] = useState<string>('');

  // Modal de Despacho Operativo
  const [modalDespachoAbierto, setModalDespachoAbierto] = useState<boolean>(false);
  const [lineaADespachar, setLineaADespachar] = useState<FilaRastreador | null>(null);
  const [transportistaInput, setTransportistaInput] = useState<string>('Transporte Interno CEDIS');
  const [placaVehiculoInput, setPlacaVehiculoInput] = useState<string>('CAMION-CEDIS-01');
  const [observacionesInput, setObservacionesInput] = useState<string>('');

  // Modal de Edición de Ubicación en Bodega
  const [modalRackAbierto, setModalRackAbierto] = useState<boolean>(false);
  const [itemAEditarRack, setItemAEditarRack] = useState<DPLDetalle | null>(null);
  const [nuevaUbicacionInput, setNuevaUbicacionInput] = useState<string>('');

  // Cargar todos los datos desde Supabase
  const cargarDatos = async () => {
    if (!isSupabaseConfigured()) return;
    setCargando(true);
    try {
      const [realFilas, realManifiestos, realInventario, realDespachos, realEncargados] = await Promise.all([
        obtenerFilasAdminSupabase(),
        obtenerManifiestosSupabase(),
        obtenerDetalleInventarioSupabase(),
        obtenerDespachosSupabase(),
        obtenerEncargadosSupabase(),
      ]);

      const hayFilas = realFilas && realFilas.length > 0;
      const hayManifiestos = realManifiestos && realManifiestos.length > 0;
      const hayInventario = realInventario && realInventario.length > 0;

      if (hayFilas) setFilas(realFilas);
      if (hayManifiestos) setManifiestos(realManifiestos);
      if (hayInventario) setInventario(realInventario);
      if (realDespachos) setDespachos(realDespachos);
      if (realEncargados) setEncargados(realEncargados);

      if (hayFilas || hayManifiestos || hayInventario) {
        setIsLive(true);
      }

      setUltimoSync(new Date().toLocaleTimeString('es-PA'));
    } catch (err) {
      console.error('Error cargando datos de Supabase en Admin:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    // Suscripción a cambios en tiempo real
    const desuscribir = suscribirCambiosPedidosSupabase(() => {
      cargarDatos();
    });

    return () => {
      desuscribir();
    };
  }, []);

  const notificar = (msg: string) => {
    setMensajeNotificacion(msg);
    setTimeout(() => setMensajeNotificacion(null), 4500);
  };

  // Abrir Rastreador Universal
  const handleAbrirRastreador = (codigo?: string) => {
    setCodigoInicial(codigo || '');
    setModalRastreadorAbierto(true);
  };

  // Acción rápida: Asignar Stock a una línea
  const handleAsignarStock = async (linea: FilaRastreador) => {
    // Buscar si hay stock en bodega
    const stock = inventario.find(i => (i.codigoRepuesto || '').toUpperCase() === (linea.codigoRepuesto || '').toUpperCase());
    const contenedor = stock?.contenedorId || 'CONT-CEDIS';
    const pallet = stock?.palletCaseNo || 'PAL-01';
    const ubicacion = stock?.ubicacionCedis || 'CEDIS-A1';

    await actualizarEstatusPedidoSupabase(linea.lineaId, 'Asignado', {
      contenedorAsignado: contenedor,
      palletAsignado: pallet,
      ubicacionCedis: ubicacion,
    });

    // Actualizar estado local inmediatamente
    setFilas(prev =>
      prev.map(f =>
        f.lineaId === linea.lineaId
          ? { ...f, estatusLinea: 'Asignado', contenedorAsignado: contenedor, palletAsignado: pallet, ubicacionCedis: ubicacion, cantidadAsignada: f.cantidadSolicitada }
          : f
      )
    );

    notificar(`Línea ${linea.codigoRepuesto} asignada en pallet ${pallet} (${ubicacion})`);
  };

  // Abrir modal para despachar
  const handlePrepararDespacho = (linea: FilaRastreador) => {
    setLineaADespachar(linea);
    setTransportistaInput('Transporte Interno CEDIS');
    setPlacaVehiculoInput('CAMION-CEDIS-01');
    setObservacionesInput(`Despacho para OR ${linea.numeroOR || 'Stock'} - Cliente: ${linea.cliente || 'Taller'}`);
    setModalDespachoAbierto(true);
  };

  // Confirmar Despacho y Descargar Guía PDF
  const handleConfirmarDespacho = async () => {
    if (!lineaADespachar) return;

    const guiaId = `GUIA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaHora = new Date().toLocaleString('es-PA');

    // 1. Descargar Guía de Despacho en PDF
    descargarGuiaDespacho({
      numeroGuia: guiaId,
      fecha: fechaHora,
      sucursalDestino: lineaADespachar.sucursal,
      transportista: transportistaInput,
      placaVehiculo: placaVehiculoInput,
      despachadorCedis: auth.nombre,
      observaciones: observacionesInput,
      lineas: [lineaADespachar],
    });

    // 2. Actualizar en Supabase
    await actualizarEstatusPedidoSupabase(lineaADespachar.lineaId, 'Despachado', {
      cantidadDespachada: lineaADespachar.cantidadSolicitada,
    });

    // 3. Registrar en tabla Despachos
    const nuevoRegistro: Omit<DespachoRegistro, 'id'> = {
      numeroGuia: guiaId,
      pedidoId: lineaADespachar.pedidoId,
      sucursalDestino: lineaADespachar.sucursal,
      transportista: transportistaInput,
      placaVehiculo: placaVehiculoInput,
      despachadorCedis: auth.nombre,
      fechaDespacho: new Date().toISOString().slice(0, 10),
      totalPiezas: Number(lineaADespachar.cantidadSolicitada) || 1,
      totalLineas: 1,
      estadoEntrega: 'EN TRANSITO',
      observaciones: observacionesInput,
      lineasJson: JSON.stringify([lineaADespachar]),
    };
    await guardarDespachoSupabase(nuevoRegistro);

    // Actualizar estado local
    setFilas(prev =>
      prev.map(f =>
        f.lineaId === lineaADespachar.lineaId
          ? { ...f, estatusLinea: 'Despachado', cantidadDespachada: f.cantidadSolicitada }
          : f
      )
    );

    setDespachos(prev => [
      {
        ...nuevoRegistro,
        id: `DSP-${Date.now().toString().slice(-6)}`,
      },
      ...prev,
    ]);

    setModalDespachoAbierto(false);
    setLineaADespachar(null);
    notificar(`¡Despacho ${guiaId} registrado con éxito! Guía PDF descargada.`);
  };

  // Descarga directa de Guía PDF desde la lista
  const handleDescargarGuiaDirecta = (linea: FilaRastreador) => {
    const guiaId = `GUIA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    descargarGuiaDespacho({
      numeroGuia: guiaId,
      fecha: new Date().toLocaleString('es-PA'),
      sucursalDestino: linea.sucursal,
      transportista: 'Transporte Interno CEDIS',
      placaVehiculo: 'CAMION-CEDIS-01',
      despachadorCedis: auth.nombre,
      observaciones: `Copia de Guía para pedido ${linea.pedidoId}`,
      lineas: [linea],
    });
    notificar(`Guía PDF ${guiaId} generada y descargada.`);
  };

  // Re-descargar Guía desde pestaña Despachos
  const handleReDescargarGuiaDespacho = (d: DespachoRegistro) => {
    let lineasRecuperadas: FilaRastreador[] = [];
    try {
      if (d.lineasJson) {
        lineasRecuperadas = JSON.parse(d.lineasJson);
      }
    } catch {
      lineasRecuperadas = [];
    }

    if (lineasRecuperadas.length === 0) {
      lineasRecuperadas = [
        {
          lineaId: 'LIN-REC',
          pedidoId: d.pedidoId,
          codigoRepuesto: 'REPUESTOS-VARIOS',
          descripcionOficial: `Lote de ${d.totalPiezas} piezas transferidas a ${d.sucursalDestino}`,
          cantidadSolicitada: d.totalPiezas,
          cantidadAsignada: d.totalPiezas,
          cantidadDespachada: d.totalPiezas,
          estatusLinea: 'Despachado',
          contenedorAsignado: '',
          palletAsignado: '',
          packageNo: '',
          ubicacionCedis: 'CEDIS',
          sucursal: d.sucursalDestino,
          colaborador: d.despachadorCedis,
          cliente: 'Sucursal Taller',
          modeloChangan: 'Changan',
          numeroOR: 'TRANSFERENCIA',
          vin: '',
        },
      ];
    }

    descargarGuiaDespacho({
      numeroGuia: d.numeroGuia,
      fecha: d.fechaDespacho,
      sucursalDestino: d.sucursalDestino,
      transportista: d.transportista,
      placaVehiculo: d.placaVehiculo,
      despachadorCedis: d.despachadorCedis,
      observaciones: d.observaciones,
      lineas: lineasRecuperadas,
    });
    notificar(`Guía ${d.numeroGuia} re-descargada.`);
  };

  // Guardar nueva ubicación en rack
  const handleGuardarRack = async () => {
    if (!itemAEditarRack || !nuevaUbicacionInput.trim()) return;

    await actualizarUbicacionRepuestoSupabase(itemAEditarRack.inventarioId, nuevaUbicacionInput.trim().toUpperCase());

    setInventario(prev =>
      prev.map(i =>
        i.inventarioId === itemAEditarRack.inventarioId
          ? { ...i, ubicacionCedis: nuevaUbicacionInput.trim().toUpperCase() }
          : i
      )
    );

    setModalRackAbierto(false);
    setItemAEditarRack(null);
    notificar(`Ubicación actualizada a ${nuevaUbicacionInput.trim().toUpperCase()}`);
  };

  // Filtrado reactivo de pedidos
  const pedidosFiltrados = useMemo(() => {
    return filas.filter(f => {
      const coincideSucursal = filtroSucursal === 'TODAS' || f.sucursal.toLowerCase() === filtroSucursal.toLowerCase();
      const coincideEstatus =
        filtroEstatus === 'TODOS' ||
        (filtroEstatus === 'Pendiente' && (f.estatusLinea === 'Pendiente' || !f.estatusLinea)) ||
        f.estatusLinea?.toLowerCase() === filtroEstatus.toLowerCase();

      const q = busquedaPedido.trim().toLowerCase();
      const coincideTexto =
        !q ||
        f.codigoRepuesto.toLowerCase().includes(q) ||
        f.descripcionOficial.toLowerCase().includes(q) ||
        f.cliente.toLowerCase().includes(q) ||
        f.numeroOR.toLowerCase().includes(q) ||
        f.vin.toLowerCase().includes(q) ||
        f.pedidoId.toLowerCase().includes(q);

      return coincideSucursal && coincideEstatus && coincideTexto;
    });
  }, [filas, filtroSucursal, filtroEstatus, busquedaPedido]);

  // Filtrado de inventario
  const inventarioFiltrado = useMemo(() => {
    return inventario.filter(i => {
      const q = busquedaInventario.trim().toLowerCase();
      const coincideTexto =
        !q ||
        i.codigoRepuesto.toLowerCase().includes(q) ||
        i.descripcion.toLowerCase().includes(q) ||
        (i.ubicacionCedis || '').toLowerCase().includes(q) ||
        i.contenedorId.toLowerCase().includes(q);

      const coincideRack =
        filtroRack === 'TODOS' ||
        (i.ubicacionCedis || '').toUpperCase().startsWith(filtroRack);

      return coincideTexto && coincideRack;
    });
  }, [inventario, busquedaInventario, filtroRack]);

  // Filtrado de despachos
  const despachosFiltrados = useMemo(() => {
    return despachos.filter(d => {
      const q = busquedaDespacho.trim().toLowerCase();
      return (
        !q ||
        d.numeroGuia.toLowerCase().includes(q) ||
        d.sucursalDestino.toLowerCase().includes(q) ||
        d.pedidoId.toLowerCase().includes(q) ||
        d.transportista.toLowerCase().includes(q)
      );
    });
  }, [despachos, busquedaDespacho]);

  // Cálculos dinámicos
  const kpis = calcularKPIs(filas, inventario);
  const matchingResult = ejecutarMatchingFIFO(filas, inventario);

  const sucursalesUnicas = useMemo(() => {
    const list = ['Villa Lucre', 'Tumba Muerto', 'Calle 50', 'Costa Verde', 'Chiriquí'];
    filas.forEach(f => {
      if (f.sucursal && !list.includes(f.sucursal)) list.push(f.sucursal);
    });
    return list;
  }, [filas]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {mensajeNotificacion && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-red-500/50 flex items-center gap-3 animate-bounce">
          <i className="fas fa-check-circle text-emerald-400 text-lg"></i>
          <span className="text-sm font-medium">{mensajeNotificacion}</span>
        </div>
      )}

      {/* Header Institucional */}
      <header className="bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white shadow-xl border-b border-red-950/40">
        <div className="max-w-7xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                <i className="fas fa-warehouse text-2xl text-red-100"></i>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-black tracking-tight">CEDIS CHANGAN PANAMÁ</h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isLive
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {isLive ? `Supabase Conectado (${filas.length} pedidos)` : 'Modo Demostración'}
                  </span>
                </div>
                <p className="text-xs text-red-200/90 font-medium">Centro Central de Distribución y Logística de Repuestos</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Botón Sincronizar */}
              <button
                onClick={cargarDatos}
                disabled={cargando}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-lg text-xs font-bold transition-all border border-white/25 shadow-sm disabled:opacity-50"
                title="Actualizar datos directamente desde Supabase"
              >
                <i className={`fas fa-sync-alt ${cargando ? 'animate-spin text-cyan-300' : 'text-white'}`}></i>
                <span>{cargando ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>

              {ultimoSync && (
                <span className="text-[11px] text-red-200 hidden md:inline bg-black/20 px-2 py-1 rounded">
                  {ultimoSync}
                </span>
              )}

              {/* Botón Rastreador Global */}
              <button
                onClick={() => handleAbrirRastreador()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <i className="fas fa-search"></i>
                <span className="hidden sm:inline">Rastreador</span>
              </button>

              <div className="text-right hidden sm:block border-l border-white/20 pl-3 ml-1">
                <p className="text-xs font-bold text-white">{auth.nombre}</p>
                <p className="text-[11px] text-red-200">Administrador CEDIS</p>
              </div>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-white/10 hover:bg-red-950/60 rounded-lg text-xs font-semibold transition-colors border border-white/15"
                title="Cerrar sesión"
              >
                <i className="fas fa-sign-out-alt mr-1"></i>Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación Principal por Pestañas */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          <button
            onClick={() => setVistaActiva('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              vistaActiva === 'dashboard'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-clipboard-list"></i>
            <span>Gestión de Pedidos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-900/30 text-white">{filas.length}</span>
          </button>

          <button
            onClick={() => setVistaActiva('despachos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              vistaActiva === 'despachos'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-truck-loading"></i>
            <span>Despachos & Envíos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white">{despachos.length}</span>
          </button>

          <button
            onClick={() => setVistaActiva('inventario')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              vistaActiva === 'inventario'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-boxes"></i>
            <span>Inventario & Bodega</span>
          </button>

          <button
            onClick={() => setVistaActiva('kpis')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              vistaActiva === 'kpis'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-chart-line"></i>
            <span>KPIs Logísticos</span>
          </button>

          <button
            onClick={() => setVistaActiva('matching')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              vistaActiva === 'matching'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-random"></i>
            <span>Matching FIFO</span>
          </button>

          <button
            onClick={() => setVistaActiva('cruceDPL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              vistaActiva === 'cruceDPL'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-ship"></i>
            <span>Gestión DPL ({manifiestos.length})</span>
          </button>

          <button
            onClick={() => setVistaActiva('encargados')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              vistaActiva === 'encargados'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-users-cog"></i>
            <span>Equipo & Sucursales</span>
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {/* ========================================================================= */}
        {/* VISTA 1: DASHBOARD / GESTIÓN OPERATIVA DE PEDIDOS                          */}
        {/* ========================================================================= */}
        {vistaActiva === 'dashboard' && (
          <div className="space-y-6">
            {/* Tarjetas de Métricas Rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pedidos</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{kpis.totalPedidos}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{kpis.totalLineas} líneas de repuestos</p>
                </div>
                <div className="w-11 h-11 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-lg">
                  <i className="fas fa-file-invoice"></i>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventario Almacén</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {inventario.reduce((acc, i) => acc + i.cantidadTotal, 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{inventario.length} SKUs registrados</p>
                </div>
                <div className="w-11 h-11 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg">
                  <i className="fas fa-boxes"></i>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Despachos Emitidos</p>
                  <p className="text-2xl font-black text-sky-600 mt-1">{despachos.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Transferencias a sucursales</p>
                </div>
                <div className="w-11 h-11 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center text-lg">
                  <i className="fas fa-truck"></i>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fill Rate Actual</p>
                  <p className="text-2xl font-black text-purple-600 mt-1">{kpis.fillRate}%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Cumplimiento de demanda</p>
                </div>
                <div className="w-11 h-11 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-lg">
                  <i className="fas fa-chart-pie"></i>
                </div>
              </div>
            </div>

            {/* Centro Operativo de Pedidos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <i className="fas fa-tasks text-red-600"></i>
                      Control y Despacho Operativo de Pedidos
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monitorea, asigna racks de bodega y genera conduces de despacho en PDF para cada taller.
                    </p>
                  </div>

                  {/* Acciones de exportación */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      Mostrando {pedidosFiltrados.length} de {filas.length} pedidos
                    </span>
                  </div>
                </div>

                {/* Barra de Filtros y Búsqueda */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {/* Buscador */}
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      placeholder="Buscar por código, OR, VIN o cliente..."
                      value={busquedaPedido}
                      onChange={e => setBusquedaPedido(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  {/* Filtro Sucursal */}
                  <div>
                    <select
                      value={filtroSucursal}
                      onChange={e => setFiltroSucursal(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                    >
                      <option value="TODAS">🏢 Todas las Sucursales</option>
                      {sucursalesUnicas.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Estatus */}
                  <div>
                    <select
                      value={filtroEstatus}
                      onChange={e => setFiltroEstatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                    >
                      <option value="TODOS">⚡ Todos los Estatus</option>
                      <option value="Pendiente">🟡 Pendientes</option>
                      <option value="Asignado">🔵 Asignados / En Picking</option>
                      <option value="Despachado">🟢 Despachados</option>
                      <option value="Sin Stock">🔴 Sin Stock</option>
                    </select>
                  </div>

                  {/* Reset Filters */}
                  <button
                    onClick={() => {
                      setBusquedaPedido('');
                      setFiltroSucursal('TODAS');
                      setFiltroEstatus('TODOS');
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200/70 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <i className="fas fa-undo"></i>Limpiar Filtros
                  </button>
                </div>
              </div>

              {/* Listado de Pedidos */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                      <th className="py-3 px-4">Pedido / OR</th>
                      <th className="py-3 px-4">Repuesto Solicitado</th>
                      <th className="py-3 px-4">Sucursal & Cliente</th>
                      <th className="py-3 px-4 text-center">Cant.</th>
                      <th className="py-3 px-4">Ubicación Bodega</th>
                      <th className="py-3 px-4 text-center">Estatus</th>
                      <th className="py-3 px-4 text-right">Acciones Operativas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pedidosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <i className="fas fa-inbox text-3xl mb-2 block"></i>
                          No se encontraron pedidos con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      pedidosFiltrados.map((fila) => {
                        const esDespachado = fila.estatusLinea === 'Despachado';
                        const esAsignado = fila.estatusLinea === 'Asignado';
                        const esSinStock = fila.estatusLinea === 'Sin Stock';

                        return (
                          <tr key={fila.lineaId} className="hover:bg-slate-50/80 transition-colors">
                            {/* Pedido / OR */}
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-900 block">{fila.pedidoId}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {fila.numeroOR ? `OR: ${fila.numeroOR}` : 'Sin No. OR'}
                              </span>
                            </td>

                            {/* Repuesto */}
                            <td className="py-3 px-4 max-w-xs">
                              <span className="font-mono font-bold text-cyan-700 block text-xs">{fila.codigoRepuesto}</span>
                              <span className="text-slate-600 truncate block text-[11px]" title={fila.descripcionOficial}>
                                {fila.descripcionOficial}
                              </span>
                              {fila.vin && (
                                <span className="text-[10px] text-slate-400 font-mono block">VIN: {fila.vin}</span>
                              )}
                            </td>

                            {/* Sucursal & Cliente */}
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 block">{fila.sucursal}</span>
                              <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                                {fila.cliente || 'Cliente General'}
                              </span>
                              <span className="text-[10px] text-slate-400 block">Asesor: {fila.colaborador}</span>
                            </td>

                            {/* Cantidad */}
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-slate-900 text-sm">{fila.cantidadSolicitada}</span>
                              <span className="text-[10px] text-slate-400 block">unid.</span>
                            </td>

                            {/* Ubicación Bodega */}
                            <td className="py-3 px-4 font-mono text-[11px]">
                              {fila.ubicacionCedis ? (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                                  <i className="fas fa-map-marker-alt text-red-500 text-[10px]"></i>
                                  {fila.ubicacionCedis}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Por asignar</span>
                              )}
                              {fila.palletAsignado && (
                                <span className="block text-[10px] text-slate-400">Pallet: {fila.palletAsignado}</span>
                              )}
                            </td>

                            {/* Estatus */}
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  esDespachado
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : esAsignado
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : esSinStock
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {esDespachado && <i className="fas fa-check-double text-[10px]"></i>}
                                {esAsignado && <i className="fas fa-box-open text-[10px]"></i>}
                                {esSinStock && <i className="fas fa-times-circle text-[10px]"></i>}
                                {!esDespachado && !esAsignado && !esSinStock && <i className="fas fa-clock text-[10px]"></i>}
                                {fila.estatusLinea || 'Pendiente'}
                              </span>
                            </td>

                            {/* Acciones */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {!esDespachado && (
                                  <>
                                    {!esAsignado && (
                                      <button
                                        onClick={() => handleAsignarStock(fila)}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] transition-colors flex items-center gap-1"
                                        title="Asignar rack y pallet de inventario"
                                      >
                                        <i className="fas fa-bolt"></i>
                                        <span>Asignar</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handlePrepararDespacho(fila)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                                      title="Despachar a sucursal y generar Guía oficial en PDF"
                                    >
                                      <i className="fas fa-truck"></i>
                                      <span>Despachar</span>
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => handleDescargarGuiaDirecta(fila)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-[11px] transition-colors"
                                  title="Generar y descargar Guía de Conduce en PDF"
                                >
                                  <i className="fas fa-file-pdf text-red-600 mr-1"></i>Guía
                                </button>

                                <button
                                  onClick={() => handleAbrirRastreador(fila.codigoRepuesto)}
                                  className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-semibold text-[11px] transition-colors"
                                  title="Ver trazabilidad en contenedores y pedidos"
                                >
                                  <i className="fas fa-search"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: DESPACHOS & ENVÍOS (Hoja Despachos)                              */}
        {/* ========================================================================= */}
        {vistaActiva === 'despachos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i className="fas fa-truck-moving text-emerald-600"></i>
                    Historial de Despachos y Conduces Emitidos
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Control de transferencias inter-sucursales enviadas desde CEDIS Changan hacia los talleres.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      placeholder="Buscar por guía, pedido, sucursal..."
                      value={busquedaDespacho}
                      onChange={e => setBusquedaDespacho(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla de Despachos */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <th className="py-3 px-4">No. Guía</th>
                      <th className="py-3 px-4">Pedido Origen</th>
                      <th className="py-3 px-4">Sucursal Destino</th>
                      <th className="py-3 px-4">Fecha / Transportista</th>
                      <th className="py-3 px-4 text-center">Piezas</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Documento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {despachosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <i className="fas fa-truck text-3xl mb-2 block text-slate-300"></i>
                          No hay registros de despachos aún. Haz clic en "Despachar" en la pestaña de Pedidos para generar el primero.
                        </td>
                      </tr>
                    ) : (
                      despachosFiltrados.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-red-700">{d.numeroGuia}</td>
                          <td className="py-3 px-4 font-mono">{d.pedidoId}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{d.sucursalDestino}</td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{d.fechaDespacho}</div>
                            <div className="text-[11px] text-slate-400">{d.transportista} ({d.placaVehiculo})</div>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">{d.totalPiezas}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {d.estadoEntrega}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleReDescargarGuiaDespacho(d)}
                              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 ml-auto"
                            >
                              <i className="fas fa-file-pdf"></i>
                              <span>Descargar PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 3: INVENTARIO & BODEGA CENTRAL                                      */}
        {/* ========================================================================= */}
        {vistaActiva === 'inventario' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i className="fas fa-boxes text-blue-600"></i>
                    Inventario Físico en Bodega CEDIS
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Control de existencias por estantes y racks de almacenamiento central.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      placeholder="Buscar por código, repuesto o rack..."
                      value={busquedaInventario}
                      onChange={e => setBusquedaInventario(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={filtroRack}
                    onChange={e => setFiltroRack(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none font-medium"
                  >
                    <option value="TODOS">Todos los Racks</option>
                    <option value="CEDIS-A">Racks Pasillo A</option>
                    <option value="CEDIS-B">Racks Pasillo B</option>
                    <option value="CEDIS-C">Racks Pasillo C</option>
                  </select>
                </div>
              </div>

              {/* Tabla de Inventario */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <th className="py-3 px-4">Código Repuesto</th>
                      <th className="py-3 px-4">Descripción Oficial</th>
                      <th className="py-3 px-4">Contenedor / Pallet</th>
                      <th className="py-3 px-4">Ubicación Rack</th>
                      <th className="py-3 px-4 text-center">Stock Total</th>
                      <th className="py-3 px-4 text-center">Comprometido</th>
                      <th className="py-3 px-4 text-center">Disponible</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inventarioFiltrado.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No se encontraron repuestos con los criterios seleccionados.
                        </td>
                      </tr>
                    ) : (
                      inventarioFiltrado.map((item) => (
                        <tr key={item.inventarioId} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-cyan-700">{item.codigoRepuesto}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{item.descripcion}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {item.contenedorId} {item.palletCaseNo ? `(${item.palletCaseNo})` : ''}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                              <i className="fas fa-warehouse text-slate-500 text-[10px]"></i>
                              {item.ubicacionCedis || 'CEDIS-GENERAL'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">{item.cantidadTotal}</td>
                          <td className="py-3 px-4 text-center font-bold text-amber-600">{item.cantidadAsignada}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                                item.saldoDisponible > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.saldoDisponible}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setItemAEditarRack(item);
                                setNuevaUbicacionInput(item.ubicacionCedis || 'CEDIS-A1-R1');
                                setModalRackAbierto(true);
                              }}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-xs transition-colors"
                              title="Modificar estante o rack en bodega"
                            >
                              <i className="fas fa-edit mr-1"></i>Rack
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 4: KPIS LOGÍSTICOS INTERNACIONALES                                  */}
        {/* ========================================================================= */}
        {vistaActiva === 'kpis' && (
          <div className="space-y-6">
            <div className="bg-slate-950 rounded-2xl p-6 text-white shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <i className="fas fa-chart-line text-red-500"></i>
                Indicadores Clave de Desempeño Logístico (KPIs)
              </h2>

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
                  <div className="text-xs text-slate-400 mt-1">Líneas en quiebre</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Tiempo Ciclo</span>
                    <i className="fas fa-clock text-indigo-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.tiempoCiclo}h</div>
                  <div className="text-xs text-slate-400 mt-1">Promedio horas de surtido</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Exactitud Inv.</span>
                    <i className="fas fa-warehouse text-purple-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.exactitudInventario}%</div>
                  <div className="text-xs text-slate-400 mt-1">IRA en Bodega</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Exactitud Picking</span>
                    <i className="fas fa-bullseye text-teal-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.exactitudPicking}%</div>
                  <div className="text-xs text-slate-400 mt-1">Sin discrepancias</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Cruce DPL</span>
                    <i className="fas fa-exchange-alt text-orange-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.efectividadCruce}%</div>
                  <div className="text-xs text-slate-400 mt-1">Asignación automática</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase mb-2">
                    <span>Pedido Perfecto</span>
                    <i className="fas fa-award text-yellow-400"></i>
                  </div>
                  <div className="text-3xl font-black text-white">{kpis.pedidoPerfecto}%</div>
                  <div className="text-xs text-slate-400 mt-1">Calidad total</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 5: MATCHING FIFO                                                    */}
        {/* ========================================================================= */}
        {vistaActiva === 'matching' && (
          <div className="space-y-6">
            <div className="bg-slate-950 rounded-2xl p-6 text-white shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <i className="fas fa-random text-rose-500"></i>
                Motor de Conciliación Automática FIFO (First In, First Out)
              </h2>

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

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800/60 border-b border-slate-700 text-slate-400 uppercase text-[11px]">
                      <tr>
                        <th className="px-4 py-3 text-left">Pedido</th>
                        <th className="px-4 py-3 text-left">Código Repuesto</th>
                        <th className="px-4 py-3 text-center">Solicitado</th>
                        <th className="px-4 py-3 text-center">Asignado</th>
                        <th className="px-4 py-3 text-left">Contenedor / Rack</th>
                        <th className="px-4 py-3 text-center">Estado FIFO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {matchingResult.detalles.map((detalle: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-mono text-slate-300">{detalle.pedidoId}</td>
                          <td className="px-4 py-3 font-mono text-cyan-400 font-bold">{detalle.codigoRepuesto}</td>
                          <td className="px-4 py-3 text-center font-bold">{detalle.cantidadSolicitada}</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-400">{detalle.cantidadAsignada}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{detalle.contenedorAsignado || 'En Bodega'}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                detalle.estatusLinea === 'Asignado'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : detalle.estatusLinea === 'Asignado Parcial'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
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

        {/* ========================================================================= */}
        {/* VISTA 6: GESTIÓN DPL (Contenedores Marítimos)                              */}
        {/* ========================================================================= */}
        {vistaActiva === 'cruceDPL' && (
          <div className="bg-slate-950 rounded-2xl p-6 shadow-xl">
            <CruceDPL
              usuario={{
                id: auth.id,
                nombre: auth.nombre,
                rol: 'ADMINISTRADOR_CEDIS',
                sucursal: auth.sucursal,
              }}
              onAbrirModalDPL={() => setModalDPLAbierto(true)}
              onAbrirRastreador={handleAbrirRastreador}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 7: EQUIPO & SUCURSALES (Hoja BD_Encargados)                         */}
        {/* ========================================================================= */}
        {vistaActiva === 'encargados' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <i className="fas fa-users-cog text-red-600"></i>
                  Directorio de Sucursales y Encargados de Repuestos
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Contacta directamente a los coordinadores y jefes de servicio de cada taller Changan en Panamá.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {encargados.map((enc) => (
                  <div
                    key={enc.id}
                    className="border border-slate-200 rounded-xl p-5 hover:border-red-400 transition-all shadow-sm hover:shadow-md bg-gradient-to-b from-white to-slate-50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-red-100 text-red-800">
                          {enc.sucursal}
                        </span>
                        <i className="fas fa-building text-slate-300 text-lg"></i>
                      </div>

                      <h3 className="font-bold text-base text-slate-900">{enc.nombre}</h3>
                      <p className="text-xs font-medium text-slate-500 mb-3">{enc.cargo}</p>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-phone text-slate-400 w-4"></i>
                          <a href={`tel:${enc.telefono}`} className="hover:text-red-600 font-medium">
                            {enc.telefono}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-envelope text-slate-400 w-4"></i>
                          <a href={`mailto:${enc.correo}`} className="hover:text-red-600 truncate">
                            {enc.correo}
                          </a>
                        </div>
                        {enc.direccion && (
                          <div className="flex items-start gap-2 text-[11px] text-slate-400 mt-2">
                            <i className="fas fa-map-marker-alt text-red-400 w-4 mt-0.5"></i>
                            <span>{enc.direccion}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción directa */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                      <a
                        href={`https://wa.me/${enc.whatsapp || enc.telefono.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(enc.nombre)},%20te%20contacto%20desde%20CEDIS%20Central%20Changan`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <i className="fab fa-whatsapp text-sm"></i>
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={`mailto:${enc.correo}?subject=Coordinaci%C3%B3n%20Log%C3%ADstica%20CEDIS%20Changan`}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <i className="fas fa-envelope text-xs"></i>
                        <span>Correo</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMACIÓN DE DESPACHO & GENERACIÓN DE GUÍA PDF                */}
      {/* ========================================================================= */}
      {modalDespachoAbierto && lineaADespachar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                  <i className="fas fa-truck-loading"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Emitir Guía de Despacho</h3>
                  <p className="text-xs text-slate-500">Genera el conduce oficial y descuenta stock</p>
                </div>
              </div>
              <button
                onClick={() => setModalDespachoAbierto(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Resumen del Repuesto */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Pedido ID:</span>
                <span className="font-mono font-bold">{lineaADespachar.pedidoId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sucursal Destino:</span>
                <span className="font-bold text-red-700">{lineaADespachar.sucursal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Repuesto:</span>
                <span className="font-mono font-bold text-cyan-700">{lineaADespachar.codigoRepuesto}</span>
              </div>
              <div className="text-slate-600 truncate">{lineaADespachar.descripcionOficial}</div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span>Cantidad a despachar:</span>
                <span className="text-emerald-700">{lineaADespachar.cantidadSolicitada} unidades</span>
              </div>
            </div>

            {/* Formulario de Transporte */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chofer / Transportista
                </label>
                <input
                  type="text"
                  value={transportistaInput}
                  onChange={e => setTransportistaInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Transporte Interno CEDIS"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Placa / Unidad Vehicular
                </label>
                <input
                  type="text"
                  value={placaVehiculoInput}
                  onChange={e => setPlacaVehiculoInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: CAMION-CEDIS-01"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Instrucciones de Entrega
                </label>
                <textarea
                  value={observacionesInput}
                  onChange={e => setObservacionesInput(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Notas para el taller receptor..."
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalDespachoAbierto(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmarDespacho}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <i className="fas fa-file-pdf"></i>
                <span>Confirmar y Descargar Guía PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDICIÓN DE UBICACIÓN EN BODEGA                                   */}
      {/* ========================================================================= */}
      {modalRackAbierto && itemAEditarRack && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Asignar Ubicación en Bodega</h3>
            <p className="text-xs text-slate-500 mb-4">{itemAEditarRack.codigoRepuesto} - {itemAEditarRack.descripcion}</p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Rack / Estante CEDIS</label>
              <input
                type="text"
                value={nuevaUbicacionInput}
                onChange={e => setNuevaUbicacionInput(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: CEDIS-A1-R3"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalRackAbierto(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarRack}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rastreador Universal */}
      <ModalRastreadorUniversal
        isOpen={modalRastreadorAbierto}
        onClose={() => setModalRastreadorAbierto(false)}
        filas={filas}
        inventario={inventario}
        manifiestos={manifiestos}
        codigoInicial={codigoInicial}
      />
    </div>
  );
}
