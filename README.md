# Sento - App de Gestión de Grupos y Viajes

React Native + Expo + Supabase + TypeScript

---

## 🚀 Quick Start

```bash
npm install
npm start
```

---

## 📋 Setup desde Cero

### 1. Supabase (Dashboard → SQL Editor)

Ejecuta **en orden**:

```bash
001_initial_schema.sql       # Tablas base (profiles, trips, trip_members)
004_adapt_trips_to_groups.sql # Convierte a groups + type
008_fix_rls_production.sql   # Políticas RLS finales
```

### 2. Variables de entorno

Crea `.env`:
```
SUPABASE_URL=tu_url
SUPABASE_ANON_KEY=tu_key
```

### 3. Run

```bash
npm start
```

---

## ✅ Estado Actual

**Completado:**
- Autenticación (email/password)
- Crear grupos/viajes (con tipo y caducidad)
- Listar, ver, editar, eliminar
- RLS seguro sin recursión

**Siguiente:**
- Fase 6: Sistema de invitaciones (JWT + deep links)

**Progreso:** 80% MVP base

---

## 📁 Estructura

```
/app                 # Pantallas (Expo Router)
/src
  /components        # UI reutilizable
  /services          # Supabase + lógica
  /hooks             # useAuth, useGroups
  /types             # TypeScript
/supabase/migrations # SQL
```

---

## 🔑 Conceptos Clave

**Grupos vs Viajes:**
- `type='group'` → Sin fecha fin (permanente)
- `type='trip'` → Con fecha fin (caduca)

**RLS:** Usuarios solo ven sus grupos (owner) + lógica de miembros en código.

---

Ver `sento_phased_plan (1).md` para plan completo.
