/**
 * Tipos de dominio para el sistema CEDIS Changan Panamá
 */

// ========== AUTENTICACIÓN ==========
export interface AuthState {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'asesor';
  sucursal?: string;
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

// ========== ASESORES ==========
export interface Asesor {
  id: number;
  nombre: string;
  sucursal: string;
  departamento: string;
  cargo: string;
  telefono: string;
  correo: string;
}

// ========== LOGÍSTICA Y CLASIFICACIÓN ==========
export type MetodoTransporteFabrica = 'Aereo' | 'Maritimo';

export type CategoriaEstructuraRepuesto =
  | 'Airbags / Pirotécnicos (DGR)'
  | 'Carrocería Mayor / Colisión'
  | 'Vidrios y Parabrisas'
  | 'Pieza Mecánica / Motor'
  | 'Eléctrico / Sensores';

export interface ClasificacionRepuesto {
  transporte: MetodoTransporteFabrica;
  pesoUnitarioKg: number;
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  pesoVolumetricoKg: number;
  categoriaEstructura: CategoriaEstructuraRepuesto;
  motivo: string;
  esDGR: boolean;
}

export interface ItemOrderingTemplate {
  id?: string;
  partsCode: string;
  orderingQuantity: number;
  comment: string;
  categorizacion: MetodoTransporteFabrica;
  categoriaEstructura: CategoriaEstructuraRepuesto;
  pesoUnitarioKg: number;
  pesoVolumetricoKg: number;
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  esDGR: boolean;
  motivoClasificacion: string;
  pedidoId?: string;
  sucursal?: string;
  cliente?: string;
  modeloChangan?: string;
  vin?: string;
  numeroOR?: string;
  tipoSolicitud?: string;
  quincena?: string;
  fechaCreacion?: string;
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
export interface FilaMatrizCentral {
  pedidoId: string;
  codigoRepuesto: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadAsignada: number;
  cantidadDespachada: number;
  estatusLinea: string;
  sucursal?: string;
  modeloChangan?: string;
  fechaCreacion?: string;
}

export interface KPIsLogisticos {
  fillRate: number;
  otif: number;
  quiebreStock: number;
  tiempoCicloPromedio: number;
  exactitudInventario: number;
  exactitudPicking: number;
  efectividadCruce: number;
  pedidoPerfecto: number;
}

// ========== IMPORTACIÓN ==========
export interface ImportarManifiestoPayload {
  contenedorId: string;
  proveedor?: string;
  poReferencia?: string;
  tipoTransporte?: string;
  fechaArribo?: string;
  blReferencia?: string;
  estado?: EstatusDPL | string;
  creadoPor?: string;
  items: Array<{
    palletCaseNo?: string;
    packageNo?: string;
    codigoRepuesto: string;
    descripcion?: string;
    cantidadTotal: number | string;
    pallet?: string;
    ubicacionCedis?: string;
  }>;
}

export interface ImportarManifiestoResultado {
  success: boolean;
  contenedorId?: string;
  totalLineas?: number;
  totalPiezas?: number;
  skusUnicos?: number;
  totalPallets?: number;
  estado?: EstatusDPL;
  mensaje: string;
  manifiesto?: DPLManifiesto;
  detalles?: DPLDetalle[];
  errores?: string[];
}

// ========== PARSEO EXCEL ==========
export interface ItemExcelParseado {
  caseNo: string;
  packageNo: string;
  purchaseCode: string;
  description: string;
  qty: number;
}

export interface ResultadoParseoExcel {
  success: boolean;
  invoiceNo?: string;
  totalPiezas?: number;
  skus?: number;
  items?: ItemExcelParseado[];
  error?: string;
}

// ========== RASTREADOR UNIVERSAL ==========
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
  detalles: DetallePedidoConciliado[];
  mensaje: string;
  timestamp: string;
}

export interface DetallePedidoConciliado {
  pedidoId: string;
  lineaId: string;
  codigoRepuesto: string;
  cliente: string;
  cantidadSolicitada: number;
  cantidadAsignada: number;
  contenedorAsignado: string;
  palletAsignado: string;
  packageNo: string;
  ubicacionCedis: string;
  estatusLinea: string;
  prioridad: string;
  fechaPedido: string;
}
