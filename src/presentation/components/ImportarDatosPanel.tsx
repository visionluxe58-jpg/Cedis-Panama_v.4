/**
 * Componente de Importación de Datos desde Google Sheets
 * Versión Beta v04.1 - Protección de Datos
 */

import { useState, useRef } from 'react';
import { 
  importarDatosDesdeArchivo, 
  obtenerAsesores, 
  obtenerManifiestos, 
  obtenerDetallesDPL, 
  obtenerPedidos,
  obtenerUltimaImportacion,
  eliminarTodosLosDatos,
  type ResultadoImportacion
} from '../../domain/services/importacionDatos';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';

export function ImportarDatosPanel() {
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mostrarConfirmacionReset, setMostrarConfirmacionReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener estadísticas actuales
  const estadisticas = {
    asesores: obtenerAsesores().length,
    manifiestos: obtenerManifiestos().length,
    detallesDPL: obtenerDetallesDPL().length,
    pedidos: obtenerPedidos().length,
    ultimaImportacion: obtenerUltimaImportacion()
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcesando(true);
    setResultado(null);

    try {
      const resultadoImportacion = await importarDatosDesdeArchivo(file);
      setResultado(resultadoImportacion);
    } catch (error) {
      setResultado({
        exito: false,
        mensaje: 'Error al procesar el archivo',
        datosImportados: {},
        errores: [error instanceof Error ? error.message : 'Error desconocido']
      });
    } finally {
      setProcesando(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = () => {
    eliminarTodosLosDatos();
    setResultado({
      exito: true,
      mensaje: 'Todos los datos han sido eliminados',
      datosImportados: {}
    });
    setMostrarConfirmacionReset(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Gestión de Base de Datos Local</h2>
            <p className="text-blue-100 text-sm">
              Importa datos desde Google Sheets para trabajar con una copia local protegida.
              Los datos solo se modifican cuando tú lo indiques explícitamente.
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas Actuales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Estado Actual de la Base de Datos
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{estadisticas.asesores}</div>
            <div className="text-sm text-blue-800 font-medium">Asesores</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-3xl font-bold text-purple-600">{estadisticas.manifiestos}</div>
            <div className="text-sm text-purple-800 font-medium">Manifiestos</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-3xl font-bold text-green-600">{estadisticas.detallesDPL}</div>
            <div className="text-sm text-green-800 font-medium">Detalles DPL</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-3xl font-bold text-orange-600">{estadisticas.pedidos}</div>
            <div className="text-sm text-orange-800 font-medium">Pedidos</div>
          </div>
        </div>

        {estadisticas.ultimaImportacion && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Última importación:</span>{' '}
              {new Date(estadisticas.ultimaImportacion).toLocaleString('es-PA')}
            </div>
          </div>
        )}
      </div>

      {/* Área de Importación */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Importar Datos desde Google Sheets
        </h3>

        <div className="space-y-4">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instrucciones:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Abre tu Google Sheet con los datos</li>
              <li>Ve a <strong>Archivo → Descargar → Microsoft Excel (.xlsx)</strong></li>
              <li>Sube el archivo aquí</li>
              <li>El sistema reconocerá automáticamente las columnas</li>
              <li>Los datos se guardarán en tu navegador (localStorage)</li>
            </ol>
          </div>

          {/* Input de archivo */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">
              {procesando ? 'Procesando archivo...' : 'Haz clic para seleccionar un archivo'}
            </p>
            <p className="text-gray-500 text-sm">
              Formatos soportados: Excel (.xlsx, .xls) o CSV
            </p>
          </div>

          {/* Resultado de importación */}
          {resultado && (
            <div className={`rounded-xl p-4 border ${
              resultado.exito 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {resultado.exito ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    resultado.exito ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {resultado.mensaje}
                  </p>
                  
                  {resultado.exito && Object.keys(resultado.datosImportados).length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      {resultado.datosImportados.asesores !== undefined && (
                        <div className="text-green-800">
                          ✓ {resultado.datosImportados.asesores} asesores importados
                        </div>
                      )}
                      {resultado.datosImportados.manifiestos !== undefined && (
                        <div className="text-green-800">
                          ✓ {resultado.datosImportados.manifiestos} manifiestos importados
                        </div>
                      )}
                      {resultado.datosImportados.detallesDPL !== undefined && (
                        <div className="text-green-800">
                          ✓ {resultado.datosImportados.detallesDPL} detalles DPL importados
                        </div>
                      )}
                      {resultado.datosImportados.pedidos !== undefined && (
                        <div className="text-green-800">
                          ✓ {resultado.datosImportados.pedidos} pedidos importados
                        </div>
                      )}
                    </div>
                  )}

                  {resultado.errores && resultado.errores.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {resultado.errores.map((error, idx) => (
                        <p key={idx} className="text-red-700 text-sm">
                          • {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zona de Peligro */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          Zona de Peligro
        </h3>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">
            <strong>Advertencia:</strong> Esta acción eliminará todos los datos importados de tu navegador.
            No se puede deshacer. Asegúrate de tener una copia de seguridad antes de continuar.
          </p>
        </div>

        {!mostrarConfirmacionReset ? (
          <button
            onClick={() => setMostrarConfirmacionReset(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Todos los Datos
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium transition-colors"
            >
              Sí, eliminar todo
            </button>
            <button
              onClick={() => setMostrarConfirmacionReset(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Información Adicional */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-gray-600" />
          ¿Cómo funciona la protección de datos?
        </h3>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Importación manual:</strong> Los datos solo se cargan cuando tú subes un archivo.
              No hay sincronización automática con Google Sheets.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Almacenamiento local:</strong> Los datos se guardan en tu navegador (localStorage).
              No se envían a ningún servidor externo.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Modificaciones controladas:</strong> Los datos solo se modifican cuando tú realizas
              acciones explícitas (crear pedido, cambiar estado, etc.).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Reeemplazo completo:</strong> Cada vez que importas un archivo, se reemplazan todos
              los datos anteriores. Esto evita conflictos y duplicaciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
