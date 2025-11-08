# Instrucciones para completar la gestión de grupos

## ✅ Lo que ya está hecho

- Migración SQL creada (`004_adapt_trips_to_groups.sql`)
- Tipos TypeScript creados
- Servicios y hooks implementados
- Validaciones y lógica de caducidad implementada

## 📋 Pasos que debes completar en Supabase

### PASO 1: Ejecutar la migración SQL

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **SQL Editor**
3. Abre el archivo `supabase/migrations/004_adapt_trips_to_groups.sql`
4. Copia todo el contenido del archivo
5. Pégalo en el SQL Editor de Supabase
6. Haz clic en **Run** o presiona `Ctrl+Enter`
7. Verifica que no haya errores

**⚠️ IMPORTANTE:** Esta migración:
- Renombra `trips` → `groups`
- Renombra `trip_members` → `group_members`
- Añade columna `type` ('trip' | 'group')
- Hace `end_date` opcional (solo requerido para 'trip')
- Actualiza todas las políticas RLS
- Crea función `create_group` (reemplaza `create_trip`)

### PASO 2: Verificar que la migración funcionó

Ejecuta estas consultas en SQL Editor para verificar:

```sql
-- Verificar que la tabla groups existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'groups';

-- Verificar estructura de groups
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

-- Verificar que la función create_group existe
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'create_group';
```

### PASO 3: Probar crear un grupo (opcional)

Puedes probar crear un grupo desde SQL Editor:

```sql
-- Crear grupo tipo 'trip' (requiere end_date)
SELECT create_group(
  'Mi Viaje a París',
  'trip',
  '2025-12-01',
  '2025-12-10',
  'París, Francia',
  'Viaje de vacaciones'
);

-- Crear grupo tipo 'group' (sin end_date)
SELECT create_group(
  'Grupo de Amigos',
  'group',
  '2025-01-01',
  NULL,
  NULL,
  'Grupo permanente'
);
```

## ✅ Checklist de validación

Después de ejecutar la migración, valida:

- [ ] Tabla `groups` existe con columna `type`
- [ ] Tabla `group_members` existe
- [ ] Columna `end_date` puede ser NULL
- [ ] Función `create_group` existe y funciona
- [ ] Políticas RLS están actualizadas
- [ ] Puedes crear grupo tipo 'trip' con end_date
- [ ] Puedes crear grupo tipo 'group' sin end_date

## 🚨 Si hay errores

Si encuentras errores al ejecutar la migración:

1. **Error de tabla existente**: Si `trips` no existe, la migración creará `groups` desde cero
2. **Error de políticas**: Las políticas antiguas se eliminan automáticamente
3. **Error de foreign keys**: Verifica que no haya datos huérfanos en `trip_members`

## 📝 Notas importantes

- Los datos existentes en `trips` se migrarán automáticamente a `groups`
- Todos los `trips` existentes se convertirán en `type='trip'` con su `end_date` original
- Las relaciones con `trip_members` se migrarán a `group_members`
- La función `create_trip` será eliminada y reemplazada por `create_group`

---

**Cuando termines, avísame y validaremos que todo funciona correctamente desde la app.**

