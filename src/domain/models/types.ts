/**
 * Tipos completos del sistema CEDIS Changan Panamá
 */

// ========== AUTENTICACIÓN ==========
export interface AuthState {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'asesor';
  sucursal?: string;
}

export interface Asesor {
  id: number;
  nombre: string;
  sucursal: string;
  departamento: string;
  cargo: string;
  telefono: string;
  correo: string;
}

// ========== PEDIDOS ==========
export interface PedidoState {
  folio: string;
  sucursal: string;
  colaborador: string;
  cliente: string;
  modeloChangan: string;
  vin: string;
  noCotizacion: string;
  lineas: LineaPedido[];
  fechaCreacion: string;
  estado: 'BORRADOR' | 'TRANSMITIDO' | 'ASIGNADO' | 'DESPACHADO';
}

export interface LineaPedido {
  codigoRepuesto: string;
  descripcion: string;
  cantidad: number;
  motivo?: string;
}

// ========== LOGÍSTICA ==========
export type MetodoTransporte = 'Aereo' | 'Maritimo';

export type CategoriaRepuesto =
  | 'Airbags / Pirotécnicos (DGR)'
  | 'Carrocería Mayor / Colisión'
  | 'Vidrios y Parabrisas'
  | 'Pieza Mecánica / Motor'
  | 'Eléctrico / Sensores';

export interface ClasificacionRepuesto {
  transporte: MetodoTransporte;
  pesoUnitarioKg: number;
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  pesoVolumetricoKg: number;
  categoria: CategoriaRepuesto;
  motivo: string;
  esDGR: boolean;
}

// ========== MANIFIESTOS DPL ==========
export type EstatusDPL = 'EN TRÁNSITO' | 'ADUANA' | 'RECIBIDO';

export interface DPLManifiesto {
  contenedorId: string;
  proveedor: string;
  fechaArribo: string;
  poReferencia: string;
  tipoTransporte: string;
  totalPiezas: number;
  skusUnicos: number;
  totalPallets: number;
  estado: EstatusDPL;
  creadoPor: string;
  creadoEn: string;
  blReferencia?: string;
}

export interface DPLDetalle {
  inventarioId: string;
  contenedorId: string;
  palletCaseNo: string;
  packageNo: string;
  codigoRepuesto: string;
  descripcion: string;
  cantidadTotal: number;
  cantidadAsignada: number;
  cantidadDespachada: number;
  saldoDisponible: number;
  ubicacionCedis: string;
}

// ========== KPIs ==========
export interface KPIsLogisticos {
  fillRate: number;
  otif: number;
  quiebreStock: number;
  tiempoCiclo: number;
  exactitudInventario: number;
  exactitudPicking: number;
  efectividadCruce: number;
  pedidoPerfecto: number;
  totalPedidos: number;
  totalLineas: number;
  totalPiezasSolicitadas: number;
  piezasCubiertas: number;
}

// ========== MATCHING FIFO ==========
export interface DetallePedido {
  lineaId: string;
  pedidoId: string;
  codigoRepuesto: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadAsignada: number;
  cantidadDespachada: number;
  contenedorAsignado: string;
  palletAsignado: string;
  packageNo: string;
  ubicacionCedis: string;
  estatusLinea: string;
}

export interface SolicitudCabecera {
  pedidoId: string;
  sucursal: string;
  colaborador: string;
  cliente: string;
  modeloChangan: string;
  vin: string;
  numeroOR: string;
  tipoPedido: string;
  fechaCreacion: string;
  estatusGeneral?: string;
}

export interface ResultadoMatchingFIFO {
  success: boolean;
  totalLineas: number;
  asignadasTotales: number;
  asignadasParciales: number;
  sinStock: number;
  piezasAsignadas: number;
  coincidencias: number;
  palletsInvolucrados: string[];
  contenedoresInvolucrados: string[];
  detalles: DetallePedido[];
  mensaje: string;
  timestamp: string;
}

// ========== RASTREADOR ==========
export interface FilaRastreador {
  lineaId: string;
  pedidoId: string;
  codigoRepuesto: string;
  descripcionOficial: string;
  cantidadSolicitada: number;
  cantidadAsignada: number;
  cantidadDespachada: number;
  estatusLinea: string;
  contenedorAsignado: string;
  palletAsignado: string;
  packageNo: string;
  ubicacionCedis: string;
  sucursal: string;
  colaborador: string;
  cliente: string;
  modeloChangan: string;
  numeroOR: string;
  vin: string;
}

// ========== API RESPONSES ==========
export interface FolioResponse {
  folio?: string;
  estado?: string;
  error?: string;
}

export interface TransmisionResponse {
  estado?: string;
  folio?: string;
  timestamp?: string;
  error?: string;
}
