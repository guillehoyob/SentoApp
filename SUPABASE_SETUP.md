# Instrucciones para Integración con Supabase

## Qué Necesitas Preparar

### 1. Crear/Crear Acceso a Proyecto Supabase

1. Ve a https://supabase.com
2. Inicia sesión o crea una cuenta
3. Crea un nuevo proyecto (o selecciona uno existente)
4. Espera a que el proyecto se inicialice completamente

### 2. Obtener Credenciales

Una vez que tu proyecto esté listo:

1. Ve a **Settings** (Configuración) → **API**
2. Encontrarás:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Una clave larga que empieza con `eyJ...`

### 3. Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` y agrega tus credenciales:
   ```
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu_clave_anonima_aqui
   ```

### 4. Crear una Tabla de Prueba (Opcional pero Recomendado)

Para probar la conexión, crea una tabla simple:

1. Ve a **SQL Editor** en Supabase
2. Ejecuta esta query:
   ```sql
   CREATE TABLE test_table (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

3. Inserta un dato de prueba:
   ```sql
   INSERT INTO test_table (name) VALUES ('Test desde React Native');
   ```

## Qué Haré Yo

Una vez que tengas las credenciales:

1. Instalar `@supabase/supabase-js`
2. Crear `/src/services/supabase.ts` - Cliente de Supabase
3. Crear `/src/constants/config.ts` - Configuración con variables de entorno
4. Configurar `expo-constants` para leer variables de entorno
5. Crear un hook o servicio para probar la conexión
6. Actualizar la pantalla principal para mostrar el estado de la conexión

## Cómo Verificar que Funciona

### Verificación Básica

1. **Verificar variables de entorno cargadas**:
   - La app mostrará si las variables están configuradas
   - No debería haber errores de variables faltantes

2. **Probar conexión a Supabase**:
   - La app intentará conectarse a Supabase al iniciar
   - Mostrará un mensaje de "Conectado" o "Error de conexión"

3. **Probar lectura de datos**:
   - Intentará leer datos de la tabla de prueba
   - Mostrará los datos en la pantalla o un mensaje de éxito

4. **Probar escritura de datos**:
   - Intentará insertar un nuevo registro
   - Mostrará confirmación de éxito

### Verificación Avanzada

1. **Revisar logs en Supabase Dashboard**:
   - Ve a **Logs** → **API Logs**
   - Deberías ver las peticiones desde tu app

2. **Verificar datos en la base de datos**:
   - Ve a **Table Editor**
   - Verifica que los datos se insertaron correctamente

3. **Revisar errores en la consola**:
   - Si hay errores, aparecerán en la terminal de Expo
   - También en la consola de React Native Debugger

## Pasos Siguientes Después de la Integración

1. Configurar autenticación (si es necesario)
2. Crear tipos TypeScript para tus tablas
3. Crear servicios específicos para cada entidad
4. Implementar Real-time subscriptions (si es necesario)
5. Configurar políticas de seguridad (RLS)

