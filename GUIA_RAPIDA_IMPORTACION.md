# 📖 GUÍA RÁPIDA: Importación de Datos
## CEDIS Changan Panamá - Beta v04.1

---

## 🎯 ¿Qué cambió?

### Antes (Beta v04)
- ❌ La app se conectaba directamente a Google Sheets
- ❌ Los datos se modificaban automáticamente
- ❌ Riesgo de corrupción de datos
- ❌ Requería configurar Google Apps Script

### Ahora (Beta v04.1)
- ✅ Importas datos manualmente desde Excel
- ✅ Los datos se guardan en tu navegador (localStorage)
- ✅ Solo tú decides cuándo actualizar
- ✅ No requiere configuración compleja
- ✅ Más seguro y rápido

---

## 🚀 Primer Uso (5 minutos)

### **Paso 1: Exportar desde Google Sheets**

1. Abre tu Google Sheet:
   ```
   https://docs.google.com/spreadsheets/d/1YcV3D-d9zk_oqmHrgG4blnC05ElejvYZ7RT47nrJqfM/edit
   ```

2. Haz clic en **Archivo** → **Descargar** → **Microsoft Excel (.xlsx)**

3. Guarda el archivo en tu computadora (ej: `datos_cedis.xlsx`)

### **Paso 2: Importar en la Aplicación**

1. Abre la app web en tu navegador

2. Inicia sesión como **Administrador**:
   - Usuario: `admin`
   - Contraseña: `changan2025`

3. En el menú superior, haz clic en **"Importar Datos"**

4. Verás el panel de importación con estadísticas actuales

5. Haz clic en el área punteada que dice **"Haz clic para seleccionar un archivo"**

6. Selecciona el archivo Excel que descargaste (`datos_cedis.xlsx`)

7. Espera a que se procese (1-3 segundos)

8. Verás un mensaje de éxito con el número de datos importados:
   ```
   ✓ X asesores importados
   ✓ X manifiestos importados
   ✓ X detalles DPL importados
   ✓ X pedidos importados
   ```

### **Paso 3: Verificar que Funciona**

1. Cierra sesión de admin

2. Inicia sesión como **Asesor**:
   - Selecciona tu nombre de la lista
   - Haz clic en "Ingresar"

3. Si ves tu nombre y sucursal, ¡todo funciona correctamente!

4. Intenta crear un pedido de prueba:
   - Haz clic en "Nuevo Pedido"
   - Completa el formulario
   - Transmite el pedido
   - Debería generarse un folio y descargarse un PDF

---

## 🔄 Actualizar Datos (cuando sea necesario)

### **¿Cuándo actualizar?**
- Cuando agregues nuevos asesores en Google Sheets
- Cuando modifiques manifiestos o inventario
- Cuando necesites sincronizar cambios desde Google Sheets

### **Proceso de Actualización**

1. **Haz cambios en Google Sheets**
   - Agrega/edita datos según necesites

2. **Exporta a Excel**
   - Archivo → Descargar → Microsoft Excel (.xlsx)

3. **Importa en la app**
   - Ve a "Importar Datos"
   - Sube el nuevo archivo
   - Los datos anteriores se reemplazan completamente

4. **Verifica**
   - Revisa que los nuevos datos estén disponibles
   - Prueba crear un pedido si es necesario

---

## 📊 ¿Qué datos se importan?

### **1. Asesores**
Desde la hoja `BD_Encargados`:
- Nombre
- Sucursal
- Departamento/Canal
- Cargo
- Teléfono
- Correo

### **2. Manifiestos DPL**
Desde la hoja de manifiestos:
- ID de Contenedor
- Proveedor
- Fecha de Arribo
- PO de Referencia
- Tipo de Transporte
- Total de Piezas
- SKUs Únicos
- Total de Pallets
- Estado (Tránsito/Aduana/Recibido)

### **3. Detalles DPL**
Desde la hoja de detalles:
- ID de Inventario
- Contenedor
- Pallet
- Package
- Código de Repuesto
- Descripción
- Cantidad Total
- Cantidad Asignada
- Cantidad Despachada
- Saldo Disponible
- Ubicación CEDIS

### **4. Pedidos**
Desde la hoja de pedidos:
- ID de Pedido
- Código de Repuesto
- Descripción
- Cantidad Solicitada
- Cantidad Asignada
- Cantidad Despachada
- Estado
- Sucursal
- Colaborador
- Cliente
- Modelo
- VIN

---

## 🛡️ Protección de Datos

### **¿Cómo se protegen mis datos?**

1. **Almacenamiento Local**
   - Los datos se guardan en tu navegador (localStorage)
   - No se envían a servidores externos
   - Solo tú puedes acceder desde tu navegador

2. **Modificaciones Controladas**
   - Los datos solo cambian cuando tú lo decides
   - No hay sincronización automática
   - Cada acción es explícita

3. **Importación Manual**
   - Tú decides cuándo actualizar
   - Tú controlas qué archivo importar
   - No hay cambios sorpresa

4. **Reemplazo Completo**
   - Cada importación reemplaza todos los datos
   - Evita conflictos y duplicaciones
   - Garantiza consistencia

### **¿Qué NO hace el sistema?**

- ❌ No se conecta automáticamente a Google Sheets
- ❌ No modifica Google Sheets
- ❌ No sincroniza en tiempo real
- ❌ No envía datos a servidores externos
- ❌ No comparte datos entre usuarios

---

## 🎨 Reconocimiento Automático de Columnas

El sistema reconoce automáticamente las columnas por su nombre:

### **Ejemplos de Reconocimiento**

