# Módulo de Gestión de Contenedores DPL

## Descripción General

El módulo de Gestión DPL (Disposición de Pedidos Logísticos) permite administrar el ciclo de vida completo de los contenedores marítimos, desde su creación hasta la recepción física en CEDIS y la asignación automática de inventario a pedidos mediante el algoritmo FIFO.

## Arquitectura

### Componentes Principales

1. **CruceDPL.tsx** - Componente principal de gestión de contenedores
2. **gestionDPL.ts** - Servicio de dominio con lógica de negocio
3. **types.ts** - Tipos TypeScript para contenedores y detalles DPL

### Flujo de Datos

```
Usuario → CruceDPL Component → gestionDPL Service → localStorage
                ↓
        ModalRastreadorUniversal
```

## Ciclo de Vida del Contenedor

### 1. EN TRÁNSITO (Altamar)
- **Estado inicial** al crear un nuevo contenedor
- **Regla operativa**: NO asigna repuestos a pedidos
- **Visibilidad**: Visible en Rastreador Universal para consultas de fechas de arribo
- **Acciones permitidas**:
  - Consultar información del contenedor
  - Rastrear repuestos individuales
  - Cambiar estado a ADUANA

### 2. EN ADUANA (Puerto)
- **Estado intermedio** durante proceso de nacionalización
- **Regla operativa**: NO asigna repuestos a pedidos
- **Visibilidad**: Rastreo activo, visible en Rastreador Universal
- **Acciones permitidas**:
  - Consultar información del contenedor
  - Rastrear repuestos individuales
  - Cambiar estado a RECIBIDO (solo Administrador)
  - Revertir a EN TRÁNSITO

### 3. RECIBIDO (Bodega CEDIS)
- **Estado final** después de recepción física
- **Regla operativa**: ASIGNACIÓN AUTOMÁTICA FIFO a pedidos pendientes
- **Permiso exclusivo**: Solo Administrador de CEDIS puede autorizar recepción
- **Acciones permitidas**:
  - Ver inventario asignado y disponible
  - Rastrear repuestos individuales
  - Revertir a EN TRÁNSITO (libera asignaciones)

## Funcionalidades Principales

### 1. Gestión de Contenedores

#### Crear Contenedor
```typescript
const nuevoContenedor = crearContenedor(
  'CONT-2024-001',
  'Changan China Parts',
  '2024-01-15',
  'PO-2024-001',
  'Marítimo 40HQ',
  'Admin',
  'BL-2024-001'
);
```

#### Cambiar Estado
```typescript
const contenedoresActualizados = actualizarEstadoContenedor(
  contenedores,
  'CONT-2024-001',
  'RECIBIDO'
);
```

#### Eliminar Contenedor
```typescript
const { contenedores, detalles } = eliminarContenedor(
  contenedores,
  detalles,
  'CONT-2024-001'
);
```

### 2. Gestión de Detalles DPL

#### Agregar Detalles a Contenedor
```typescript
const nuevosDetalles: DetalleDPL[] = [
  {
    uid: 'DET-001',
    contenedor: 'CONT-2024-001',
    pallet: 'P001',
    codigoCompra: '1422020-KC01',
    descripcion: 'Filtro de aceite motor',
    cantidadTotal: 100,
    cantidadAsignada: 0,
    saldoDisponible: 100,
    ubicacionCedis: 'CEDIS-A1-R1'
  }
];

const resultado = agregarDetallesAContenedor(
  contenedores,
  detalles,
  'CONT-2024-001',
  nuevosDetalles
);
```

#### Actualizar Asignación
```typescript
const detallesActualizados = actualizarAsignacionDetalle(
  detalles,
  'DET-001',
  50 // cantidad asignada
);
```

### 3. Búsqueda y Filtrado

#### Buscar Contenedores
```typescript
const resultados = buscarContenedores(contenedores, 'CONT-2024');
```

#### Filtrar por Estado
```typescript
const enTransito = filtrarContenedoresPorEstado(contenedores, 'EN TRÁNSITO');
```

#### Buscar Detalles DPL
```typescript
const repuestos = buscarDetallesDPL(detalles, 'filtro');
```

### 4. Estadísticas

#### Estadísticas de Contenedores
```typescript
const estadisticas = obtenerEstadisticasContenedores(contenedores);
// {
//   total: 5,
//   enTransito: 2,
//   enAduana: 1,
//   recibidos: 2,
//   totalPiezas: 1500,
//   totalSKUs: 45
// }
```

#### Estadísticas de Detalles
```typescript
const estadisticas = obtenerEstadisticasDetalles(detalles);
// {
//   totalRepuestos: 50,
//   totalUnidades: 1500,
//   unidadesAsignadas: 800,
//   unidadesDisponibles: 700,
//   porcentajeAsignacion: 53.33
// }
```

## Integración con Matching FIFO

Cuando un contenedor cambia a estado **RECIBIDO**, el sistema:

1. **Valida permisos**: Solo Administrador puede autorizar recepción
2. **Confirma acción**: Muestra diálogo de confirmación
3. **Actualiza estado**: Cambia estado del contenedor a RECIBIDO
4. **Dispara Matching FIFO**: Asigna automáticamente inventario a pedidos pendientes según prioridad:
   - VOR (Vehicle Off Road) - Prioridad 1
   - Garantía - Prioridad 2
   - Chapistería y Colisión - Prioridad 3
   - Taller Mecánico - Prioridad 4
   - Stock Regular - Prioridad 5

## Persistencia de Datos

### localStorage Keys

- `cedis_contenedores_dpl` - Lista de contenedores
- `cedis_detalles_dpl` - Lista de detalles DPL

### Sincronización

