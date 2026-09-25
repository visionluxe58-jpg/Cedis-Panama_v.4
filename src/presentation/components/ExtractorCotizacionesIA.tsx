/**
 * Componente de Extracción de Cotizaciones con IA
 * Permite a los asesores cargar PDFs/imágenes de cotizaciones y extraer datos automáticamente
 */

import { useState, useRef } from 'react';
import type { ResultadoAnalisisCotizacion, ItemCotizacionExtraido, MetadatosCotizacion } from '../../domain/models/types';
import { analizarCotizacion, analizarMuestraDemo, obtenerEstadisticasServicio } from '../../domain/services/agenteCotizaciones';

interface Props {
  onDatosExtraidos?: (metadatos: MetadatosCotizacion, repuestos: ItemCotizacionExtraido[]) => void;
}

export function ExtractorCotizacionesIA({ onDatosExtraidos }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnalisisCotizacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const estadisticas = obtenerEstadisticasServicio();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivo(file);
      setResultado(null);
      setError(null);
    }
  };

  const handleAnalizar = async () => {
    if (!archivo) {
      setError('Por favor selecciona un archivo primero');
      return;
    }

    setProcesando(true);
    setError(null);
    setResultado(null);

    try {
      const result = await analizarCotizacion(archivo, !estadisticas.apiKeyConfigurada);
      setResultado(result);
      
      if (onDatosExtraidos && result.exito && result.metadatos) {
        onDatosExtraidos(result.metadatos, result.repuestos);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al analizar la cotización');
    } finally {
      setProcesando(false);
    }
  };

  const handleDemo = async () => {
    setProcesando(true);
    setError(null);
    setResultado(null);

    try {
      const result = await analizarMuestraDemo();
      setResultado(result);
      
      if (onDatosExtraidos && result.exito && result.metadatos) {
        onDatosExtraidos(result.metadatos, result.repuestos);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la demostración');
    } finally {
      setProcesando(false);
    }
  };

  const handleLimpiar = () => {
    setArchivo(null);
    setResultado(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con información del servicio */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-robot text-white text-lg"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-purple-900 mb-1">
              Extracción Inteligente de Cotizaciones
            </h3>
            <p className="text-sm text-purple-700 mb-2">
              Sube una cotización en PDF o imagen y la IA extraerá automáticamente los datos del cliente y los repuestos.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white px-2 py-1 rounded border border-purple-200">
                <i className="fas fa-check text-green-600 mr-1"></i>
                {estadisticas.tiposSoportados.join(', ')}
              </span>
              <span className="bg-white px-2 py-1 rounded border border-purple-200">
                <i className="fas fa-hdd text-blue-600 mr-1"></i>
                Máx: {estadisticas.tamanoMaximoMB}MB
              </span>
              <span className={`px-2 py-1 rounded border ${estadisticas.apiKeyConfigurada ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                <i className={`fas ${estadisticas.apiKeyConfigurada ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i>
                {estadisticas.apiKeyConfigurada ? 'Gemini API Activa' : 'Modo Demo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Área de carga de archivo */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <i className="fas fa-cloud-upload-alt text-purple-600 text-2xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {archivo ? archivo.name : 'Haz clic para seleccionar un archivo'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG o PNG (máximo {estadisticas.tamanoMaximoMB}MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={handleAnalizar}
          disabled={!archivo || procesando}
          className="flex-1 btn-primary text-white px-4 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {procesando ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Analizando...
            </>
          ) : (
            <>
              <i className="fas fa-magic mr-2"></i>
              Analizar con IA
            </>
          )}
        </button>
        
        <button
          onClick={handleDemo}
          disabled={procesando}
          className="px-4 py-3 border border-purple-300 text-purple-700 rounded-xl font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-play-circle mr-2"></i>
          Ver Demo
        </button>

        {archivo && (
          <button
            onClick={handleLimpiar}
            disabled={procesando}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <i className="fas fa-times mr-2"></i>
            Limpiar
          </button>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <i className="fas fa-exclamation-circle text-red-600 mt-0.5"></i>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Resultados del análisis */}
      {resultado && resultado.exito && (
        <div className="space-y-4 fade-in">
          {/* Resumen */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check-circle text-white text-lg"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-green-900 mb-1">
                  Análisis Completado Exitosamente
                </h4>
                <p className="text-sm text-green-700">{resultado.mensaje}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  <span className="bg-white px-2 py-1 rounded border border-green-200">
                    <i className="fas fa-clock text-blue-600 mr-1"></i>
                    {resultado.tiempoProcesamientoMs}ms
                  </span>
                  <span className="bg-white px-2 py-1 rounded border border-green-200">
                    <i className="fas fa-bullseye text-purple-600 mr-1"></i>
                    {resultado.confianzaPromedio}% confianza
                  </span>
                  <span className="bg-white px-2 py-1 rounded border border-green-200">
                    <i className="fas fa-microchip text-orange-600 mr-1"></i>
                    {resultado.origen === 'GEMINI_VISION_API' ? 'Gemini API' : 'Motor Local'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadatos extraídos */}
          {resultado.metadatos && Object.keys(resultado.metadatos).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i className="fas fa-id-card text-blue-600"></i>
                Datos del Cliente Extraídos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {resultado.metadatos.cliente && (
                  <div>
                    <span className="text-gray-500 text-xs">Cliente:</span>
                    <p className="font-medium text-gray-900">{resultado.metadatos.cliente}</p>
                  </div>
                )}
                {resultado.metadatos.noCotizacion && (
                  <div>
                    <span className="text-gray-500 text-xs">No. Cotización:</span>
                    <p className="font-mono font-medium text-gray-900">{resultado.metadatos.noCotizacion}</p>
                  </div>
                )}
                {resultado.metadatos.placa && (
                  <div>
                    <span className="text-gray-500 text-xs">Placa:</span>
                    <p className="font-mono font-medium text-gray-900">{resultado.metadatos.placa}</p>
                  </div>
                )}
                {resultado.metadatos.vin && (
                  <div>
                    <span className="text-gray-500 text-xs">VIN:</span>
                    <p className="font-mono text-xs text-gray-900">{resultado.metadatos.vin}</p>
                  </div>
                )}
                {resultado.metadatos.modeloAuto && (
                  <div>
                    <span className="text-gray-500 text-xs">Modelo:</span>
                    <p className="font-medium text-gray-900">{resultado.metadatos.modeloAuto}</p>
                  </div>
                )}
                {resultado.metadatos.fechaDocumento && (
                  <div>
                    <span className="text-gray-500 text-xs">Fecha:</span>
                    <p className="font-medium text-gray-900">{resultado.metadatos.fechaDocumento}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Repuestos extraídos */}
          {resultado.repuestos.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i className="fas fa-boxes text-purple-600"></i>
                Repuestos Extraídos ({resultado.repuestos.length})
              </h4>
              <div className="space-y-2">
                {resultado.repuestos.map((repuesto, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            {repuesto.codigoRepuesto}
                          </span>
                          <span className="text-xs text-gray-500">
                            Cant: <strong>{repuesto.cantidadSolicitada}</strong>
                          </span>
                          {repuesto.confianza && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              repuesto.confianza >= 95 ? 'bg-green-100 text-green-700' :
                              repuesto.confianza >= 85 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {repuesto.confianza}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900">{repuesto.descripcionOficial}</p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                          {repuesto.subsistema && (
                            <span>
                              <i className="fas fa-tag mr-1"></i>
                              {repuesto.subsistema}
                            </span>
                          )}
                          {repuesto.precioUnitarioEstimado && (
                            <span>
                              <i className="fas fa-dollar-sign mr-1"></i>
                              ${repuesto.precioUnitarioEstimado.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conceptos descartados */}
          {resultado.conceptosDescartados && resultado.conceptosDescartados.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-yellow-900 mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-yellow-600"></i>
                Conceptos Descartados ({resultado.conceptosDescartados.length})
              </h4>
              <div className="space-y-2">
                {resultado.conceptosDescartados.map((concepto, idx) => (
                  <div key={idx} className="bg-white border border-yellow-200 rounded-lg p-2">
                    <p className="text-sm text-gray-900">{concepto.descripcion}</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      <i className="fas fa-info-circle mr-1"></i>
                      {concepto.razon}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
