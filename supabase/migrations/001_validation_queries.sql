-- ============================================================================
-- Script de validación para verificar que todo funciona correctamente
-- Ejecutar después de aplicar la migración 001_initial_schema.sql
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR QUE LAS TABLAS EXISTEN
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
-- 2. VERIFICAR QUE RLS ESTÁ ACTIVO
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'trips', 'trip_members');

-- ============================================================================
-- 3. VERIFICAR POLÍTICAS CREADAS
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'trips', 'trip_members')
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. VERIFICAR ÍNDICES CREADOS
-- ============================================================================

SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'trips', 'trip_members')
ORDER BY tablename, indexname;

-- ============================================================================
-- 5. VERIFICAR FUNCIÓN create_trip
-- ============================================================================

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'create_trip';

-- ============================================================================
-- NOTA: Las pruebas de inserción/consulta deben hacerse desde la aplicación
-- con un usuario autenticado, ya que las políticas RLS requieren auth.uid()
-- ============================================================================

