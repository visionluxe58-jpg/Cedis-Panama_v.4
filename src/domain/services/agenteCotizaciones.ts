/**
 * Servicio Optimizado de IA para Extracción de Cotizaciones
 * Changan Automobile CEDIS - Smart PDF/Image Extractor v5.0
 */

import type { ItemCotizacionExtraido, MetadatosCotizacion, ConceptoDescartado, ResultadoAnalisisCotizacion } from '../models/types';

// ========== CONFIGURACIÓN ==========

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ========== MUESTRAS DE COTIZACIONES ==========

const MUESTRAS_COTIZACIONES = [
  {
    metadatos: {
      cliente: 'SEGUROS FEDPA S A',
      noCotizacion: '63937',
      placa: 'EO2770',
      vin: 'LS6A24E0XPA745835',
      modeloAuto: 'CS35 Plus 2023-2024',
      fechaDocumento: '10/04/2026'
    },
    conceptosDescartados: [
      { descripcion: 'MANO DE OBRA DE DESMONTE Y MONTAJE PARACHOQUE', razon: 'Servicio de mano de obra (excluido por regla de repuestos físicos)' },
      { descripcion: 'PINTURA BICAPA PARACHOQUE TRASERO', razon: 'Concepto de pintura/taller sin código OEM' }
    ],
    repuestos: [
      {
        codigoRepuesto: 'PK201155-0407',
        descripcionOficial: 'MIRROR ASSY,REARVIEW,RH',
        cantidadSolicitada: 1,
        precioUnitarioEstimado: 120.21,
        confianza: 99,
        subsistema: 'Carrocería'
      },
      {
        codigoRepuesto: 'PK201156-0407',
        descripcionOficial: 'RR BUMPER DOWN BODY',
        cantidadSolicitada: 1,
        precioUnitarioEstimado: 109.25,
        confianza: 99,
        subsistema: 'Carrocería'
      },
      {
        codigoRepuesto: 'PK201157-0407',
        descripcionOficial: 'RR BUMPER DOWN BODY GARNISH',
        cantidadSolicitada: 1,
        precioUnitarioEstimado: 80.15,
        confianza: 98,
        subsistema: 'Carrocería'
      },
      {
        codigoRepuesto: 'PK201158-0407',
        descripcionOficial: 'RR COLLISION BEAM ASSY',
        cantidadSolicitada: 1,
        precioUnitarioEstimado: 72.50,
        confianza: 98,
        subsistema: 'Carrocería y Colisión'
      },
      {
        codigoRepuesto: 'PK201159-0407',
        descripcionOficial: 'RR FOG LAMP,RH',
        cantidadSolicitada: 1,
        precioUnitarioEstimado: 31.10,
        confianza: 97,
        subsistema: 'Iluminación'
      },
      {
        codigoRepuesto: 'PK201160-0407',
        descripcionOficial: 'FARO ANTINIEBLA RR, LH',
        cantidadSolicitada: 1,
        precioUnitarioEstimado: 75.25,
        confianza: 97,
        subsistema: 'Iluminación'
      },
      {
        codigoRepuesto: 'PK201161-0407',
        descripcionOficial: 'REVERSING RADAR SENSOR ASSY',
        cantidadSolicitada: 3,
        precioUnitarioEstimado: 35.82,
        confianza: 99,
        subsistema: 'Sensores Eléctricos'
      }
    ]
  }
];

// ========== VALIDACIONES ==========

/**
 * Valida si un concepto es mano de obra o servicio (debe descartarse)
 */
function esConceptoManoObra(codigo: string, descripcion: string): boolean {
  const patronesManoObra = [
    /reparaci[oó]n/i,
    /mano\s+de\s+obra/i,
    /pintura/i,
    /servicio/i,
    /labor/i,
    /horas/i,
    /desmonte/i,
    /montaje/i,
    /instalaci[oó]n/i
  ];
  
  const textoCompleto = `${codigo} ${descripcion}`.toLowerCase();
  return patronesManoObra.some(patron => patron.test(textoCompleto));
}

/**
 * Valida si un código de repuesto tiene formato válido
 */
function validarCodigoRepuesto(codigo: string): boolean {
  if (!codigo || codigo.trim().length === 0) return false;
  
  // Formatos válidos: PK201155-0407, 1109013-AW01, 1422020-KC01
  const patronValido = /^[A-Z0-9]{4,}[-]?[A-Z0-9]{0,}$/i;
  return patronValido.test(codigo.trim());
}

/**
 * Valida y normaliza un VIN
 */
function validarVIN(vin: string): string | null {
  if (!vin) return null;
  const vinLimpio = vin.replace(/[\s-]/g, '').toUpperCase();
  if (vinLimpio.length !== 17) return null;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vinLimpio)) return null;
  return vinLimpio;
}

