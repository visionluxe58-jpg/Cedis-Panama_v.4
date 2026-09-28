# CEDIS Changan Panamá - Sistema de Pedidos Especiales

Sistema completo de gestión de pedidos especiales para CEDIS Changan Panamá con inteligencia artificial integrada.

## 🚀 Características

### Para Asesores
- ✅ Creación de pedidos con folio automático
- ✅ Clasificación logística automática (Aéreo/Marítimo)
- ✅ Reconocimiento de repuestos con IA (40+ repuestos en base de datos)
- ✅ Extracción inteligente de cotizaciones desde PDF/imágenes
- ✅ Generación automática de PDF de confirmación
- ✅ Interfaz optimizada para móviles

### Para Administradores
- ✅ Panel de administración completo
- ✅ KPIs logísticos internacionales (8 indicadores)
- ✅ Motor de conciliación FIFO
- ✅ Gestión de contenedores DPL (3 estados: Tránsito, Aduana, Recibido)
- ✅ Rastreador universal de repuestos
- ✅ Estadísticas en tiempo real

## 🛠️ Tecnologías

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **PDF Generation:** jsPDF + jspdf-autotable
- **Charts:** Recharts
- **Icons:** Lucide React + Font Awesome
- **AI Integration:** Gemini API (opcional)

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Verificar tipos TypeScript
npm run typecheck
```

## 🌐 Despliegue en Vercel

### Configuración Automática

El proyecto ya incluye `vercel.json` con la configuración necesaria:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Pasos para Desplegar

1. **Subir el código a GitHub/GitLab/Bitbucket**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <tu-repositorio>
   git push -u origin main
   ```

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Selecciona tu repositorio
   - Vercel detectará automáticamente que es un proyecto Vite

3. **Configurar Variables de Entorno (Opcional)**
   
   Si quieres usar Gemini API para extracción de cotizaciones:
   ```
   VITE_GEMINI_API_KEY=tu_api_key_aqui
   ```

4. **Desplegar**
   - Haz clic en "Deploy"
   - Espera a que termine el build
   - Tu app estará disponible en `https://tu-proyecto.vercel.app`

### Solución de Problemas

#### Error 404 - Página no encontrada

Si ves un error 404 después del despliegue:

1. **Verifica que `vercel.json` esté en la raíz del proyecto**
2. **Verifica que `index.html` esté en la raíz**
3. **Verifica que el script en `index.html` apunte a `/src/main.tsx`**
4. **Revisa los logs de build en Vercel**

#### Error de Build

Si el build falla:

```bash
# Prueba el build localmente
npm run build

# Verifica que no haya errores de TypeScript
npm run typecheck

# Revisa los logs de error
```

## 📱 Uso

### Login de Asesor

1. Abre la aplicación
2. Selecciona tu nombre de la lista
3. Haz clic en "Ingresar al Sistema"
4. Crea un nuevo pedido o extrae datos de una cotización

### Login de Administrador

1. Haz clic en "Acceso Administrador"
2. Ingresa las credenciales:
   - **Usuario:** `admin`
   - **Contraseña:** `changan2025`
3. Accede al panel de administración completo

## 🎯 Funcionalidades Principales

### 1. Creación de Pedidos

- Folio automático (ej: PED-VL-101)
- Datos del cliente (nombre, VIN, placa, modelo)
- Líneas de repuestos con clasificación automática
- Tiempos de entrega estimados (30 días aéreo, 90 días marítimo)

### 2. Extracción de Cotizaciones con IA

- Sube PDF o imagen de cotización
- IA extrae automáticamente:
  - Datos del cliente
  - Lista de repuestos
  - Cantidades y precios
- Revisa y ajusta antes de confirmar

### 3. Gestión de Contenedores DPL

- **EN TRÁNSITO** (🚢): Contenedor en altamar
- **EN ADUANA** (🛃): Contenedor en proceso de nacionalización
- **RECIBIDO** (🏢): Contenedor en bodega CEDIS
- Asignación FIFO automática al cambiar a RECIBIDO

### 4. KPIs Logísticos

