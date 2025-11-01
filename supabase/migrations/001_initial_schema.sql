-- ============================================================================
-- Migración inicial del esquema de base de datos para Sento
-- Archivo: 001_initial_schema.sql
-- Descripción: Crea las tablas principales, RLS, políticas e índices
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLA: profiles
-- Descripción: Perfiles de usuario de la aplicación
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    language TEXT DEFAULT 'es',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE profiles IS 'Perfiles de usuario de la aplicación Sento';
COMMENT ON COLUMN profiles.id IS 'Identificador único del perfil';
COMMENT ON COLUMN profiles.email IS 'Email del usuario (único)';
COMMENT ON COLUMN profiles.full_name IS 'Nombre completo del usuario';
COMMENT ON COLUMN profiles.language IS 'Idioma preferido del usuario';

-- ============================================================================
-- TABLA: trips
-- Descripción: Viajes creados por los usuarios
-- ============================================================================

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    destination TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT trips_date_check CHECK (end_date >= start_date)
);

COMMENT ON TABLE trips IS 'Viajes creados por los usuarios';
COMMENT ON COLUMN trips.owner_id IS 'Usuario creador del viaje';
COMMENT ON COLUMN trips.start_date IS 'Fecha de inicio del viaje';
COMMENT ON COLUMN trips.end_date IS 'Fecha de fin del viaje';
COMMENT ON COLUMN trips.destination IS 'Destino del viaje';

-- ============================================================================
-- TABLA: trip_members
-- Descripción: Miembros de cada viaje (relación muchos a muchos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trip_members (
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (trip_id, user_id)
);

COMMENT ON TABLE trip_members IS 'Relación entre viajes y miembros';
COMMENT ON COLUMN trip_members.role IS 'Rol del miembro: owner, member, etc.';
COMMENT ON COLUMN trip_members.joined_at IS 'Fecha en que el usuario se unió al viaje';

-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS: profiles
-- Descripción: Usuarios solo pueden ver y editar su propio perfil
-- ============================================================================

-- Política para seleccionar: usuarios solo ven su propio perfil
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Política para insertar: usuarios pueden crear su propio perfil
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Política para actualizar: usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- POLÍTICAS RLS: trips
-- Descripción: Solo los miembros del viaje pueden verlo
-- ============================================================================

-- Política para seleccionar: solo miembros del viaje pueden verlo
CREATE POLICY "Trip members can view trip"
    ON trips FOR SELECT
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM trip_members
            WHERE trip_members.trip_id = trips.id
            AND trip_members.user_id = auth.uid()
        )
    );

-- Política para insertar: usuarios pueden crear viajes
CREATE POLICY "Users can create trips"
    ON trips FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Política para actualizar: solo el owner puede actualizar
CREATE POLICY "Owners can update trips"
    ON trips FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Política para eliminar: solo el owner puede eliminar
CREATE POLICY "Owners can delete trips"
    ON trips FOR DELETE
    USING (owner_id = auth.uid());

-- ============================================================================
-- POLÍTICAS RLS: trip_members
-- Descripción: Solo miembros del viaje pueden ver los miembros
-- ============================================================================

-- Política para seleccionar: miembros del viaje pueden ver otros miembros
CREATE POLICY "Trip members can view members"
    ON trip_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_members.trip_id
            AND (
                trips.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM trip_members tm
                    WHERE tm.trip_id = trip_members.trip_id
                    AND tm.user_id = auth.uid()
                )
            )
        )
    );

-- Política para insertar: owner puede añadir miembros
CREATE POLICY "Owners can add members"
    ON trip_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_members.trip_id
            AND trips.owner_id = auth.uid()
        )
    );

-- Política para actualizar: solo owner puede actualizar roles
CREATE POLICY "Owners can update members"
    ON trip_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_members.trip_id
            AND trips.owner_id = auth.uid()
        )
    );

-- Política para eliminar: owner puede eliminar miembros, o el usuario puede salirse
CREATE POLICY "Owners can remove members or users can leave"
    ON trip_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_members.trip_id
            AND (
                trips.owner_id = auth.uid() OR
                trip_members.user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- ÍNDICES
-- Descripción: Optimización de consultas frecuentes
-- ============================================================================

-- Índice para buscar miembros por usuario
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id 
    ON trip_members(user_id);

-- Índice compuesto para buscar miembros de un viaje específico
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_user 
    ON trip_members(trip_id, user_id);

-- Índice para buscar viajes por owner
CREATE INDEX IF NOT EXISTS idx_trips_owner_id 
    ON trips(owner_id);

-- ============================================================================
-- FUNCIÓN RPC: create_trip
-- Descripción: Crea un viaje y añade automáticamente al creador como owner
-- ============================================================================

CREATE OR REPLACE FUNCTION create_trip(
    p_name TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_destination TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS trips
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trip_id UUID;
    v_trip trips;
BEGIN
    -- Validar que el usuario esté autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Validar fechas
    IF p_end_date < p_start_date THEN
        RAISE EXCEPTION 'End date must be after start date';
    END IF;

    -- Crear el viaje
    INSERT INTO trips (
        owner_id,
        name,
        start_date,
        end_date,
        destination,
        notes
    )
    VALUES (
        auth.uid(),
        p_name,
        p_start_date,
        p_end_date,
        p_destination,
        p_notes
    )
    RETURNING id INTO v_trip_id;

    -- Añadir al creador como owner en trip_members
    INSERT INTO trip_members (
        trip_id,
        user_id,
        role
    )
    VALUES (
        v_trip_id,
        auth.uid(),
        'owner'
    );

    -- Retornar el viaje creado
    SELECT * INTO v_trip FROM trips WHERE id = v_trip_id;
    RETURN v_trip;
END;
$$;

COMMENT ON FUNCTION create_trip IS 'Crea un viaje y añade automáticamente al creador como owner';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

COMMIT;