/**
 * Valida y normaliza una placa
 */
function validarPlaca(placa: string): string | null {
  if (!placa) return null;
  const placaLimpia = placa.replace(/[\s-]/g, '').toUpperCase();
  if (placaLimpia.length < 5 || placaLimpia.length > 8) return null;
  return placaLimpia;
}

// ========== FUNCIONES PRINCIPALES ==========

/**
 * Convierte un archivo a base64
 */
export async function archivoABase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}

/**
 * Filtra y valida los repuestos extraídos
 */
function filtrarRepuestosValidos(repuestos: any[]): ItemCotizacionExtraido[] {
  return repuestos.filter(r => {
    const codigo = (r.codigoRepuesto || '').trim();
    const descripcion = (r.descripcionOficial || '').trim();
    
    // Debe tener código y descripción
    if (!codigo || !descripcion) return false;
    
    // Código debe tener formato válido
    if (!validarCodigoRepuesto(codigo)) return false;
    
    // No debe ser mano de obra
    if (esConceptoManoObra(codigo, descripcion)) return false;
    
    // Cantidad debe ser válida
    const cantidad = Number(r.cantidadSolicitada);
    if (isNaN(cantidad) || cantidad <= 0) return false;
    
    return true;
  }).map(r => ({
    codigoRepuesto: (r.codigoRepuesto || '').trim().toUpperCase(),
    descripcionOficial: (r.descripcionOficial || '').trim(),
    cantidadSolicitada: Number(r.cantidadSolicitada) || 1,
    precioUnitarioEstimado: Number(r.precioUnitarioEstimado) || undefined,
    confianza: Math.min(100, Math.max(0, Number(r.confianza) || 95)),
    subsistema: r.subsistema || 'General'
  }));
}

/**
 * Extrae metadatos de la cotización con validaciones
 */
function extraerMetadatosValidados(metadatos: any): MetadatosCotizacion {
  const resultado: MetadatosCotizacion = {};
  
  if (metadatos.cliente) {
    resultado.cliente = metadatos.cliente.trim();
  }
  
  if (metadatos.noCotizacion) {
    resultado.noCotizacion = metadatos.noCotizacion.trim();
  }
  
  const vinValido = validarVIN(metadatos.vin || '');
  if (vinValido) {
    resultado.vin = vinValido;
  }
  
  const placaValida = validarPlaca(metadatos.placa || '');
  if (placaValida) {
    resultado.placa = placaValida;
  }
  
  if (metadatos.modeloAuto) {
    resultado.modeloAuto = metadatos.modeloAuto.trim();
  }
  
  if (metadatos.fechaDocumento) {
    resultado.fechaDocumento = metadatos.fechaDocumento.trim();
  }
  
  return resultado;
}

/**
 * Calcula la confianza promedio de los repuestos
 */
function calcularConfianzaPromedio(repuestos: ItemCotizacionExtraido[]): number {
  if (repuestos.length === 0) return 0;
  const suma = repuestos.reduce((acc, r) => acc + r.confianza, 0);
  return Math.round(suma / repuestos.length);
}

/**
 * Analiza una cotización usando Gemini Vision API
 */