- Fill Rate (Tasa de llenado)
- OTIF (On-Time In-Full)
- Quiebre de Stock
- Tiempo de Ciclo
- Exactitud de Inventario
- Exactitud de Picking
- Efectividad de Cruce DPL
- Pedido Perfecto

### 5. Rastreador Universal

- Búsqueda global de repuestos
- Filtros por estado (Todos, DPL, Pedidos)
- Resumen cuantitativo
- Vista de inventario y pedidos

## 📂 Estructura del Proyecto

```
src/
├── App.tsx                          # Router principal
├── main.tsx                         # Punto de entrada
├── index.css                        # Estilos globales
│
├── domain/                          # Capa de dominio
│   ├── models/
│   │   └── types.ts                 # Tipos TypeScript
│   └── services/
│       ├── index.ts                 # Servicios principales
│       ├── agenteCotizaciones.ts    # IA para cotizaciones
│       ├── gestionDPL.ts            # Gestión de contenedores
│       └── iaReconocimientoRepuestos.ts  # IA para repuestos
│
├── data/                            # Capa de datos
│   └── api/
│       └── client.ts                # Cliente API
│
├── infrastructure/                  # Capa de infraestructura
│   └── pdf/
│       └── pdfGenerator.ts          # Generador de PDFs
│
├── presentation/                    # Capa de presentación
│   └── components/
│       ├── AdminDashboard.tsx       # Panel de administración
│       ├── Auth.tsx                 # Login y autenticación
│       ├── CruceDPL.tsx             # Gestión de contenedores
│       ├── DashboardAsesor.tsx      # Dashboard de asesores
│       ├── ExtractorCotizacionesIA.tsx
│       ├── ModalRastreadorUniversal.tsx
│       └── SmartSAPPdfExtractorModal.tsx
│
└── styles/
    └── mobile.css                   # Optimización móvil
```

## 🔧 Configuración

### Modo Demo vs Producción

El sistema funciona en **modo demo** por defecto (sin backend real). Para conectar con Google Apps Script:

1. Edita `src/data/api/client.ts`
2. Cambia `DEMO_MODE = true` a `DEMO_MODE = false`
3. Configura la URL del Web App en el panel de administración

### Gemini API (Opcional)

Para habilitar extracción de cotizaciones con IA:

1. Obtén una API key de [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea un archivo `.env` en la raíz:
   ```
   VITE_GEMINI_API_KEY=tu_api_key_aqui
   ```
3. Redeploya la aplicación

## 📊 Métricas

- **Build time:** ~10s
- **Bundle size:** ~727 kB (gzip: ~221 kB)
- **Módulos:** 1618
- **Componentes:** 7 principales
- **Servicios:** 4 de dominio
- **Interfaces:** 25+ tipos TypeScript

## 🐛 Troubleshooting

### La app no carga después del deploy

1. Verifica que `vercel.json` esté en la raíz
2. Verifica que `index.html` esté en la raíz
3. Revisa los logs de build en Vercel
4. Asegúrate de que el script en `index.html` apunte a `/src/main.tsx`

### Error de TypeScript

```bash
# Verifica los tipos
npm run typecheck

# Si hay errores, corrígelos antes de hacer commit
```

### Build falla

```bash
# Prueba el build localmente
npm run build

# Revisa los errores en la consola
```

## 📝 Documentación Adicional

- `TEST_COMPLETO_SISTEMA.md` - Test exhaustivo del sistema
- `GUIA_OPTIMIZACION_MOVIL.md` - Guía de optimización móvil
- `MODULO_GESTION_DPL.md` - Documentación de gestión DPL
- `MODULO_RASTREADOR_UNIVERSAL.md` - Documentación del rastreador

## 🤝 Soporte

Para problemas o preguntas:
1. Revisa la documentación en los archivos `.md`
2. Verifica los logs de build en Vercel
3. Prueba el build localmente con `npm run build`

## 📄 Licencia

Este proyecto es propiedad de CEDIS Changan Panamá.

---

**Versión:** 2.0  
**Última actualización:** 2025  
**Estado:** ✅ Producción Ready
