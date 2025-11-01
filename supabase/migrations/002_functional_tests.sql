-- ============================================================================
-- Queries de prueba funcional para validar create_trip y políticas RLS
-- IMPORTANTE: Estas queries requieren autenticación real desde la app
-- Pero podemos verificar la estructura aquí
-- ============================================================================

-- ============================================================================
-- CORRECCIÓN: Query VAL 1 corregida
-- ============================================================================

SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = table_name 
            AND rowsecurity = true
        ) THEN '✅ RLS activo' 
        ELSE '❌ RLS inactivo' 
    END as rls_status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'trips', 'trip_members')
ORDER BY table_name;

-- ============================================================================
-- PRUEBA 1: Verificar estructura de la función create_trip
-- ============================================================================

SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname = 'create_trip';

-- ============================================================================
-- PRUEBA 2: Verificar que podemos insertar datos manualmente (sin RLS)
-- Esta prueba es solo para verificar la estructura, no las políticas
-- ============================================================================

-- NOTA: Para probar las políticas RLS correctamente, necesitas:
-- 1. Usuario autenticado desde la app
-- 2. JWT token válido
-- 3. auth.uid() funcionando

-- Puedes hacer una prueba manual temporal deshabilitando RLS solo para esta sesión:
-- SET session_replication_role = 'replica';  -- Esto desactiva temporalmente los triggers
-- Pero NO lo recomendamos en producción

-- ============================================================================
-- PRUEBA 3: Verificar que las foreign keys funcionan
-- ============================================================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('trips', 'trip_members')
ORDER BY tc.table_name;

-- ============================================================================
-- PRUEBA 4: Verificar constraint de fechas en trips
-- ============================================================================

SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.trips'::regclass
    AND conname LIKE '%date%';

-- ============================================================================
-- NOTA IMPORTANTE PARA PRUEBAS REALES:
-- ============================================================================
-- Para probar create_trip y las políticas RLS correctamente, necesitas:
-- 
-- 1. Autenticación real desde la app con Supabase Auth
-- 2. Usuario registrado y logueado
-- 3. Llamar a create_trip desde la app, no desde SQL directamente
--
-- Las políticas RLS usan auth.uid() que solo funciona con usuarios autenticados
-- reales a través de Supabase Auth.
-- ============================================================================

