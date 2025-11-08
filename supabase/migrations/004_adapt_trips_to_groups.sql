-- ============================================================================
-- Migración: Adaptar trips a groups con type y end_date opcional
-- Archivo: 004_adapt_trips_to_groups.sql
-- Descripción: Renombra trips a groups, añade type y hace end_date opcional
-- ============================================================================

BEGIN;

-- Renombrar tabla trips a groups
ALTER TABLE IF EXISTS trips RENAME TO groups;

-- Renombrar tabla trip_members a group_members
ALTER TABLE IF EXISTS trip_members RENAME TO group_members;

-- Añadir columna type a groups (trip o group)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'trip' CHECK (type IN ('trip', 'group'));

-- Hacer end_date opcional (solo requerido si type='trip')
-- Primero eliminamos la constraint de NOT NULL
ALTER TABLE groups ALTER COLUMN end_date DROP NOT NULL;

-- Actualizar constraint de fecha para permitir NULL cuando type='group'
ALTER TABLE groups DROP CONSTRAINT IF EXISTS trips_date_check;
ALTER TABLE groups ADD CONSTRAINT groups_date_check CHECK (
    (type = 'group' AND end_date IS NULL) OR
    (type = 'trip' AND end_date IS NOT NULL AND end_date >= start_date)
);

-- Renombrar índices
ALTER INDEX IF EXISTS idx_trips_owner_id RENAME TO idx_groups_owner_id;
ALTER INDEX IF EXISTS idx_trip_members_user_id RENAME TO idx_group_members_user_id;
ALTER INDEX IF EXISTS idx_trip_members_trip_user RENAME TO idx_group_members_group_user;

-- Actualizar foreign keys en group_members
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS trip_members_trip_id_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS trip_members_user_id_fkey;

ALTER TABLE group_members 
    ADD CONSTRAINT group_members_group_id_fkey 
    FOREIGN KEY (trip_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE group_members 
    ADD CONSTRAINT group_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Renombrar columna trip_id a group_id en group_members
ALTER TABLE group_members RENAME COLUMN trip_id TO group_id;

-- Actualizar políticas RLS para usar el nuevo nombre de tabla
DROP POLICY IF EXISTS "Trip members can view trip" ON groups;
DROP POLICY IF EXISTS "Users can create trips" ON groups;
DROP POLICY IF EXISTS "Owners can update trips" ON groups;
DROP POLICY IF EXISTS "Owners can delete trips" ON groups;

CREATE POLICY "Group members can view group"
    ON groups FOR SELECT
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create groups"
    ON groups FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update groups"
    ON groups FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete groups"
    ON groups FOR DELETE
    USING (owner_id = auth.uid());

-- Actualizar políticas de group_members
DROP POLICY IF EXISTS "Trip members can view members" ON group_members;
DROP POLICY IF EXISTS "Owners can add members" ON group_members;
DROP POLICY IF EXISTS "Owners can update members" ON group_members;
DROP POLICY IF EXISTS "Owners can remove members or users can leave" ON group_members;

CREATE POLICY "Group members can view members"
    ON group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_members.group_id
            AND (
                groups.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM group_members gm
                    WHERE gm.group_id = group_members.group_id
                    AND gm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Owners can add members"
    ON group_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_members.group_id
            AND groups.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update members"
    ON group_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_members.group_id
            AND groups.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can remove members or users can leave"
    ON group_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_members.group_id
            AND (
                groups.owner_id = auth.uid() OR
                group_members.user_id = auth.uid()
            )
        )
    );

-- Crear función RPC create_group (reemplaza create_trip)
CREATE OR REPLACE FUNCTION create_group(
    p_name TEXT,
    p_type TEXT,
    p_start_date DATE,
    p_end_date DATE DEFAULT NULL,
    p_destination TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS groups
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_group_id UUID;
    v_group groups;
BEGIN
    -- Validar que el usuario esté autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Validar type
    IF p_type NOT IN ('trip', 'group') THEN
        RAISE EXCEPTION 'Type must be either trip or group';
    END IF;

    -- Validar end_date según type
    IF p_type = 'trip' AND p_end_date IS NULL THEN
        RAISE EXCEPTION 'End date is required for trip type';
    END IF;

    IF p_type = 'group' AND p_end_date IS NOT NULL THEN
        RAISE EXCEPTION 'End date should be NULL for group type';
    END IF;

    -- Validar fechas si es trip
    IF p_type = 'trip' AND p_end_date < p_start_date THEN
        RAISE EXCEPTION 'End date must be after start date';
    END IF;

    -- Crear el grupo
    INSERT INTO groups (
        owner_id,
        name,
        type,
        start_date,
        end_date,
        destination,
        notes
    )
    VALUES (
        auth.uid(),
        p_name,
        p_type,
        p_start_date,
        p_end_date,
        p_destination,
        p_notes
    )
    RETURNING id INTO v_group_id;

    -- Añadir al creador como owner en group_members
    INSERT INTO group_members (
        group_id,
        user_id,
        role
    )
    VALUES (
        v_group_id,
        auth.uid(),
        'owner'
    );

    -- Retornar el grupo creado
    SELECT * INTO v_group FROM groups WHERE id = v_group_id;
    RETURN v_group;
END;
$$;

COMMENT ON FUNCTION create_group IS 'Crea un grupo (trip o group) y añade automáticamente al creador como owner';

-- Eliminar función antigua create_trip
DROP FUNCTION IF EXISTS create_trip(TEXT, DATE, DATE, TEXT, TEXT);

-- Actualizar comentarios
COMMENT ON TABLE groups IS 'Grupos creados por los usuarios (pueden ser trips o groups)';
COMMENT ON COLUMN groups.type IS 'Tipo de grupo: trip (con fecha fin) o group (sin fecha fin)';
COMMENT ON COLUMN groups.end_date IS 'Fecha de fin (obligatoria para trips, NULL para groups)';

COMMIT;