Los datos se sincronizan automáticamente con localStorage cuando:
- Se crea un nuevo contenedor
- Se cambia el estado de un contenedor
- Se agregan detalles a un contenedor
- Se actualiza la asignación de inventario

## Interfaz de Usuario

### Vista Principal

La interfaz se divide en dos columnas:

#### Columna Izquierda: Lista de Contenedores
- **Barra de búsqueda**: Filtrar por contenedor, proveedor o PO
- **Pestañas de estado**: Todos, En Tránsito, En Aduana, Recibido
- **Tarjetas de contenedor**: Información resumida con acciones rápidas
- **Estadísticas**: Contadores por estado

#### Columna Derecha: Detalle del Contenedor
- **Información del contenedor**: Datos completos del manifiesto
- **Selector de estado**: Cambiar estado del embarque
- **Tabla de repuestos**: Lista detallada con búsqueda
- **Acciones rápidas**: Rastrear, eliminar, recibir

### Estados Visuales

#### EN TRÁNSITO
- Color: Azul (sky)
- Icono: 🚢
- Badge: "En Altamar • 0 Asignados"

#### EN ADUANA
- Color: Ámbar (amber)
- Icono: 🛃
- Badge: "En Aduana • 0 Asignados"

#### RECIBIDO
- Color: Verde (emerald)
- Icono: 🏢
- Badge: "Asig: X | Libre: Y"

## Reglas de Negocio

### 1. Asignación de Inventario

- **Solo contenedores RECIBIDOS** pueden asignar inventario
- **Asignación FIFO**: Primeras entradas, primeras salidas
- **Validación de stock**: No se puede asignar más de lo disponible
- **Actualización automática**: Saldo disponible se recalcula en cada asignación

### 2. Permisos

- **Administrador CEDIS**: Puede cambiar estado a RECIBIDO
- **Asesores**: Solo pueden consultar y rastrear
- **Validación estricta**: Sistema verifica rol antes de autorizar recepción

### 3. Integridad de Datos

- **Contenedores únicos**: No se permiten duplicados
- **Detalles vinculados**: Cada detalle debe pertenecer a un contenedor existente
- **Eliminación en cascada**: Al eliminar contenedor, se eliminan sus detalles
- **Consistencia de totales**: Totales se recalculan automáticamente

## Ejemplos de Uso

### Ejemplo 1: Crear y Recibir Contenedor

```typescript
// 1. Crear contenedor en estado EN TRÁNSITO
const contenedor = crearContenedor(
  'CONT-2024-004',
  'Changan China Parts',
  '2024-02-01',
  'PO-2024-004',
  'Marítimo 40HQ',
  'Admin'
);

// 2. Agregar detalles DPL
const detalles = [
  {
    uid: 'DET-010',
    contenedor: 'CONT-2024-004',
    pallet: 'P001',
    codigoCompra: '4811010-B01',
    descripcion: 'Bumper delantero',
    cantidadTotal: 20,
    cantidadAsignada: 0,
    saldoDisponible: 20
  }
];

const resultado = agregarDetallesAContenedor(
  [contenedor],
  [],
  'CONT-2024-004',
  detalles
);

// 3. Cambiar estado a RECIBIDO (solo Admin)
const contenedoresActualizados = actualizarEstadoContenedor(
  resultado.contenedores,
  'CONT-2024-004',
  'RECIBIDO'
);

// 4. Matching FIFO se ejecuta automáticamente
// Los pedidos pendientes reciben asignación automática
```

### Ejemplo 2: Buscar y Filtrar

```typescript
// Buscar contenedores por proveedor
const contenedoresChangan = buscarContenedores(contenedores, 'Changan');

// Filtrar contenedores en aduana
const enAduana = filtrarContenedoresPorEstado(contenedores, 'ADUANA');

// Buscar repuestos por código
const filtros = buscarDetallesDPL(detalles, '1422020');

// Obtener estadísticas
const stats = obtenerEstadisticasContenedores(contenedores);
console.log(`Total: ${stats.total}, Recibidos: ${stats.recibidos}`);
```

## Mejoras Futuras

### Corto Plazo
- [ ] Importación masiva desde Excel
- [ ] Exportación de reportes en PDF
- [ ] Notificaciones de cambios de estado
- [ ] Historial de movimientos de contenedores

### Mediano Plazo
- [ ] Integración con API de navieras para tracking en tiempo real
- [ ] Predicción de fechas de arribo basada en datos históricos
- [ ] Optimización automática de rutas de almacenamiento
- [ ] Dashboard de métricas de eficiencia operativa

### Largo Plazo
- [ ] Integración con sistemas ERP externos
- [ ] Automatización completa del proceso de recepción
- [ ] Machine learning para predicción de demanda
- [ ] Blockchain para trazabilidad de contenedores

## Troubleshooting

### Problema: Contenedor no aparece en la lista
**Solución**: Verificar que los datos estén guardados en localStorage con la key `cedis_contenedores_dpl`

### Problema: No se puede cambiar estado a RECIBIDO
**Solución**: Verificar que el usuario tenga rol `ADMINISTRADOR_CEDIS`

### Problema: Asignación FIFO no se ejecuta
**Solución**: Verificar que el contenedor esté en estado RECIBIDO y que existan pedidos pendientes

### Problema: Datos no se persisten
**Solución**: Verificar que el navegador tenga habilitado localStorage y no esté en modo incógnito

## Documentación Relacionada

- [Matching FIFO](./MATCHING_FIFO.md) - Algoritmo de asignación automática
- [Rastreador Universal](./RASTREADOR_UNIVERSAL.md) - Búsqueda global de repuestos
- [Gestión de Pedidos](./GESTION_PEDIDOS.md) - Ciclo de vida de pedidos

---

**Versión**: 1.0  
**Última actualización**: 2025  
**Estado**: ✅ Implementado y funcional
