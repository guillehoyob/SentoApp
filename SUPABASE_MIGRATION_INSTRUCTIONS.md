# Instrucciones para Configurar Supabase - Sento

## PASO 1: Ejecutar la Migración en Supabase

1. **Ve al SQL Editor de Supabase:**
   - Abre tu proyecto en https://supabase.com/dashboard
   - Ve a **SQL Editor** en el menú lateral izquierdo

2. **Copia y ejecuta la migración:**
   - Abre el archivo `supabase/migrations/001_initial_schema.sql`
   - Copia TODO el contenido completo
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **RUN** o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verifica que no haya errores:**
   - Deberías ver el mensaje "Success. No rows returned"
   - Si hay errores, cópialos y compártelos

## PASO 2: Verificar RLS y Políticas

1. **Ejecuta las queries de validación:**
   - Abre el archivo `supabase/migrations/001_validation_queries.sql`
   - Copia cada sección y ejecútala una por una en el SQL Editor

2. **Verifica resultados:**
   - **Tablas:** Deben aparecer 3 tablas (profiles, trips, trip_members)
   - **RLS:** Todas deben mostrar `true` o `YES`
   - **Políticas:** Deben aparecer las políticas creadas
   - **Índices:** Deben aparecer los índices creados
   - **Función:** Debe aparecer la función `create_trip`

## PASO 3: Probar la Función create_trip

1. **Ejecuta esta query de prueba:**
   ```sql
   -- Primero necesitas tener un usuario autenticado
   -- Esto es solo para probar la estructura, no funcionará sin auth
   SELECT create_trip(
       'Viaje de Prueba',
       '2024-12-01',
       '2024-12-10',
       'París',
       'Mi primer viaje de prueba'
   );
   ```

2. **Nota:** Esta función requiere autenticación, así que la probaremos desde la app

## PASO 4: Verificar desde Table Editor

1. **Ve a Table Editor:**
   - En el menú lateral, ve a **Table Editor**
   - Deberías ver las 3 tablas: `profiles`, `trips`, `trip_members`

2. **Verifica la estructura:**
   - Abre cada tabla y verifica que las columnas sean correctas
   - Verifica las relaciones (Foreign Keys)

## PASO 5: Configurar Authentication (si aún no lo has hecho)

1. **Ve a Authentication > Settings:**
   - Habilita el proveedor que quieras usar (Email, Google, etc.)
   - Configura las URLs de redirección si es necesario

2. **Nota:** Las políticas RLS requieren usuarios autenticados para funcionar

## Checklist de Validación

Ejecuta estas verificaciones y marca cada una cuando esté completa:

### ✅ Migraciones ejecutadas sin errores en Supabase
- [ ] Ejecuté `001_initial_schema.sql` en SQL Editor
- [ ] Obtuve el mensaje "Success. No rows returned"
- [ ] No aparecieron errores

### ✅ RLS activo en todas las tablas
- [ ] Ejecuté la query de verificación de RLS
- [ ] Las 3 tablas muestran `rowsecurity = true`
- [ ] Verifiqué en Table Editor que RLS está activo

### ✅ Políticas creadas correctamente
- [ ] Ejecuté la query de verificación de políticas
- [ ] Aparecen políticas para `profiles` (SELECT, INSERT, UPDATE)
- [ ] Aparecen políticas para `trips` (SELECT, INSERT, UPDATE, DELETE)
- [ ] Aparecen políticas para `trip_members` (SELECT, INSERT, UPDATE, DELETE)

### ✅ Índices creados
- [ ] Ejecuté la query de verificación de índices
- [ ] Existe `idx_trip_members_user_id`
- [ ] Existe `idx_trip_members_trip_user`
- [ ] Existe `idx_trips_owner_id`

### ✅ Función create_trip funcional
- [ ] Ejecuté la query de verificación de función
- [ ] La función `create_trip` aparece en los resultados
- [ ] Tipo de retorno es `trips`

### ✅ Consultas de prueba funcionan correctamente
- [ ] Las tablas son visibles en Table Editor
- [ ] Las relaciones (Foreign Keys) están correctas
- [ ] La estructura de columnas es la esperada

## Siguiente Paso

Una vez completadas todas las verificaciones, avísame y:
1. Crearé los tipos TypeScript para las tablas
2. Crearé servicios para interactuar con Supabase desde la app
3. Implementaremos pruebas de inserción y consulta desde la app