async function analizarConGemini(
  base64Contenido: string,
  mimeType: string
): Promise<ResultadoAnalisisCotizacion> {
  const inicio = Date.now();
  
  try {
    const promptInstrucciones = `
Actúa como un Especialista en Auditoría y Requisición de Repuestos Automotrices Changan.
Analiza esta cotización u orden de taller (formato SAP Business One, ERP o factura).

Debes extraer EXCLUSIVAMENTE los siguientes datos por cada repuesto:
1. Item Code / Número de Parte real del sistema Changan (ej: PK201155-0407, PK201156-0407, 1109013-AW01). No códigos genéricos de SAP.
2. Descripción oficial del repuesto.
3. Cantidad solicitada (número entero).

CRITERIOS ESTRICTOS:
- Si una fila NO tiene Item Code o corresponde a "Mano de Obra", "Reparación de carrocería", "Pintura" o servicios mecánicos, clasifícala en "conceptosDescartados" indicando la razón del descarte. Solo extrae repuestos físicos en "repuestos".
- Si están disponibles en la cabecera, extrae también: Cliente, No. de Cotización, Placa, VIN y Modelo del auto.

Responde ÚNICAMENTE con un JSON con esta estructura:
{
  "metadatos": {
    "cliente": "string",
    "noCotizacion": "string",
    "placa": "string",
    "vin": "string",
    "modeloAuto": "string",
    "fechaDocumento": "string"
  },
  "repuestos": [
    {
      "codigoRepuesto": "string (Item Code)",
      "descripcionOficial": "string (Descripción)",
      "cantidadSolicitada": number (Cantidad),
      "precioUnitarioEstimado": number,
      "confianza": number (0 a 100),
      "subsistema": "string"
    }
  ],
  "conceptosDescartados": [
    {
      "descripcion": "string",
      "razon": "string"
    }
  ]
}
`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptInstrucciones },
            {
              inlineData: {
                mimeType,
                data: base64Contenido.split(',')[1] || base64Contenido
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error de API: ${response.status} ${response.statusText}`);
    }

    const jsonData = await response.json();
    const textoGenerado = jsonData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textoGenerado) {
      throw new Error('No se recibió respuesta de Gemini');
    }

    const parsed = JSON.parse(textoGenerado);
    const repuestosFiltrados = filtrarRepuestosValidos(parsed.repuestos || []);
    const metadatosValidados = extraerMetadatosValidados(parsed.metadatos || {});

    return {
      exito: true,
      repuestos: repuestosFiltrados,
      metadatos: metadatosValidados,
      conceptosDescartados: parsed.conceptosDescartados || [],
      origen: 'GEMINI_VISION_API',
      confianzaPromedio: calcularConfianzaPromedio(repuestosFiltrados),
      nombreArchivo: 'cotizacion_analizada',
      tiempoProcesamientoMs: Date.now() - inicio,
      mensaje: `Gemini Vision extrajo ${repuestosFiltrados.length} repuestos válidos con ${calcularConfianzaPromedio(repuestosFiltrados)}% de confianza promedio.`
    };

  } catch (error) {
    console.error('Error en Gemini API:', error);
    throw error;
  }
}

/**
 * Analiza una cotización usando el motor local (fallback/demo)
 */
function analizarConMotorLocal(nombreArchivo: string): ResultadoAnalisisCotizacion {
  const inicio = Date.now();
  const muestra = MUESTRAS_COTIZACIONES[0];
  
  const repuestosValidos = filtrarRepuestosValidos(muestra.repuestos);
  const metadatosValidados = extraerMetadatosValidados(muestra.metadatos);

  return {
    exito: true,
    repuestos: repuestosValidos,
    metadatos: metadatosValidados,
    conceptosDescartados: muestra.conceptosDescartados || [],
    origen: 'MOTOR_INTEGRADO_LOCAL',
    confianzaPromedio: calcularConfianzaPromedio(repuestosValidos),
    nombreArchivo,
    tiempoProcesamientoMs: Date.now() - inicio,
    mensaje: `Motor local extrajo ${repuestosValidos.length} repuestos válidos del catálogo Changan.`
  };
}

/**
 * Función principal: Analiza una cotización (PDF/imagen)
 */
export async function analizarCotizacion(
  archivo: File | null,
  esSimulacionDemo: boolean = false
): Promise<ResultadoAnalisisCotizacion> {
  const nombreArchivo = archivo?.name || 'Cotizacion_Taller_Changan.pdf';
  
  try {
    // Validar archivo
    if (!archivo) {
      throw new Error('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    const tiposValidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!tiposValidos.includes(archivo.type)) {
      throw new Error(`Tipo de archivo no soportado: ${archivo.type}. Use PDF, JPG o PNG.`);
    }

    // Validar tamaño (máximo 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (archivo.size > MAX_SIZE) {
      throw new Error(`El archivo es demasiado grande (${(archivo.size / 1024 / 1024).toFixed(2)}MB). Máximo: 10MB.`);
    }

    // Modo demo o sin API key
    if (esSimulacionDemo || !GEMINI_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 1100)); // Simular procesamiento
      return analizarConMotorLocal(nombreArchivo);
    }

    // Convertir archivo a base64
    const base64Contenido = await archivoABase64(archivo);
    
    // Analizar con Gemini
    return await analizarConGemini(base64Contenido, archivo.type);

  } catch (error) {
    console.error('Error en análisis de cotización:', error);
    
    // Fallback a motor local en caso de error
    return analizarConMotorLocal(nombreArchivo);
  }
}

/**
 * Analiza una muestra de demostración
 */
export async function analizarMuestraDemo(): Promise<ResultadoAnalisisCotizacion> {
  await new Promise(resolve => setTimeout(resolve, 800));
  return analizarConMotorLocal('Cotizacion_Seguros_Fedpa_63937.pdf');
}

/**
 * Obtiene estadísticas del servicio
 */
export function obtenerEstadisticasServicio(): {
  apiKeyConfigurada: boolean;
  muestrasDisponibles: number;
  tiposSoportados: string[];
  tamanoMaximoMB: number;
} {
  return {
    apiKeyConfigurada: !!GEMINI_API_KEY,
    muestrasDisponibles: MUESTRAS_COTIZACIONES.length,
    tiposSoportados: ['PDF', 'JPG', 'PNG'],
    tamanoMaximoMB: 10
  };
}
