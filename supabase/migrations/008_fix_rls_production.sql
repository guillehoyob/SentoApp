-- ============================================================================
-- Migración: Políticas RLS finales para producción (sin recursión)
-- Archivo: 008_fix_rls_production.sql
-- Descripción: Políticas seguras que NO causan recursión infinita
-- ============================================================================

BEGIN;

-- ============================================================================
-- RE-HABILITAR RLS (por si estaba deshabilitado)
-- ============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================================================

-- Políticas de groups
DROP POLICY IF EXISTS "Owners can delete groups" ON groups;
DROP POLICY IF EXISTS "Owners can update groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Group members can view group" ON groups;

-- Políticas de group_members
DROP POLICY IF EXISTS "Group owners can add members" ON group_members;
DROP POLICY IF EXISTS "Group owners can update members" ON group_members;
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Owner can remove or user can leave" ON group_members;
DROP POLICY IF EXISTS "Owners can add members" ON group_members;
DROP POLICY IF EXISTS "Owners can update members" ON group_members;
DROP POLICY IF EXISTS "Owners can remove members or users can leave" ON group_members;
DROP POLICY IF EXISTS "Trip members can view members" ON group_members;

-- ============================================================================
-- POLÍTICAS PARA groups (SIN RECURSIÓN)
-- ============================================================================

-- SELECT: Ver grupos donde eres owner (directo, sin subquery a group_members)
CREATE POLICY "view_own_groups"
    ON groups FOR SELECT
    USING (owner_id = auth.uid());

-- INSERT: Crear grupos (solo si eres tú el owner)
CREATE POLICY "create_own_groups"
    ON groups FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- UPDATE: Solo el owner puede actualizar
CREATE POLICY "update_own_groups"
    ON groups FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- DELETE: Solo el owner puede eliminar
CREATE POLICY "delete_own_groups"
    ON groups FOR DELETE
    USING (owner_id = auth.uid());

-- ============================================================================
-- POLÍTICAS PARA group_members (SIN RECURSIÓN)
-- ============================================================================

-- SELECT: Ver miembros si eres el usuario o si eres owner del grupo
CREATE POLICY "view_group_members"
    ON group_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT id FROM groups WHERE owner_id = auth.uid()
        )
    );

-- INSERT: Solo el owner del grupo puede añadir miembros
-- Verificamos directamente en groups sin activar políticas recursivas
CREATE POLICY "add_group_members"
    ON group_members FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT id FROM groups WHERE owner_id = auth.uid()
        )
    );

-- UPDATE: Solo el owner del grupo puede actualizar roles
CREATE POLICY "update_group_members"
    ON group_members FOR UPDATE
    USING (
        group_id IN (
            SELECT id FROM groups WHERE owner_id = auth.uid()
        )
    );

-- DELETE: Owner del grupo puede eliminar O el usuario puede salirse
CREATE POLICY "remove_group_members"
    ON group_members FOR DELETE
    USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT id FROM groups WHERE owner_id = auth.uid()
        )
    );

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "view_own_groups" ON groups IS 
    'Usuarios ven solo grupos donde son owners. Los grupos donde son miembros se filtran en el código de la app.';

COMMENT ON POLICY "view_group_members" ON group_members IS 
    'Usuarios ven miembros de grupos donde son owner o son ellos mismos.';

COMMIT;

