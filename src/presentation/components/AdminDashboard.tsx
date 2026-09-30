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
import { ModalCargaDPL } from './ModalCargaDPL';
import { ModalImportarBackup } from './ModalImportarBackup';
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
  eliminarPedidosSupabase,
  depurarYMigrarDespachadosSupabase,
  depurarDuplicadosSupabase,
  aplicarMatchingFIFOSupabase,
} from '../../data/api/supabaseClient';
import {
  descargarEtiquetaPedido,
  descargarEtiquetasEnLote,
  descargarActaRetiroCedis,
  descargarGuiaDespacho,
  descargarManifiestoArchivoFisico,
  descargarComprobanteSalidaFisica,
} from '../../domain/services/generadorGuiasPDF';

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
  const [vistaActiva, setVistaActivaState] = useState<VistaAdmin>(() => {
    try {
      const saved = localStorage.getItem('cedis_admin_active_tab') as VistaAdmin;
      const validas: VistaAdmin[] = ['dashboard', 'despachos', 'inventario', 'kpis', 'matching', 'cruceDPL', 'encargados'];
      if (saved && validas.includes(saved)) {
        return saved;
      }
    } catch {}
    return 'dashboard';
  });

  const setVistaActiva = (nuevaVista: VistaAdmin) => {
    setVistaActivaState(nuevaVista);
    try {
      localStorage.setItem('cedis_admin_active_tab', nuevaVista);
    } catch {}
  };
  const [modalRastreadorAbierto, setModalRastreadorAbierto] = useState(false);
  const [codigoInicial, setCodigoInicial] = useState('');
  const [modalDPLAbierto, setModalDPLAbierto] = useState(false);
  const [modalBackupAbierto, setModalBackupAbierto] = useState(false);

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
  const [filtroEstatus, setFiltroEstatus] = useState<string>('ACTIVOS');
  const [filtroContenedor, setFiltroContenedor] = useState<string>('TODOS');
  const [filtroPallet, setFiltroPallet] = useState<string>('TODOS');
  const [busquedaPedido, setBusquedaPedido] = useState<string>('');
  const [depurandoMatriz, setDepurandoMatriz] = useState<boolean>(false);

  // Filtros de inventario
  const [busquedaInventario, setBusquedaInventario] = useState<string>('');
  const [filtroRack, setFiltroRack] = useState<string>('TODOS');

  // Filtros de despachos
  const [busquedaDespacho, setBusquedaDespacho] = useState<string>('');

  // Estados de selección múltiple para eliminación y acciones en lote
  const [selectedLineas, setSelectedLineas] = useState<Set<string>>(new Set());

  // Modal de Retiro en Mostrador CEDIS (Sin camiones de reparto)
  const [modalRetiroAbierto, setModalRetiroAbierto] = useState<boolean>(false);
  const [lineaARetirar, setLineaARetirar] = useState<FilaRastreador | null>(null);
  const [personaQueRetiraInput, setPersonaQueRetiraInput] = useState<string>('');
  const [cedulaPersonaInput, setCedulaPersonaInput] = useState<string>('');
  const [observacionesRetiroInput, setObservacionesRetiroInput] = useState<string>('');
  const [entregadorCedisInput, setEntregadorCedisInput] = useState<string>(auth.nombre || 'Bodega Central CEDIS');

  // Modo de visualización en BD Encargados (tabla / tarjetas)
  const [vistaEncargadosModo, setVistaEncargadosModo] = useState<'tabla' | 'tarjetas'>('tabla');

  // Modal de Edición de Ubicación en Bodega
  const [modalRackAbierto, setModalRackAbierto] = useState<boolean>(false);
  const [itemAEditarRack, setItemAEditarRack] = useState<DPLDetalle | null>(null);
  const [nuevaUbicacionInput, setNuevaUbicacionInput] = useState<string>('');

  // Cargar todos los datos desde Supabase y Memoria Local
  const cargarDatos = async (showToast = false) => {
    setCargando(true);
    try {
      const [realFilas, realManifiestos, realInventario, realDespachos, realEncargados] = await Promise.all([
        obtenerFilasAdminSupabase(),
        obtenerManifiestosSupabase(),
        obtenerDetalleInventarioSupabase(),
        obtenerDespachosSupabase(),
        obtenerEncargadosSupabase(),
      ]);

      if (realFilas) {
        setFilas(realFilas);
      }
      if (realManifiestos && realManifiestos.length > 0) setManifiestos(realManifiestos);
      if (realInventario && realInventario.length > 0) setInventario(realInventario);
      if (realDespachos) setDespachos(realDespachos);
      if (realEncargados && realEncargados.length > 0) setEncargados(realEncargados);

      if (isSupabaseConfigured()) {
        setIsLive(true);
      }

      const hora = new Date().toLocaleTimeString('es-PA');
      setUltimoSync(hora);

      if (showToast) {
        const count = realFilas ? realFilas.length : 0;
        notificar(`Sincronización completada: ${count} pedidos cargados (Supabase + Memoria local).`);
      }
    } catch (err) {
      console.error('Error cargando datos de Supabase en Admin:', err);
      if (showToast) {
        notificar('Error al sincronizar con el servidor.');
      }
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

  // Selección múltiple
  const handleToggleSelectAll = () => {
    if (selectedLineas.size === pedidosFiltrados.length && pedidosFiltrados.length > 0) {
      setSelectedLineas(new Set());
    } else {
      setSelectedLineas(new Set(pedidosFiltrados.map(f => f.lineaId)));
    }
  };

  const handleToggleSelectRow = (lineaId: string) => {
    setSelectedLineas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(lineaId)) {
        nuevo.delete(lineaId);
      } else {
        nuevo.add(lineaId);
      }
      return nuevo;
    });
  };

  // Analizar y Depurar Matriz: Detecta y elimina duplicados y organiza repuestos despachados en Retiros
  const handleAnalizarYDepurar = async () => {
    const confirmar = window.confirm(
      '¿Desea auditar y depurar toda la base de datos de pedidos en Supabase?\n\n' +
      'Esta función:\n' +
      '1. 🛡️ Detecta y elimina filas duplicadas o triplicadas del mismo cliente y código de repuesto.\n' +
      '2. 📦 Analiza pedidos despachados o retirados y los organiza en "Retiro en Mostrador CEDIS".\n' +
      '3. 🧹 Garantiza la consistencia exacta de inventario y pedidos pendientes.'
    );
    if (!confirmar) return;

    setDepurandoMatriz(true);
    try {
      // 1. Purgar duplicados físicos en Supabase
      const resDup = await depurarDuplicadosSupabase();

      // 2. Depurar y migrar despachados
      const resDesp = await depurarYMigrarDespachadosSupabase(filas);

      // 3. Recargar datos limpios y sincronizados desde Supabase
      const [filasSincronizadas, despActualizados] = await Promise.all([
        obtenerFilasAdminSupabase(),
        obtenerDespachosSupabase()
      ]);

      if (filasSincronizadas) {
        setFilas(filasSincronizadas);
      }
      if (despActualizados) {
        setDespachos(despActualizados);
      }

      let mensaje = '¡Auditoría y depuración finalizada con éxito!';
      const detalles: string[] = [];
      if (resDup.eliminadosCount > 0) {
        detalles.push(`🛡️ Se eliminaron ${resDup.eliminadosCount} registros duplicados en Supabase.`);
      }
      if (resDesp.migradosCount > 0) {
        detalles.push(`📦 Se organizaron ${resDesp.migradosCount} repuestos despachados en Retiros.`);
      }
      if (detalles.length > 0) {
        mensaje += `\n\n${detalles.join('\n')}`;
      } else {
        mensaje += ' La base de datos no contiene registros duplicados.';
      }
      notificar(mensaje);
    } catch (err) {
      console.error('Error durante la depuración de la matriz:', err);
      notificar('Error al procesar la depuración.');
    } finally {
      setDepurandoMatriz(false);
    }
  };

  // Eliminación individual de un pedido
  const handleEliminarIndividual = async (fila: FilaRastreador) => {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar el pedido ${fila.pedidoId}?\nRepuesto: ${fila.codigoRepuesto}\nSucursal: ${fila.sucursal}\n\nEsta acción borrará el pedido de Supabase y de la memoria local.`
    );
    if (!confirmar) return;

    try {
      await eliminarPedidosSupabase([fila.lineaId], [fila.pedidoId]);
      setFilas(prev => prev.filter(f => f.lineaId !== fila.lineaId));
      setSelectedLineas(prev => {
        const copy = new Set(prev);
        copy.delete(fila.lineaId);
        return copy;
      });
      notificar(`Pedido ${fila.pedidoId} eliminado con éxito.`);
    } catch (err) {
      console.error('Error eliminando pedido:', err);
      notificar('Error al eliminar el pedido.');
    }
  };

  // Eliminación masiva en lote
  const handleEliminarSeleccionados = async () => {
    if (selectedLineas.size === 0) return;

    const count = selectedLineas.size;
    const confirmar = window.confirm(
      `¿Está seguro de eliminar permanentemente ${count} pedidos seleccionados?\nSe removerán de la base de datos de Supabase y del panel.`
    );
    if (!confirmar) return;

    try {
      const idsAEliminar = Array.from(selectedLineas);
      const foliosAEliminar = filas
        .filter(f => selectedLineas.has(f.lineaId))
        .map(f => f.pedidoId);

      await eliminarPedidosSupabase(idsAEliminar, foliosAEliminar);
      setFilas(prev => prev.filter(f => !selectedLineas.has(f.lineaId)));
      setSelectedLineas(new Set());
      notificar(`Se eliminaron ${count} pedidos correctamente.`);
    } catch (err) {
      console.error('Error eliminando pedidos en lote:', err);
      notificar('Error al eliminar pedidos seleccionados.');
    }
  };

  // Imprimir etiquetas en lote (PDF con tamaño 100x150mm / 4x6" por página)
  const handleImprimirEtiquetasLote = () => {
    const seleccionados = filas.filter(f => selectedLineas.has(f.lineaId));
    if (seleccionados.length === 0) {
      notificar('Seleccione al menos un pedido para imprimir etiquetas.');
      return;
    }
    descargarEtiquetasEnLote(seleccionados);
    notificar(`Generando PDF con ${seleccionados.length} etiquetas de pedido especial...`);
  };

  // Descargar etiqueta individual
  const handleDescargarEtiqueta = (fila: FilaRastreador) => {
    descargarEtiquetaPedido(fila);
    notificar(`Etiqueta de pedido especial generada para ${fila.codigoRepuesto}.`);
  };

  // Acción rápida: Asignar Stock a una línea
  const handleAsignarStock = async (linea: FilaRastreador) => {
    const stock = inventario.find(i => (i.codigoRepuesto || '').toUpperCase() === (linea.codigoRepuesto || '').toUpperCase());
    const contenedor = stock?.contenedorId || 'CONT-CEDIS';
    const pallet = stock?.palletCaseNo || 'PAL-01';
    const ubicacion = stock?.ubicacionCedis || 'CEDIS-A1';

    await actualizarEstatusPedidoSupabase(linea.lineaId, 'Asignado', {
      contenedorAsignado: contenedor,
      palletAsignado: pallet,
      ubicacionCedis: ubicacion,
    });

    setFilas(prev =>
      prev.map(f =>
        f.lineaId === linea.lineaId
          ? { ...f, estatusLinea: 'Asignado', contenedorAsignado: contenedor, palletAsignado: pallet, ubicacionCedis: ubicacion, cantidadAsignada: f.cantidadSolicitada }
          : f
      )
    );

    notificar(`Línea ${linea.codigoRepuesto} asignada en pallet ${pallet} (${ubicacion})`);
  };

  // Abrir modal de Retiro en Mostrador CEDIS
  const handleAbrirModalRetiro = (linea: FilaRastreador) => {
    setLineaARetirar(linea);
    setPersonaQueRetiraInput('');
    setCedulaPersonaInput('');
    setEntregadorCedisInput(auth.nombre || 'Bodega Central CEDIS');
    setObservacionesRetiroInput(`Retiro en mostrador CEDIS para orden ${linea.numeroOR || 'Stock'} - ${linea.cliente || 'Taller'}`);
    setModalRetiroAbierto(true);
  };

  // Confirmar Retiro en Mostrador CEDIS y Descargar Acta PDF
  const handleConfirmarRetiroCedis = async () => {
    if (!lineaARetirar) return;

    if (!personaQueRetiraInput.trim()) {
      alert('Por favor ingrese el nombre del personal de la sucursal que retira el repuesto.');
      return;
    }

    const actaId = `ACTA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaHora = new Date().toLocaleString('es-PA');

    // 1. Descargar Acta oficial de Retiro en Mostrador CEDIS
    descargarActaRetiroCedis({
      numeroActa: actaId,
      fecha: fechaHora,
      sucursalDestino: lineaARetirar.sucursal,
      personaQueRetira: personaQueRetiraInput.trim(),
      cedulaPersona: cedulaPersonaInput.trim() || 'N/A',
      entregadorCedis: entregadorCedisInput.trim() || auth.nombre,
      observaciones: observacionesRetiroInput,
      lineas: [lineaARetirar],
    });

    // 2. Actualizar en Supabase a Despachado / Retirado
    await actualizarEstatusPedidoSupabase(lineaARetirar.lineaId, 'Despachado', {
      cantidadDespachada: lineaARetirar.cantidadSolicitada,
    });

    // 3. Registrar en tabla de Despachos/Retiros
    const nuevoRegistro: Omit<DespachoRegistro, 'id'> = {
      numeroGuia: actaId,
      pedidoId: lineaARetirar.pedidoId,
      sucursalDestino: lineaARetirar.sucursal,
      transportista: `Retiro Mostrador: ${personaQueRetiraInput.trim()} (Céd: ${cedulaPersonaInput.trim() || 'N/A'})`,
      placaVehiculo: 'RETIRO EN CEDIS',
      despachadorCedis: entregadorCedisInput.trim() || auth.nombre,
      fechaDespacho: new Date().toISOString().slice(0, 10),
      totalPiezas: Number(lineaARetirar.cantidadSolicitada) || 1,
      totalLineas: 1,
      estadoEntrega: 'ENTREGADO',
      observaciones: observacionesRetiroInput,
      lineasJson: JSON.stringify([lineaARetirar]),
    };
    await guardarDespachoSupabase(nuevoRegistro);

    // 4. Actualizar estado reactivo local
    setFilas(prev =>
      prev.map(f =>
        f.lineaId === lineaARetirar.lineaId
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

    setModalRetiroAbierto(false);
    setLineaARetirar(null);
    notificar(`¡Retiro confirmado! Acta ${actaId} generada y descargada.`);
  };

  // Re-descargar Acta de Retiro desde la pestaña de Despachos/Retiros
  const handleReDescargarActa = (d: DespachoRegistro) => {
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
          descripcionOficial: `Lote de ${d.totalPiezas} piezas retiradas por ${d.sucursalDestino}`,
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

    descargarActaRetiroCedis({
      numeroActa: d.numeroGuia,
      fecha: d.fechaDespacho,
      sucursalDestino: d.sucursalDestino,
      personaQueRetira: d.transportista.replace('Retiro Mostrador:', '').trim() || 'Personal Sucursal',
      cedulaPersona: 'Verificada en mostrador',
      entregadorCedis: d.despachadorCedis,
      observaciones: d.observaciones,
      lineas: lineasRecuperadas,
    });
    notificar(`Acta ${d.numeroGuia} re-descargada.`);
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

  // Modo de visualización en Matching: 'transito' (pre-arribo / en camino) vs 'bodega' (inventario recibido)
  const [modoMatching, setModoMatching] = useState<'transito' | 'bodega'>('transito');
  const [aplicandoMatching, setAplicandoMatching] = useState(false);

  // Callback cuando se sube un DPL
  const handleDPLCargado = (nuevoMan: DPLManifiesto, nuevosDetalles: DPLDetalle[]) => {
    setManifiestos(prev => {
      const idx = prev.findIndex(m => m.contenedorId === nuevoMan.contenedorId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = nuevoMan;
        return copy;
      }
      return [nuevoMan, ...prev];
    });

    setInventario(prev => {
      const otros = prev.filter(i => i.contenedorId !== nuevoMan.contenedorId);
      return [...nuevosDetalles, ...otros];
    });

    notificar(`¡Manifiesto ${nuevoMan.contenedorId} registrado con éxito! ${nuevosDetalles.length} repuestos cargados.`);
  };

  // Cálculo de Pre-Arribo: Contenedores en camino (EN TRÁNSITO / ADUANA)
  // Determina en qué pallet y contenedor viene cada repuesto del cliente antes de llegar
  const preMatchingTransito = useMemo(() => {
    const contsEnCamino = manifiestos.filter(
      m => m.estado === 'EN TRÁNSITO' || m.estado === 'ADUANA'
    );
    const setContsEnCamino = new Set(contsEnCamino.map(c => c.contenedorId));

    const piezasEnCamino = inventario.filter(i => setContsEnCamino.has(i.contenedorId));
    const pedidosPendientes = filas.filter(f => f.estatusLinea !== 'Despachado');

    return pedidosPendientes.map(f => {
      const cod = (f.codigoRepuesto || '').trim().toUpperCase();
      const match = piezasEnCamino.find(p => (p.codigoRepuesto || '').trim().toUpperCase() === cod);
      const contenedorMeta = contsEnCamino.find(c => c.contenedorId === match?.contenedorId);

      const vieneEnCamino = Boolean(match);

      return {
        lineaId: f.lineaId,
        pedidoId: f.pedidoId,
        codigoRepuesto: f.codigoRepuesto,
        descripcionOficial: f.descripcionOficial,
        sucursal: f.sucursal,
        cliente: f.cliente,
        numeroOR: f.numeroOR,
        cantidadSolicitada: f.cantidadSolicitada,
        vieneEnCamino,
        contenedorEnCamino: match?.contenedorId || f.contenedorAsignado || 'Sin embarque',
        palletEnCamino: match?.palletCaseNo || f.palletAsignado || 'Por asignar',
        packageNo: match?.packageNo || f.packageNo || '',
        eta: contenedorMeta?.fechaArribo || 'Pendiente',
        estadoEmbarque: contenedorMeta?.estado || 'POR EMBARCAR',
      };
    });
  }, [filas, inventario, manifiestos]);

  // Aplicar Pre-Asignación en Tránsito a los pedidos
  const handleAplicarPreAsignacionTransito = async () => {
    const listosParaPreAsignar = preMatchingTransito.filter(p => p.vieneEnCamino);
    if (listosParaPreAsignar.length === 0) {
      notificar('No hay repuestos en contenedores en tránsito que coincidan con pedidos pendientes.');
      return;
    }

    const confirmar = window.confirm(
      `¿Desea pre-asignar contenedor y pallet a ${listosParaPreAsignar.length} pedidos?\n\n` +
      'Esto registrará en el sistema el número de contenedor y pallet de llegada para que las sucursales y clientes sepan dónde viene su repuesto antes del arribo físico.'
    );
    if (!confirmar) return;

    setAplicandoMatching(true);
    try {
      const payload = listosParaPreAsignar.map(p => ({
        lineaId: p.lineaId,
        pedidoId: p.pedidoId,
        codigoRepuesto: p.codigoRepuesto,
        contenedorAsignado: p.contenedorEnCamino,
        palletAsignado: p.palletEnCamino,
        packageNo: p.packageNo,
        ubicacionCedis: `CEDIS-${p.palletEnCamino}`,
        cantidadAsignada: p.cantidadSolicitada,
        nuevoEstatus: 'En Tránsito Asignado',
      }));

      await aplicarMatchingFIFOSupabase(payload);

      setFilas(prev =>
        prev.map(f => {
          const match = payload.find(p => p.lineaId === f.lineaId || p.pedidoId === f.pedidoId);
          if (match) {
            return {
              ...f,
              contenedorAsignado: match.contenedorAsignado,
              palletAsignado: match.palletAsignado,
              packageNo: match.packageNo,
              ubicacionCedis: match.ubicacionCedis,
              estatusLinea: 'En Tránsito Asignado',
            };
          }
          return f;
        })
      );

      notificar(`¡Pre-asignación aplicada! ${listosParaPreAsignar.length} pedidos actualizados con contenedor y pallet en tránsito.`);
    } catch (err) {
      console.error('Error aplicando pre-asignación:', err);
      notificar('Error al aplicar pre-asignación.');
    } finally {
      setAplicandoMatching(false);
    }
  };

  // Aplicar Matching FIFO Definitivo (Mercancía Recibida en Bodega)
  const handleAplicarMatchingFIFODefinitivo = async () => {
    const asignables = matchingResult.detalles.filter(
      (d: any) => d.estatusLinea === 'Asignado' || d.estatusLinea === 'Asignado Parcial'
    );

    if (asignables.length === 0) {
      notificar('No hay pedidos con stock disponible en bodega para asignar.');
      return;
    }

    const confirmar = window.confirm(
      `¿Desea aplicar la asignación en firme a ${asignables.length} pedidos?\n\n` +
      'Esto reservará formalmente el stock en bodega, actualizará el estatus a "Asignado" y habilitará la emisión de etiquetas de despacho.'
    );
    if (!confirmar) return;

    setAplicandoMatching(true);
    try {
      const payload = asignables.map((d: any) => ({
        lineaId: d.lineaId,
        pedidoId: d.pedidoId,
        codigoRepuesto: d.codigoRepuesto,
        contenedorAsignado: d.contenedorAsignado,
        palletAsignado: d.palletAsignado,
        packageNo: d.packageNo,
        ubicacionCedis: d.ubicacionCedis || `CEDIS-${d.palletAsignado || 'A1'}`,
        cantidadAsignada: d.cantidadAsignada,
        nuevoEstatus: d.estatusLinea as any,
      }));

      await aplicarMatchingFIFOSupabase(payload);

      setFilas(prev =>
        prev.map(f => {
          const match = payload.find((p: any) => p.lineaId === f.lineaId || (p.pedidoId === f.pedidoId && p.codigoRepuesto === f.codigoRepuesto));
          if (match) {
            return {
              ...f,
              contenedorAsignado: match.contenedorAsignado,
              palletAsignado: match.palletAsignado,
              packageNo: match.packageNo,
              ubicacionCedis: match.ubicacionCedis,
              cantidadAsignada: match.cantidadAsignada,
              estatusLinea: match.nuevoEstatus,
            };
          }
          return f;
        })
      );

      notificar(`¡Matching FIFO completado! ${asignables.length} pedidos actualizados a Asignado.`);
    } catch (err) {
      console.error('Error aplicando matching FIFO:', err);
      notificar('Error al procesar matching.');
    } finally {
      setAplicandoMatching(false);
    }
  };

  // Imprimir etiquetas en masa para todos los pedidos matcheados / asignados
  const handleImprimirEtiquetasMatcheados = () => {
    const pedidosMatcheados = filas.filter(
      f => f.estatusLinea === 'Asignado' || f.estatusLinea === 'En Tránsito Asignado' || f.cantidadAsignada > 0
    );

    if (pedidosMatcheados.length === 0) {
      notificar('No hay pedidos asignados/matcheados con stock para generar etiquetas.');
      return;
    }

    descargarEtiquetasEnLote(pedidosMatcheados);
    notificar(`Generando PDF con ${pedidosMatcheados.length} etiquetas de repuestos matcheados...`);
  };

  // Descargar Manifiesto Físico para Carpeta de Archivo de Auditoría
  const handleDescargarManifiestoFisico = () => {
    if (despachosFiltrados.length === 0) {
      notificar('No hay registros de despachos para generar el manifiesto.');
      return;
    }

    descargarManifiestoArchivoFisico(despachosFiltrados, { sucursal: filtroSucursal });
    notificar(`Generando Manifiesto Oficial de Despachos Físicos (${despachosFiltrados.length} registros)...`);
  };

  // Consolidación de despachos: Registros de Despachos + Filas de matriz que ya fueron despachadas
  const despachosConsolidados = useMemo(() => {
    const mapDespachos = new Map<string, DespachoRegistro>();

    // 1. Registros oficiales de la tabla de despachos / caché
    despachos.forEach(d => {
      const key = (d.pedidoId || d.id || '').trim();
      if (key) {
        mapDespachos.set(key, d);
      }
    });

    // 2. Filas de matriz que figuran como despachadas
    filas.forEach(f => {
      const esDesp =
        f.estatusLinea === 'Despachado' ||
        (f.cantidadDespachada > 0 && f.cantidadDespachada >= f.cantidadSolicitada);

      if (esDesp) {
        const key = (f.pedidoId || f.lineaId || '').trim();
        if (!mapDespachos.has(key)) {
          mapDespachos.set(key, {
            id: `DSP-${f.lineaId}`,
            numeroGuia: `ACTA-${f.pedidoId || f.lineaId}`,
            pedidoId: f.pedidoId,
            sucursalDestino: f.sucursal,
            transportista: `Retiro Mostrador (${f.colaborador || 'Personal Sucursal'})`,
            placaVehiculo: 'RETIRO EN CEDIS',
            despachadorCedis: 'Bodega Central CEDIS',
            fechaDespacho: new Date().toISOString().slice(0, 10),
            totalPiezas: f.cantidadDespachada || f.cantidadSolicitada || 1,
            totalLineas: 1,
            estadoEntrega: 'ENTREGADO',
            observaciones: `Repuesto ${f.codigoRepuesto} (${f.descripcionOficial}) - Cliente: ${f.cliente || 'Taller'}`,
            lineasJson: JSON.stringify([f]),
          });
        }
      }
    });

    return Array.from(mapDespachos.values());
  }, [despachos, filas]);

  // Filtrado reactivo de pedidos (Por defecto excluye pedidos ya despachados para no crear confusión)
  const pedidosFiltrados = useMemo(() => {
    return filas.filter(f => {
      const coincideSucursal = filtroSucursal === 'TODAS' || f.sucursal.toLowerCase() === filtroSucursal.toLowerCase();
      
      const esDespachado = (f.estatusLinea || '').toLowerCase() === 'despachado';
      const coincideEstatus =
        filtroEstatus === 'ACTIVOS'
          ? !esDespachado
          : filtroEstatus === 'TODOS'
          ? true
          : (filtroEstatus === 'Pendiente' && (f.estatusLinea === 'Pendiente' || !f.estatusLinea)) ||
            f.estatusLinea?.toLowerCase() === filtroEstatus.toLowerCase();

      // Filtro por Contenedor
      const coincideContenedor =
        filtroContenedor === 'TODOS'
          ? true
          : filtroContenedor === 'SIN_CONTENEDOR'
          ? !f.contenedorAsignado || f.contenedorAsignado.trim() === '' || f.contenedorAsignado.toLowerCase() === 'por asignar' || f.contenedorAsignado === '-'
          : (f.contenedorAsignado || '').trim().toUpperCase() === filtroContenedor.trim().toUpperCase();

      // Filtro por Pallet / Case
      const coincidePallet =
        filtroPallet === 'TODOS'
          ? true
          : filtroPallet === 'SIN_PALLET'
          ? !f.palletAsignado || f.palletAsignado.trim() === '' || f.palletAsignado.toLowerCase() === 'por asignar' || f.palletAsignado === '-'
          : (f.palletAsignado || '').trim().toUpperCase() === filtroPallet.trim().toUpperCase();

      const q = busquedaPedido.trim().toLowerCase();
      const coincideTexto =
        !q ||
        f.codigoRepuesto.toLowerCase().includes(q) ||
        f.descripcionOficial.toLowerCase().includes(q) ||
        f.cliente.toLowerCase().includes(q) ||
        f.numeroOR.toLowerCase().includes(q) ||
        f.vin.toLowerCase().includes(q) ||
        f.pedidoId.toLowerCase().includes(q) ||
        (f.contenedorAsignado && f.contenedorAsignado.toLowerCase().includes(q)) ||
        (f.palletAsignado && f.palletAsignado.toLowerCase().includes(q));

      return coincideSucursal && coincideEstatus && coincideContenedor && coincidePallet && coincideTexto;
    });
  }, [filas, filtroSucursal, filtroEstatus, filtroContenedor, filtroPallet, busquedaPedido]);

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

  // Filtrado de despachos consolidados
  const despachosFiltrados = useMemo(() => {
    return despachosConsolidados.filter(d => {
      const q = busquedaDespacho.trim().toLowerCase();
      return (
        !q ||
        d.numeroGuia.toLowerCase().includes(q) ||
        d.sucursalDestino.toLowerCase().includes(q) ||
        d.pedidoId.toLowerCase().includes(q) ||
        d.transportista.toLowerCase().includes(q) ||
        (d.observaciones && d.observaciones.toLowerCase().includes(q))
      );
    });
  }, [despachosConsolidados, busquedaDespacho]);

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

  // Contenedores únicos detectados en pedidos e inventario
  const contenedoresUnicos = useMemo(() => {
    const set = new Set<string>();
    filas.forEach(f => {
      const c = (f.contenedorAsignado || '').trim();
      if (c && c !== '-' && c.toLowerCase() !== 'por asignar' && c.toLowerCase() !== 'sin embarque') {
        set.add(c);
      }
    });
    manifiestos.forEach(m => {
      const c = (m.contenedorId || '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [filas, manifiestos]);

  // Pallets únicos detectados en pedidos e inventario
  const palletsUnicos = useMemo(() => {
    const set = new Set<string>();
    filas.forEach(f => {
      const p = (f.palletAsignado || '').trim();
      if (p && p !== '-' && p.toLowerCase() !== 'por asignar') {
        set.add(p);
      }
    });
    inventario.forEach(i => {
      const p = (i.palletCaseNo || '').trim();
      if (p) set.add(p);
    });
    return Array.from(set).sort();
  }, [filas, inventario]);

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
                onClick={() => cargarDatos(true)}
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
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-900/30 text-white">
              {filas.filter(f => f.estatusLinea !== 'Despachado').length} activos
            </span>
          </button>

          <button
            onClick={() => setVistaActiva('despachos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              vistaActiva === 'despachos'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-clipboard-check"></i>
            <span>Retiro en Mostrador CEDIS / Despachos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white">
              {despachosConsolidados.length}
            </span>
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
            <i className="fas fa-address-book"></i>
            <span>BD Encargados</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-900/30 text-white">{encargados.length || 9}</span>
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
                  <p className="text-2xl font-black text-slate-900 mt-1">{filas.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {filas.filter(f => f.estatusLinea !== 'Despachado').length} activos · {filas.filter(f => f.estatusLinea === 'Despachado').length} despachados
                  </p>
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
                  <p className="text-2xl font-black text-sky-600 mt-1">{despachosConsolidados.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total repuestos retirados</p>
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

                  {/* Acciones de exportación, importación y depuración */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setModalBackupAbierto(true)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 border border-emerald-800/30 cursor-pointer"
                      title="Importa pedidos históricos desde un archivo Excel (.xlsx/.xls) o CSV de respaldo con normalización automática a Supabase"
                    >
                      <i className="fas fa-file-excel text-emerald-200"></i>
                      <span>📥 Importar Backup (Excel/CSV)</span>
                    </button>

                    <button
                      onClick={handleAnalizarYDepurar}
                      disabled={depurandoMatriz}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 border border-amber-800/30 disabled:opacity-50"
                      title="Analiza la base de datos completa y transfiere automáticamente todos los pedidos despachados a la sección de Despacho"
                    >
                      <i className={`fas fa-magic ${depurandoMatriz ? 'animate-spin text-amber-200' : 'text-amber-200'}`}></i>
                      <span>{depurandoMatriz ? 'Depurando...' : '⚡ Analizar y Depurar Matriz'}</span>
                    </button>

                    <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1.5 rounded-lg">
                      Mostrando {pedidosFiltrados.length} de {filas.length} pedidos
                    </span>
                  </div>
                </div>

                {/* Barra de Filtros y Búsqueda */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
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
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
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
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                    >
                      <option value="ACTIVOS">⚡ Activos por Despachar (Excluye Despachados)</option>
                      <option value="Pendiente">🟡 Solo Pendientes</option>
                      <option value="Asignado">🔵 Asignados / En Picking</option>
                      <option value="Sin Stock">🔴 Sin Stock</option>
                      <option value="Despachado">🟢 Ver Solo Despachados</option>
                      <option value="TODOS">📋 Todos los Registros (Histórico Completo)</option>
                    </select>
                  </div>

                  {/* Filtro Contenedor */}
                  <div>
                    <select
                      value={filtroContenedor}
                      onChange={e => setFiltroContenedor(e.target.value)}
                      className={`w-full px-2.5 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium transition ${
                        filtroContenedor !== 'TODOS'
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-bold'
                          : 'border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="TODOS">🚢 Contenedor: Todos ({contenedoresUnicos.length})</option>
                      <option value="SIN_CONTENEDOR">⚪ Sin Contenedor asignado</option>
                      {contenedoresUnicos.map(c => (
                        <option key={c} value={c}>Contenedor: {c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Pallet */}
                  <div>
                    <select
                      value={filtroPallet}
                      onChange={e => setFiltroPallet(e.target.value)}
                      className={`w-full px-2.5 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium transition ${
                        filtroPallet !== 'TODOS'
                          ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold'
                          : 'border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="TODOS">📦 Pallet: Todos ({palletsUnicos.length})</option>
                      <option value="SIN_PALLET">⚪ Sin Pallet asignado</option>
                      {palletsUnicos.map(p => (
                        <option key={p} value={p}>Pallet: {p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Filters */}
                  <button
                    onClick={() => {
                      setBusquedaPedido('');
                      setFiltroSucursal('TODAS');
                      setFiltroEstatus('ACTIVOS');
                      setFiltroContenedor('TODOS');
                      setFiltroPallet('TODOS');
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200/70 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fas fa-undo"></i>Limpiar Filtros
                  </button>
                </div>
              </div>

                {/* Barra de Acciones en Lote (Eliminación múltiple y Etiquetas PDF) */}
                {selectedLineas.size > 0 && (
                  <div className="mx-5 mb-3 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between flex-wrap gap-3 shadow-lg border border-red-500/30">
                    <div className="flex items-center gap-3">
                      <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-md shadow-sm">
                        {selectedLineas.size} pedidos seleccionados
                      </span>
                      <span className="text-xs text-slate-300 hidden sm:inline font-medium">
                        Acciones en lote disponibles:
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleImprimirEtiquetasLote}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title="Imprimir etiquetas de pedidos especiales (100x150mm) para los pedidos seleccionados"
                      >
                        <i className="fas fa-tags text-cyan-200"></i>
                        <span>Imprimir Etiquetas PDF ({selectedLineas.size})</span>
                      </button>

                      <button
                        onClick={handleEliminarSeleccionados}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                        title="Eliminar permanentemente todos los pedidos seleccionados de la base de datos"
                      >
                        <i className="fas fa-trash-alt text-red-200"></i>
                        <span>Eliminar Seleccionados</span>
                      </button>

                      <button
                        onClick={() => setSelectedLineas(new Set())}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Deseleccionar
                      </button>
                    </div>
                  </div>
                )}

                {/* Listado de Pedidos */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                        <th className="py-3 px-3 text-center w-10">
                          <input
                            type="checkbox"
                            checked={pedidosFiltrados.length > 0 && selectedLineas.size === pedidosFiltrados.length}
                            onChange={handleToggleSelectAll}
                            className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer w-4 h-4"
                            title="Seleccionar / deseleccionar todos los pedidos visibles"
                          />
                        </th>
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
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            <i className="fas fa-inbox text-3xl mb-2 block"></i>
                            No se encontraron pedidos con los filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        pedidosFiltrados.map((fila) => {
                          const esDespachado = fila.estatusLinea === 'Despachado';
                          const esAsignado = fila.estatusLinea === 'Asignado';
                          const esSinStock = fila.estatusLinea === 'Sin Stock';
                          const isChecked = selectedLineas.has(fila.lineaId);

                          return (
                            <tr
                              key={fila.lineaId}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                isChecked ? 'bg-red-50/50' : ''
                              }`}
                            >
                              {/* Checkbox de Selección */}
                              <td className="py-3 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSelectRow(fila.lineaId)}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer w-4 h-4"
                                />
                              </td>

                              {/* Pedido / OR */}
                              <td className="py-3 px-4">
                                <span className="font-mono font-bold text-slate-900 block">{fila.pedidoId}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {fila.numeroOR ? `OR: ${fila.numeroOR}` : 'Sin No. OR'}
                                </span>
                              </td>

                              {/* Repuesto */}
                              <td className="py-3 px-4 max-w-xs">
                                {fila.codigoRepuesto ? (
                                  <span className="font-mono font-bold text-cyan-700 block text-xs">{fila.codigoRepuesto}</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mb-0.5">
                                    <i className="fas fa-info-circle text-amber-500 text-[9px]"></i>
                                    {fila.descripcionOficial ? 'Código por asignar' : 'Sin código OEM'}
                                  </span>
                                )}
                                <span className="text-slate-700 truncate block text-[11px] font-medium" title={fila.descripcionOficial}>
                                  {fila.descripcionOficial || (fila.codigoRepuesto ? 'Repuesto Original Changan' : 'Pieza no detallada en matriz')}
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
                                {fila.contenedorAsignado && (
                                  <span className="block text-[10px] text-blue-600 font-semibold truncate max-w-[140px]" title={`Contenedor: ${fila.contenedorAsignado}`}>
                                    <i className="fas fa-ship mr-1 text-[9px]"></i>{fila.contenedorAsignado}
                                  </span>
                                )}
                                {fila.palletAsignado && (
                                  <span className="block text-[10px] text-amber-700 font-semibold" title={`Pallet: ${fila.palletAsignado}`}>
                                    <i className="fas fa-pallet mr-1 text-[9px]"></i>Pallet: {fila.palletAsignado}
                                  </span>
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
                                  {esDespachado ? (
                                    <button
                                      onClick={() => {
                                        setVistaActiva('despachos');
                                        setBusquedaDespacho(fila.pedidoId || fila.codigoRepuesto);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                                      title="Ver registro y acta oficial en la pestaña de Despachos"
                                    >
                                      <i className="fas fa-clipboard-check text-emerald-600"></i>
                                      <span>Ver Despacho</span>
                                    </button>
                                  ) : (
                                    <>
                                      {!esAsignado && (
                                        <button
                                          onClick={() => handleAsignarStock(fila)}
                                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                                          title="Asignar rack y pallet de inventario"
                                        >
                                          <i className="fas fa-bolt"></i>
                                          <span>Asignar</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleAbrirModalRetiro(fila)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                                        title="Registrar retiro en mostrador CEDIS por parte de la sucursal y generar Acta PDF"
                                      >
                                        <i className="fas fa-clipboard-check"></i>
                                        <span>Retiro Mostrador</span>
                                      </button>
                                    </>
                                  )}

                                  {/* Botón Etiqueta de Pedido Especial */}
                                  <button
                                    onClick={() => handleDescargarEtiqueta(fila)}
                                    className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded font-bold text-[11px] transition-colors flex items-center gap-1"
                                    title="Descargar e imprimir Etiqueta Oficial de Pedido Especial (100x150mm / 4x6 pulg.)"
                                  >
                                    <i className="fas fa-tag text-cyan-600"></i>
                                    <span>Etiqueta</span>
                                  </button>

                                  {/* Botón Rastreador */}
                                  <button
                                    onClick={() => handleAbrirRastreador(fila.codigoRepuesto)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-semibold text-[11px] transition-colors"
                                    title="Ver trazabilidad en contenedores y pedidos"
                                  >
                                    <i className="fas fa-search"></i>
                                  </button>

                                  {/* Botón Eliminar Pedido Individual */}
                                  <button
                                    onClick={() => handleEliminarIndividual(fila)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded font-semibold text-[11px] transition-colors"
                                    title="Eliminar este pedido de la base de datos"
                                  >
                                    <i className="fas fa-trash-alt"></i>
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
        {/* VISTA 2: RETIRO EN MOSTRADOR CEDIS & ACTAS DE ENTREGA                     */}
        {/* ========================================================================= */}
        {vistaActiva === 'despachos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i className="fas fa-clipboard-check text-emerald-600"></i>
                    Control de Retiros en Mostrador CEDIS y Despachos Consolidados
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Historial oficial consolidado de repuestos especiales ya despachados o retirados presencialmente por asesores y personal en Bodega Central.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleDescargarManifiestoFisico}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm border border-slate-700"
                    title="Generar e imprimir Manifiesto Consolidado de Despachos Físicos para archivar en carpeta física de auditoría de CEDIS"
                  >
                    <i className="fas fa-print text-red-400"></i>
                    <span>📑 Manifiesto Archivo Físico (PDF)</span>
                  </button>

                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hidden sm:inline-block">
                    Total Despachados: {despachosConsolidados.length}
                  </span>
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      placeholder="Buscar por acta, pedido, repuesto, sucursal..."
                      value={busquedaDespacho}
                      onChange={e => setBusquedaDespacho(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla de Retiros */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <th className="py-3 px-4">No. Acta / Folio</th>
                      <th className="py-3 px-4">Pedido / OR</th>
                      <th className="py-3 px-4">Repuesto / Detalle</th>
                      <th className="py-3 px-4">Sucursal Retiro</th>
                      <th className="py-3 px-4">Personal que Retiró</th>
                      <th className="py-3 px-4 text-center">Piezas</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acta Oficial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {despachosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <i className="fas fa-clipboard text-3xl mb-2 block text-slate-300"></i>
                          No hay registros de retiros que coincidan con la búsqueda. Puedes usar "⚡ Analizar y Depurar Matriz" en Gestión de Pedidos para organizar repuestos despachados.
                        </td>
                      </tr>
                    ) : (
                      despachosFiltrados.map((d) => {
                        let repuestoInfo = '';
                        try {
                          if (d.lineasJson) {
                            const parsed = JSON.parse(d.lineasJson);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                              repuestoInfo = `${parsed[0].codigoRepuesto || ''} - ${parsed[0].descripcionOficial || ''}`;
                            }
                          }
                        } catch {}
                        if (!repuestoInfo && d.observaciones) {
                          repuestoInfo = d.observaciones;
                        }

                        return (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-red-700">
                              <span className="block">{d.numeroGuia}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {d.id.startsWith('DSP-AUTO') || d.id.startsWith('DSP-LIN') ? 'Desde Matriz' : 'Acta en Mostrador'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono">
                              <span className="font-bold text-slate-800 block">{d.pedidoId}</span>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-semibold text-slate-800 text-xs truncate" title={repuestoInfo}>
                                {repuestoInfo || 'Repuestos retirados de bodega'}
                              </div>
                              {d.observaciones && (
                                <div className="text-[10px] text-slate-400 truncate" title={d.observaciones}>
                                  {d.observaciones}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">{d.sucursalDestino}</td>
                            <td className="py-3 px-4 text-slate-600">
                              <div className="font-semibold text-slate-800">{d.transportista}</div>
                              <div className="text-[11px] text-slate-400">Fecha: {d.fechaDespacho} | Despachador: {d.despachadorCedis}</div>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-900">{d.totalPiezas}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {d.estadoEntrega || 'ENTREGADO'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleReDescargarActa(d)}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
                                  title="Descargar Acta de Retiro en Mostrador"
                                >
                                  <i className="fas fa-file-pdf"></i>
                                  <span>Acta PDF</span>
                                </button>
                                <button
                                  onClick={() => descargarComprobanteSalidaFisica(d)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
                                  title="Imprimir Comprobante Oficial de Salida Física de Bodega para archivo físico"
                                >
                                  <i className="fas fa-file-signature text-emerald-600"></i>
                                  <span>Salida Física</span>
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
        {/* ========================================================================= */}
        {/* VISTA 5: MOTOR DE MATCHING INTERACTIVO & PRE-ARRIBO                       */}
        {/* ========================================================================= */}
        {vistaActiva === 'matching' && (() => {
          const cantEnCamino = preMatchingTransito.filter(p => p.vieneEnCamino).length;
          const cantMatcheados = filas.filter(
            f => f.estatusLinea === 'Asignado' || f.estatusLinea === 'En Tránsito Asignado' || f.cantidadAsignada > 0
          ).length;

          return (
            <div className="space-y-6">
              <div className="bg-slate-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
                {/* Cabecera y Botones de Acción Global */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2.5">
                      <i className="fas fa-random text-rose-500"></i>
                      <span>Motor de Matching, Pre-Arribo y Asignación de Repuestos</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Cruce inteligente de pedidos contra DPLs marítimos en tránsito y stock físico en Bodega Central CEDIS.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Botón de Acción según pestaña activa */}
                    {modoMatching === 'transito' ? (
                      <button
                        onClick={handleAplicarPreAsignacionTransito}
                        disabled={cantEnCamino === 0 || aplicandoMatching}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                        title="Registra contenedor y pallet en los pedidos antes del arribo"
                      >
                        <i className={`fas ${aplicandoMatching ? 'fa-spinner fa-spin' : 'fa-bolt text-yellow-300'}`}></i>
                        <span>Aplicar Pre-Asignación en Tránsito ({cantEnCamino})</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleAplicarMatchingFIFODefinitivo}
                        disabled={matchingResult.asignadasTotales === 0 || aplicandoMatching}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                        title="Reserva stock recibido en bodega para los pedidos según FIFO"
                      >
                        <i className={`fas ${aplicandoMatching ? 'fa-spinner fa-spin' : 'fa-check-double text-emerald-200'}`}></i>
                        <span>Aplicar Matching FIFO en Firme ({matchingResult.asignadasTotales})</span>
                      </button>
                    )}

                    {/* Botón Masivo de Impresión de Etiquetas */}
                    <button
                      onClick={handleImprimirEtiquetasMatcheados}
                      disabled={cantMatcheados === 0}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                      title="Imprime todas las etiquetas adhesivas 100x150mm de repuestos con contenedor/pallet asignado"
                    >
                      <i className="fas fa-tags text-sm"></i>
                      <span>Imprimir Etiquetas Masivas ({cantMatcheados})</span>
                    </button>
                  </div>
                </div>

                {/* Selector de Sub-Pestañas */}
                <div className="flex items-center gap-3 pt-6 pb-2">
                  <button
                    onClick={() => setModoMatching('transito')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      modoMatching === 'transito'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <i className="fas fa-ship"></i>
                    <span>Pre-Arribo: En Tránsito por Pallet / Contenedor</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono">
                      {cantEnCamino} coincidencia{cantEnCamino !== 1 ? 's' : ''}
                    </span>
                  </button>

                  <button
                    onClick={() => setModoMatching('bodega')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      modoMatching === 'bodega'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <i className="fas fa-boxes"></i>
                    <span>Bodega CEDIS: Inventario Físico Recibido (FIFO)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-mono">
                      {matchingResult.asignadasTotales} asignables
                    </span>
                  </button>
                </div>

                {/* Sub-Pestaña 1: Pre-Arribo en Tránsito (Por Contenedor y Pallet) */}
                {modoMatching === 'transito' ? (
                  <div className="space-y-4 mt-4">
                    {/* Alerta Informativa */}
                    <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <i className="fas fa-info-circle text-lg"></i>
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-blue-200 text-sm">
                          Visibilidad Anticipada de Carga en Alta Mar / Aduanas
                        </p>
                        <p className="text-blue-300/80 mt-1">
                          Cruza en tiempo real los pedidos especiales de las sucursales con los DPLs en tránsito. Te permite saber con semanas de anticipación <strong>en qué contenedor marítimo</strong> y <strong>número de pallet/case exacto</strong> viene el repuesto de cada cliente para notificar inmediatamente al asesor.
                        </p>
                      </div>
                    </div>

                    {/* Tabla de Resultados Pre-Arribo */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-400 uppercase text-[11px]">
                            <tr>
                              <th className="px-4 py-3 text-left">Pedido / OR</th>
                              <th className="px-4 py-3 text-left">Repuesto Solicitado</th>
                              <th className="px-4 py-3 text-left">Sucursal & Asesor</th>
                              <th className="px-4 py-3 text-center">Cant.</th>
                              <th className="px-4 py-3 text-left">Contenedor en Camino</th>
                              <th className="px-4 py-3 text-center">Pallet / Case No.</th>
                              <th className="px-4 py-3 text-center">ETA Arribo</th>
                              <th className="px-4 py-3 text-center">Estado Logístico</th>
                              <th className="px-4 py-3 text-center">Etiqueta</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {preMatchingTransito.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                                  <i className="fas fa-box-open text-3xl mb-2 block opacity-40"></i>
                                  No hay pedidos pendientes para cruzar con DPLs en tránsito.
                                </td>
                              </tr>
                            ) : (
                              preMatchingTransito.map((p, idx) => {
                                const filaReal = filas.find(f => f.lineaId === p.lineaId || f.pedidoId === p.pedidoId);
                                return (
                                  <tr key={idx} className={`hover:bg-slate-800/40 transition-colors ${p.vieneEnCamino ? 'bg-blue-950/20' : ''}`}>
                                    <td className="px-4 py-3">
                                      <div className="font-mono font-bold text-white">{p.pedidoId}</div>
                                      <div className="text-[10px] text-slate-400">{p.numeroOR || 'Sin OR'}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="font-mono text-cyan-400 font-bold">{p.codigoRepuesto}</div>
                                      <div className="text-[11px] text-slate-300 truncate max-w-xs">{p.descripcionOficial}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-slate-200">{p.sucursal}</div>
                                      <div className="text-[10px] text-slate-400">{p.cliente || 'Stock Sucursal'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-white">
                                      {p.cantidadSolicitada}
                                    </td>
                                    <td className="px-4 py-3">
                                      {p.vieneEnCamino ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-bold text-[11px]">
                                          <i className="fas fa-ship text-blue-400 text-[10px]"></i>
                                          {p.contenedorEnCamino}
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 italic text-[11px]">Sin contenedor asignado</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {p.vieneEnCamino ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-black text-xs">
                                          <i className="fas fa-pallet text-[10px]"></i>
                                          {p.palletEnCamino}
                                        </span>
                                      ) : (
                                        <span className="text-slate-500">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className="inline-flex items-center gap-1 text-slate-300 font-medium">
                                        <i className="fas fa-calendar-alt text-slate-500 text-[10px]"></i>
                                        {p.eta}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                          p.vieneEnCamino
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-slate-700/50 text-slate-400'
                                        }`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${p.vieneEnCamino ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                                        {p.vieneEnCamino ? p.estadoEmbarque : 'POR EMBARCAR'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {p.vieneEnCamino && filaReal && (
                                        <button
                                          onClick={() => descargarEtiquetaPedido(filaReal)}
                                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] font-bold border border-amber-500/30 inline-flex items-center gap-1 transition-all cursor-pointer"
                                          title="Imprimir etiqueta térmica 100x150mm"
                                        >
                                          <i className="fas fa-tag"></i>
                                          <span>100x150mm</span>
                                        </button>
                                      )}
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
                ) : (
                  /* Sub-Pestaña 2: Bodega CEDIS - Inventario Físico Recibido (FIFO) */
                  <div className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                              <th className="px-4 py-3 text-center">Etiqueta</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {matchingResult.detalles.map((detalle: any, idx: number) => {
                              const filaReal = filas.find(f => f.lineaId === detalle.lineaId || f.pedidoId === detalle.pedidoId);
                              return (
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
                                  <td className="px-4 py-3 text-center">
                                    {detalle.cantidadAsignada > 0 && filaReal && (
                                      <button
                                        onClick={() => descargarEtiquetaPedido(filaReal)}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] font-bold border border-amber-500/30 inline-flex items-center gap-1 transition-all cursor-pointer"
                                        title="Descargar etiqueta 100x150mm"
                                      >
                                        <i className="fas fa-tag"></i>
                                        <span>100x150mm</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
              onIrAMatching={(modo) => {
                if (modo) setModoMatching(modo);
                setVistaActiva('matching');
              }}
              filas={filas}
              onActualizarEstatusManifiesto={(contId, nuevoEstado) => {
                setManifiestos(prev =>
                  prev.map(m =>
                    (m.contenedorId || '').toUpperCase() === contId.toUpperCase()
                      ? { ...m, estado: nuevoEstado }
                      : m
                  )
                );
              }}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 7: BD ENCARGADOS (Directorio Oficial de Sucursales y Asesores)       */}
        {/* ========================================================================= */}
        {vistaActiva === 'encargados' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i className="fas fa-address-book text-red-600"></i>
                    BD Encargados - Directorio Oficial de Sucursales y Asesores
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Directorio corporativo oficial de asesores de repuestos, departamentos, coordinadores de taller y bodegueros de cada sucursal de Changan Panamá.
                  </p>
                </div>

                {/* Alternador de Vista (Tabla vs Tarjetas) */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
                  <button
                    onClick={() => setVistaEncargadosModo('tabla')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      vistaEncargadosModo === 'tabla'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <i className="fas fa-table"></i>
                    <span>Vista Tabla</span>
                  </button>
                  <button
                    onClick={() => setVistaEncargadosModo('tarjetas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      vistaEncargadosModo === 'tarjetas'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <i className="fas fa-th-large"></i>
                    <span>Tarjetas</span>
                  </button>
                </div>
              </div>

              {/* Vista 1: Tabla Estructurada BD Encargados */}
              {vistaEncargadosModo === 'tabla' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                        <th className="py-3 px-4"># ID</th>
                        <th className="py-3 px-4">Sucursal</th>
                        <th className="py-3 px-4">Colaborador / Asesor</th>
                        <th className="py-3 px-4">Departamento</th>
                        <th className="py-3 px-4">Cargo Oficial</th>
                        <th className="py-3 px-4">Teléfono Móvil</th>
                        <th className="py-3 px-4 text-center">WhatsApp Directo</th>
                        <th className="py-3 px-4">Correo Electrónico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {encargados.map((enc) => (
                        <tr key={enc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-400">
                            {enc.id}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-black bg-red-100 text-red-800">
                              {enc.sucursal}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                            {enc.nombre}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {enc.departamento || 'Taller / Mostrador'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {enc.cargo}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <a href={`tel:${enc.telefono}`} className="text-slate-800 hover:text-red-600 font-semibold">
                              {enc.telefono}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <a
                              href={`https://wa.me/${enc.whatsapp || enc.telefono.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(enc.nombre)},%20te%20contacto%20desde%20CEDIS%20Central%20Changan`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              <i className="fab fa-whatsapp"></i>
                              <span>Chatear</span>
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            {enc.correo ? (
                              <a href={`mailto:${enc.correo}`} className="text-red-700 hover:underline">
                                {enc.correo}
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">No asignado</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Vista 2: Tarjetas Grid */}
              {vistaEncargadosModo === 'tarjetas' && (
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
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold border border-slate-200">
                            {enc.departamento || 'Taller'}
                          </span>
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
                          {enc.correo && (
                            <div className="flex items-center gap-2">
                              <i className="fas fa-envelope text-slate-400 w-4"></i>
                              <a href={`mailto:${enc.correo}`} className="hover:text-red-600 truncate">
                                {enc.correo}
                              </a>
                            </div>
                          )}
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
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <i className="fab fa-whatsapp text-sm"></i>
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`mailto:${enc.correo || 'repuestos@changanpanama.com'}?subject=Coordinaci%C3%B3n%20Log%C3%ADstica%20CEDIS%20Changan`}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <i className="fas fa-envelope text-xs"></i>
                          <span>Correo</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMACIÓN DE RETIRO EN MOSTRADOR CEDIS & ACTA PDF              */}
      {/* ========================================================================= */}
      {modalRetiroAbierto && lineaARetirar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                  <i className="fas fa-clipboard-check"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Acta de Retiro en Mostrador CEDIS</h3>
                  <p className="text-xs text-slate-500">Entrega presencial en Bodega Central (Sin camión)</p>
                </div>
              </div>
              <button
                onClick={() => setModalRetiroAbierto(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Resumen del Repuesto a Retirar */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Pedido ID / Folio:</span>
                <span className="font-mono font-bold">{lineaARetirar.pedidoId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sucursal que Retira:</span>
                <span className="font-bold text-red-700">{lineaARetirar.sucursal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Repuesto:</span>
                <span className="font-mono font-bold text-cyan-700">{lineaARetirar.codigoRepuesto}</span>
              </div>
              <div className="text-slate-600 truncate">{lineaARetirar.descripcionOficial}</div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span>Cantidad a entregar:</span>
                <span className="text-emerald-700">{lineaARetirar.cantidadSolicitada} unidades</span>
              </div>
            </div>

            {/* Formulario de Retiro */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Personal que Retira (Sucursal) *
                </label>
                <input
                  type="text"
                  value={personaQueRetiraInput}
                  onChange={e => setPersonaQueRetiraInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  placeholder="Ej: Carlos Vega (Chofer / Mensajero de Sucursal)"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cédula / Documento de Identidad
                </label>
                <input
                  type="text"
                  value={cedulaPersonaInput}
                  onChange={e => setCedulaPersonaInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="Ej: 8-888-8888"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Entregado por (Bodega Central CEDIS)
                </label>
                <input
                  type="text"
                  value={entregadorCedisInput}
                  onChange={e => setEntregadorCedisInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Inspección Física
                </label>
                <textarea
                  value={observacionesRetiroInput}
                  onChange={e => setObservacionesRetiroInput(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Mercancía revisada físicamente por la persona que retira..."
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalRetiroAbierto(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmarRetiroCedis}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <i className="fas fa-clipboard-check"></i>
                <span>Confirmar Entrega y Descargar Acta PDF</span>
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

      {/* Modal Carga DPL (Excel / CSV / Portapapeles) */}
      <ModalCargaDPL
        isOpen={modalDPLAbierto}
        onClose={() => setModalDPLAbierto(false)}
        onDPLCargado={handleDPLCargado}
      />

      {/* Modal Importar Backup (Excel / CSV / Portapapeles) */}
      <ModalImportarBackup
        isOpen={modalBackupAbierto}
        onClose={() => setModalBackupAbierto(false)}
        onImportacionExitosa={(totalLineas, pedidosUnicos) => {
          cargarDatos(true);
          notificar(`¡Backup importado con éxito! ${totalLineas} repuestos en ${pedidosUnicos} pedidos.`);
        }}
      />
    </div>
  );
}
