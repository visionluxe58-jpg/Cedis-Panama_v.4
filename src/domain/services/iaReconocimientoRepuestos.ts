/**
 * Sistema de Inteligencia Artificial para Reconocimiento de Repuestos Changan
 * Base de datos completa con dimensiones, pesos y clasificación automática
 */

export interface RepuestoChangan {
  codigo: string;
  descripcion: string;
  modeloCompatible: string[];
  categoria: string;
  peso: number; // en kg
  dimensiones: {
    largo: number; // en cm
    ancho: number; // en cm
    alto: number; // en cm
  };
  viaTransporte: 'Aereo' | 'Maritimo';
  esDGR: boolean;
  precioEstimado: number;
}

// Base de datos de repuestos Changan con IA
export const BASE_DATOS_REPUESTOS: RepuestoChangan[] = [
  // FILTROS Y MANTENIMIENTO
  {
    codigo: '1422020-KC01',
    descripcion: 'Filtro de aceite motor',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Filtros y Mantenimiento',
    peso: 0.3,
    dimensiones: { largo: 10, ancho: 8, alto: 8 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 15.50
  },
  {
    codigo: '1422020-KC02',
    descripcion: 'Filtro de aire',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Filtros y Mantenimiento',
    peso: 0.4,
    dimensiones: { largo: 30, ancho: 20, alto: 5 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 22.00
  },
  {
    codigo: '1422020-KC03',
    descripcion: 'Filtro de combustible',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'UNI-K'],
    categoria: 'Filtros y Mantenimiento',
    peso: 0.5,
    dimensiones: { largo: 15, ancho: 10, alto: 10 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 28.00
  },
  {
    codigo: '1422020-KC04',
    descripcion: 'Filtro de cabina',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Filtros y Mantenimiento',
    peso: 0.3,
    dimensiones: { largo: 25, ancho: 20, alto: 3 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 18.00
  },

  // SISTEMA DE FRENOS
  {
    codigo: '2213010-B01',
    descripcion: 'Pastillas de freno delanteras',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Sistema de Frenos',
    peso: 1.8,
    dimensiones: { largo: 20, ancho: 15, alto: 5 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 65.00
  },
  {
    codigo: '2213010-B02',
    descripcion: 'Pastillas de freno traseras',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Sistema de Frenos',
    peso: 1.5,
    dimensiones: { largo: 18, ancho: 12, alto: 5 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 55.00
  },
  {
    codigo: '2213010-B03',
    descripcion: 'Disco de freno delantero',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Sistema de Frenos',
    peso: 4.5,
    dimensiones: { largo: 30, ancho: 30, alto: 5 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 120.00
  },
  {
    codigo: '2213010-B04',
    descripcion: 'Disco de freno trasero',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Sistema de Frenos',
    peso: 3.8,
    dimensiones: { largo: 28, ancho: 28, alto: 5 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 95.00
  },

  // SUSPENSIÓN Y DIRECCIÓN
  {
    codigo: '4611010-KC1',
    descripcion: 'Amortiguador delantero izquierdo',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Suspensión y Dirección',
    peso: 3.5,
    dimensiones: { largo: 60, ancho: 15, alto: 15 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 180.00
  },
  {
    codigo: '4611010-KC2',
    descripcion: 'Amortiguador delantero derecho',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Suspensión y Dirección',
    peso: 3.5,
    dimensiones: { largo: 60, ancho: 15, alto: 15 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 180.00
  },
  {
    codigo: '4611010-KC3',
    descripcion: 'Amortiguador trasero',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Suspensión y Dirección',
    peso: 2.8,
    dimensiones: { largo: 50, ancho: 12, alto: 12 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 150.00
  },
  {
    codigo: '4611010-KC4',
    descripcion: 'Rótula de dirección',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'UNI-K'],
    categoria: 'Suspensión y Dirección',
    peso: 0.8,
    dimensiones: { largo: 20, ancho: 8, alto: 8 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 45.00
  },

  // SISTEMA ELÉCTRICO
  {
    codigo: '3921010-B01',
    descripcion: 'Sensor de oxígeno',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Sistema Eléctrico',
    peso: 0.3,
    dimensiones: { largo: 15, ancho: 5, alto: 5 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 85.00
  },
  {
    codigo: '3921010-B02',
    descripcion: 'Sensor de temperatura',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Sistema Eléctrico',
    peso: 0.2,
    dimensiones: { largo: 10, ancho: 5, alto: 5 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 35.00
  },
  {
    codigo: '3921010-B03',
    descripcion: 'Módulo de control electrónico (ECU)',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'UNI-K'],
    categoria: 'Sistema Eléctrico',
    peso: 1.2,
    dimensiones: { largo: 25, ancho: 20, alto: 8 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 450.00
  },

  // SISTEMA DE ENCENDIDO
  {
    codigo: '5201010-B01',
    descripcion: 'Bujías de ignición (set x4)',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Sistema de Encendido',
    peso: 0.4,
    dimensiones: { largo: 15, ancho: 10, alto: 5 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 40.00
  },
  {
    codigo: '5201010-B02',
    descripcion: 'Bobina de encendido',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Sistema de Encendido',
    peso: 0.5,
    dimensiones: { largo: 12, ancho: 8, alto: 8 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 55.00
  },

  // SISTEMA DE DISTRIBUCIÓN
  {
    codigo: '3501010-B01',
    descripcion: 'Kit de correa de distribución',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Sistema de Distribución',
    peso: 2.5,
    dimensiones: { largo: 35, ancho: 25, alto: 10 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 220.00
  },
  {
    codigo: '3501010-B02',
    descripcion: 'Tensor de correa',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Sistema de Distribución',
    peso: 0.8,
    dimensiones: { largo: 15, ancho: 10, alto: 10 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 75.00
  },

  // CARROCERÍA - PIEZAS GRANDES (MARÍTIMO)
  {
    codigo: '6311010-B01',
    descripcion: 'Parabrisas delantero',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'UNI-K'],
    categoria: 'Carrocería - Vidrios',
    peso: 12.0,
    dimensiones: { largo: 140, ancho: 90, alto: 5 },
    viaTransporte: 'Maritimo',
    esDGR: false,
    precioEstimado: 350.00
  },
  {
    codigo: '6311010-B02',
    descripcion: 'Vidrio lateral delantero',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Carrocería - Vidrios',
    peso: 5.0,
    dimensiones: { largo: 80, ancho: 60, alto: 5 },
    viaTransporte: 'Maritimo',
    esDGR: false,
    precioEstimado: 180.00
  },
  {
    codigo: '6311010-B03',
    descripcion: 'Vidrio trasero',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Carrocería - Vidrios',
    peso: 8.0,
    dimensiones: { largo: 100, ancho: 70, alto: 5 },
    viaTransporte: 'Maritimo',
    esDGR: false,
    precioEstimado: 250.00
  },

  // PARACHOQUES Y PIEZAS DE CARROCERÍA
  {
    codigo: '7111010-B01',
    descripcion: 'Parachoques delantero',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Carrocería - Parachoques',
    peso: 8.5,
    dimensiones: { largo: 150, ancho: 40, alto: 30 },
    viaTransporte: 'Maritimo',
    esDGR: false,
    precioEstimado: 420.00
  },
  {
    codigo: '7111010-B02',
    descripcion: 'Parachoques trasero',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Carrocería - Parachoques',
    peso: 7.0,
    dimensiones: { largo: 140, ancho: 35, alto: 25 },
    viaTransporte: 'Maritimo',
    esDGR: false,
    precioEstimado: 380.00
  },
  {
    codigo: '7111010-B03',
    descripcion: 'Faro delantero izquierdo',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Carrocería - Iluminación',
    peso: 2.5,
    dimensiones: { largo: 45, ancho: 25, alto: 20 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 280.00
  },
  {
    codigo: '7111010-B04',
    descripcion: 'Faro delantero derecho',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Carrocería - Iluminación',
    peso: 2.5,
    dimensiones: { largo: 45, ancho: 25, alto: 20 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 280.00
  },

  // AIRBAGS Y SISTEMAS DE SEGURIDAD (DGR - MARÍTIMO)
  {
    codigo: '5711010-B01',
    descripcion: 'Airbag conductor',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'UNI-K'],
    categoria: 'Airbags y Seguridad',
    peso: 2.5,
    dimensiones: { largo: 40, ancho: 40, alto: 15 },
    viaTransporte: 'Maritimo',
    esDGR: true,
    precioEstimado: 650.00
  },
  {
    codigo: '5711010-B02',
    descripcion: 'Airbag pasajero',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Airbags y Seguridad',
    peso: 3.0,
    dimensiones: { largo: 50, ancho: 40, alto: 15 },
    viaTransporte: 'Maritimo',
    esDGR: true,
    precioEstimado: 720.00
  },
  {
    codigo: '5711010-B03',
    descripcion: 'Airbag lateral',
    modeloCompatible: ['CS55 Plus', 'CS75 Plus', 'UNI-K'],
    categoria: 'Airbags y Seguridad',
    peso: 1.8,
    dimensiones: { largo: 35, ancho: 25, alto: 10 },
    viaTransporte: 'Maritimo',
    esDGR: true,
    precioEstimado: 480.00
  },
  {
    codigo: '5711010-B04',
    descripcion: 'Airbag de cortina',
    modeloCompatible: ['CS75 Plus', 'UNI-K'],
    categoria: 'Airbags y Seguridad',
    peso: 2.2,
    dimensiones: { largo: 80, ancho: 30, alto: 10 },
    viaTransporte: 'Maritimo',
    esDGR: true,
    precioEstimado: 550.00
  },
  {
    codigo: '5711010-B05',
    descripcion: 'Pretensor de cinturón',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Airbags y Seguridad',
    peso: 0.8,
    dimensiones: { largo: 25, ancho: 10, alto: 10 },
    viaTransporte: 'Maritimo',
    esDGR: true,
    precioEstimado: 180.00
  },

  // MOTOR Y TRANSMISIÓN
  {
    codigo: '1109011-M01',
    descripcion: 'Bomba de agua',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Motor y Transmisión',
    peso: 2.0,
    dimensiones: { largo: 20, ancho: 15, alto: 15 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 120.00
  },
  {
    codigo: '1109011-M02',
    descripcion: 'Termostato',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus'],
    categoria: 'Motor y Transmisión',
    peso: 0.3,
    dimensiones: { largo: 8, ancho: 8, alto: 8 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 35.00
  },
  {
    codigo: '1109011-M03',
    descripcion: 'Radiador',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Motor y Transmisión',
    peso: 4.5,
    dimensiones: { largo: 70, ancho: 50, alto: 10 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 280.00
  },
  {
    codigo: '1109011-M04',
    descripcion: 'Bomba de combustible',
    modeloCompatible: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus'],
    categoria: 'Motor y Transmisión',
    peso: 1.5,
    dimensiones: { largo: 20, ancho: 15, alto: 15 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 180.00
  },

  // TRANSMISIÓN
  {
    codigo: '2301010-T01',
    descripcion: 'Kit de embrague completo',
    modeloCompatible: ['CS35 Plus', 'Alsvin'],
    categoria: 'Transmisión',
    peso: 8.0,
    dimensiones: { largo: 40, ancho: 40, alto: 15 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 350.00
  },
  {
    codigo: '2301010-T02',
    descripcion: 'Cilindro maestro de embrague',
    modeloCompatible: ['CS35 Plus', 'Alsvin'],
    categoria: 'Transmisión',
    peso: 1.2,
    dimensiones: { largo: 25, ancho: 10, alto: 10 },
    viaTransporte: 'Aereo',
    esDGR: false,
    precioEstimado: 95.00
  }
];

/**
 * Sistema de IA para reconocimiento de repuestos
 */
export class IAReconocimientoRepuestos {
  
  /**
   * Busca un repuesto por código exacto
   */
  static buscarPorCodigo(codigo: string): RepuestoChangan | null {
    const codigoUpper = codigo.toUpperCase().trim();
    return BASE_DATOS_REPUESTOS.find(r => r.codigo.toUpperCase() === codigoUpper) || null;
  }

  /**
   * Busca repuestos por descripción (búsqueda fuzzy)
   */
  static buscarPorDescripcion(descripcion: string): RepuestoChangan[] {
    const descLower = descripcion.toLowerCase().trim();
    const palabras = descLower.split(' ').filter(p => p.length > 2);
    
    return BASE_DATOS_REPUESTOS.filter(repuesto => {
      const repuestoDesc = repuesto.descripcion.toLowerCase();
      return palabras.some(palabra => repuestoDesc.includes(palabra));
    }).slice(0, 5); // Retornar top 5 resultados
  }

  /**
   * Busca repuestos por modelo compatible
   */
  static buscarPorModelo(modelo: string): RepuestoChangan[] {
    return BASE_DATOS_REPUESTOS.filter(r => 
      r.modeloCompatible.some(m => m.toLowerCase().includes(modelo.toLowerCase()))
    );
  }

  /**
   * Busca repuestos por categoría
   */
  static buscarPorCategoria(categoria: string): RepuestoChangan[] {
    return BASE_DATOS_REPUESTOS.filter(r => 
      r.categoria.toLowerCase().includes(categoria.toLowerCase())
    );
  }

  /**
   * Calcula el peso volumétrico para clasificación de transporte
   */
  static calcularPesoVolumetrico(dimensiones: { largo: number; ancho: number; alto: number }): number {
    return (dimensiones.largo * dimensiones.ancho * dimensiones.alto) / 5000;
  }

  /**
   * Determina la vía de transporte basada en dimensiones y peso
   */
  static determinarViaTransporte(repuesto: RepuestoChangan): 'Aereo' | 'Maritimo' {
    // Si ya está marcado como DGR, siempre marítimo
    if (repuesto.esDGR) return 'Maritimo';

    // Si es muy grande o pesado, marítimo
    const pesoVol = this.calcularPesoVolumetrico(repuesto.dimensiones);
    if (repuesto.peso > 10 || pesoVol > 20) return 'Maritimo';
    
    // Si alguna dimensión es muy grande, marítimo
    if (repuesto.dimensiones.largo > 100 || 
        repuesto.dimensiones.ancho > 60 || 
        repuesto.dimensiones.alto > 60) return 'Maritimo';

    // Si es vidrio, marítimo por fragilidad
    if (repuesto.categoria.includes('Vidrio')) return 'Maritimo';

    // Por defecto, aéreo para piezas pequeñas y ligeras
    return 'Aereo';
  }

  /**
   * Reconocimiento automático completo de un repuesto
   */
  static reconocerRepuesto(codigoODescripcion: string): {
    encontrado: boolean;
    repuesto?: RepuestoChangan;
    sugerencias?: RepuestoChangan[];
    clasificacion?: {
      viaTransporte: 'Aereo' | 'Maritimo';
      tiempoEstimado: number;
      esDGR: boolean;
      categoria: string;
    };
  } {
    // Primero intentar búsqueda exacta por código
    const porCodigo = this.buscarPorCodigo(codigoODescripcion);
    if (porCodigo) {
      return {
        encontrado: true,
        repuesto: porCodigo,
        clasificacion: {
          viaTransporte: this.determinarViaTransporte(porCodigo),
          tiempoEstimado: this.determinarViaTransporte(porCodigo) === 'Aereo' ? 30 : 90,
          esDGR: porCodigo.esDGR,
          categoria: porCodigo.categoria
        }
      };
    }

    // Si no se encuentra por código, buscar por descripción
    const sugerencias = this.buscarPorDescripcion(codigoODescripcion);
    if (sugerencias.length > 0) {
      return {
        encontrado: false,
        sugerencias,
        clasificacion: {
          viaTransporte: this.determinarViaTransporte(sugerencias[0]),
          tiempoEstimado: this.determinarViaTransporte(sugerencias[0]) === 'Aereo' ? 30 : 90,
          esDGR: sugerencias[0].esDGR,
          categoria: sugerencias[0].categoria
        }
      };
    }

    // Si no se encuentra nada, retornar clasificación genérica
    return {
      encontrado: false,
      clasificacion: {
        viaTransporte: 'Aereo', // Por defecto aéreo
        tiempoEstimado: 30,
        esDGR: false,
        categoria: 'No identificado'
      }
    };
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  static obtenerEstadisticas() {
    const total = BASE_DATOS_REPUESTOS.length;
    const aerios = BASE_DATOS_REPUESTOS.filter(r => this.determinarViaTransporte(r) === 'Aereo').length;
    const maritimos = BASE_DATOS_REPUESTOS.filter(r => this.determinarViaTransporte(r) === 'Maritimo').length;
    const dgr = BASE_DATOS_REPUESTOS.filter(r => r.esDGR).length;
    
    const categorias = [...new Set(BASE_DATOS_REPUESTOS.map(r => r.categoria))];
    const modelos = [...new Set(BASE_DATOS_REPUESTOS.flatMap(r => r.modeloCompatible))];

    return {
      totalRepuestos: total,
      repuestosAereos: aerios,
      repuestosMaritimos: maritimos,
      repuestosDGR: dgr,
      categoriasUnicas: categorias.length,
      modelosCompatibles: modelos.length,
      categorias,
      modelos
    };
  }
}