| Nombre en Excel | Campo en App | Confianza |
|-----------------|--------------|-----------|
| "Nombre del Encargado" | nombre | 95% |
| "Nombre" | nombre | 90% |
| "Sucursal" | sucursal | 95% |
| "Departamento / Canal" | departamento | 90% |
| "Teléfono / WhatsApp" | telefono | 90% |
| "Correo Electrónico" | correo | 90% |

### **Si una Columna no se Reconoce**

1. El sistema la marca como "desconocido"
2. Los datos de esa columna se ignoran
3. Puedes renombrar la columna en Google Sheets
4. O esperar a que agreguemos más patrones de reconocimiento

### **Nombres Recomendados**

Para mejor reconocimiento, usa estos nombres en Google Sheets:

**Asesores:**
- `Nombre del Encargado` o `Nombre`
- `Sucursal`
- `Departamento / Canal` o `Departamento`
- `Cargo / Rol Operativo` o `Cargo`
- `Teléfono / WhatsApp` o `Teléfono`
- `Correo Electrónico` o `Correo`

**Manifiestos:**
- `Contenedor` o `Invoice`
- `Proveedor`
- `Fecha Arribo`
- `PO Referencia`
- `Tipo Transporte`
- `Total Piezas`
- `SKUs Unicos`
- `Total Pallets`
- `Estado`

**Detalles DPL:**
- `Inventario ID`
- `Contenedor`
- `Pallet Case No` o `Pallet`
- `Package No` o `Package`
- `Codigo Repuesto` o `Codigo`
- `Descripcion`
- `Cantidad Total` o `Cantidad`
- `Cantidad Asignada`
- `Cantidad Despachada`
- `Saldo Disponible`
- `Ubicacion CEDIS`

---

## 🐛 Solución de Problemas

### **Problema: "No hay asesores importados"**

**Causa:** No has importado datos todavía

**Solución:**
1. Ve a "Importar Datos"
2. Sube un archivo Excel con los datos
3. Verifica que se importen correctamente

### **Problema: "Las columnas no se reconocen"**

**Causa:** Los nombres de las columnas no coinciden

**Solución:**
1. Revisa los nombres de las columnas en Google Sheets
2. Usa los nombres recomendados (ver arriba)
3. O espera a que agreguemos más patrones

### **Problema: "Los datos no se guardan"**

**Causa:** localStorage está lleno o deshabilitado

**Solución:**
1. Verifica que tu navegador tenga localStorage habilitado
2. Limpia datos antiguos si es necesario
3. Prueba con otro navegador

### **Problema: "Quiero volver a la sincronización automática"**

**Causa:** Prefieres la versión anterior

**Solución:**
1. Usa la versión Beta v04 (anterior)
2. O espera a una versión futura que combine ambos sistemas

### **Problema: "Perdí mis datos"**

**Causa:** Limpiaste el caché del navegador o cambiaste de dispositivo

**Solución:**
1. Vuelve a importar el archivo Excel
2. Los datos se restaurarán
3. Considera hacer backup regularmente

---

## 💡 Consejos y Mejores Prácticas

### **1. Haz Backup Regularmente**
- Exporta tu Google Sheets semanalmente
- Guarda los archivos Excel en una carpeta segura
- Así puedes restaurar datos si los pierdes

### **2. Usa Nombres Estándar**
- Sigue los nombres recomendados para las columnas
- Facilita el reconocimiento automático
- Evita problemas de importación

### **3. Verifica Después de Importar**
- Revisa las estadísticas de importación
- Asegúrate de que todos los datos se importaron
- Prueba crear un pedido de prueba

### **4. Comunica los Cambios**
- Cuando actualices los datos, avisa a los asesores
- Explica que los datos se actualizaron
- Pide que verifiquen que todo esté correcto

### **5. Mantén Google Sheets Actualizado**
- Google Sheets es tu fuente de verdad
- Mantén los datos actualizados allí
- Importa regularmente para sincronizar

---

## 📞 Soporte

### **Documentación**
- `VERSION_BETA_V04.1.md` - Documentación completa
- `GUIA_RAPIDA_IMPORTACION.md` - Esta guía
- `src/domain/services/importacionDatos.ts` - Código del servicio

### **Contacto**
- **Email:** desarrollo@changanpanama.com
- **Horario:** Lunes a Viernes, 8:00 AM - 6:00 PM

---

## ✅ Checklist Rápido

### **Primer Uso**
- [ ] Exportar Google Sheets a Excel
- [ ] Iniciar sesión como Admin
- [ ] Ir a "Importar Datos"
- [ ] Subir archivo Excel
- [ ] Verificar importación exitosa
- [ ] Probar login de asesor
- [ ] Probar creación de pedido

### **Uso Diario**
- [ ] Los asesores pueden crear pedidos
- [ ] Los pedidos se guardan correctamente
- [ ] No hay sincronización automática
- [ ] Los datos están protegidos

### **Actualización Semanal**
- [ ] Exportar datos actualizados desde Google Sheets
- [ ] Importar nuevo archivo en la app
- [ ] Verificar que los datos se actualizaron
- [ ] Comunicar cambios a los asesores

---

## 🎉 ¡Listo para Usar!

Ahora tienes un sistema seguro y protegido:

✅ **Datos protegidos** contra modificaciones accidentales  
✅ **Importación manual** bajo tu control  
✅ **Sin sincronización automática** que pueda corromper datos  
✅ **Rápido y eficiente** con localStorage  
✅ **Fácil de usar** con reconocimiento automático  

**¡Disfruta tu nuevo sistema Beta v04.1!** 🚀🛡️

---

**Versión:** Beta v04.1  
**Fecha:** 2025  
**Estado:** ✅ Producción Ready
