# Plan de Desarrollo por Fases - Sento App
### Estrategia: De Base a Funcionalidad Incremental

---

## **FASE 0: Setup Inicial del Proyecto**
**Duración estimada: 1-2 horas**

### Objetivos
- Configurar proyecto React Native + Expo
- Instalar dependencias core
- Configurar estructura base de carpetas
- Setup Supabase inicial

### Prompt para Cursor AI

```
Crea un nuevo proyecto React Native con Expo SDK 50+ usando TypeScript con la siguiente configuración:

DEPENDENCIAS CORE:
- expo
- react-native
- @supabase/supabase-js
- @react-native-async-storage/async-storage (para storage compatible con Expo Go)
- expo-router (navegación file-based)

ESTRUCTURA DE CARPETAS:
/app - Rutas con Expo Router
/src
  /components - Componentes reutilizables
  /services - Lógica de negocio (supabase, storage)
  /types - Definiciones TypeScript
  /utils - Helpers y utilidades
  /constants - Constantes y configuración
/assets - Imágenes y recursos

CONFIGURACIÓN:
1. app.json con:
   - Scheme: "sento"
   - Nombre: "Sento"
   - orientación: portrait
2. tsconfig.json estricto
3. .env.example con variables: SUPABASE_URL, SUPABASE_ANON_KEY
4. README.md con instrucciones de setup

IMPORTANTE: Usar AsyncStorage en lugar de MMKV para compatibilidad con Expo Go

ENTREGABLES:
- Proyecto funcional que compile sin errores
- Script de desarrollo configurado
- Git inicializado con .gitignore apropiado
```

### Checklist de validación
- [ ] `npx expo start` funciona correctamente
- [ ] TypeScript compila sin errores
- [ ] Estructura de carpetas creada
- [ ] Variables de entorno configuradas

---

## **FASE 1: Configuración Supabase Backend**
**Duración estimada: 2-3 horas**

### Objetivos
- Crear proyecto en Supabase
- Implementar esquema de base de datos inicial
- Configurar RLS básico
- Setup de Auth

### Prompt para Cursor AI

```
Configura el backend de Supabase para la app Sento:

TAREAS:
1. Crear migraciones SQL en /supabase/migrations/ con este esquema:

TABLAS (en este orden):
- profiles (id uuid PK, email text, full_name text, language text, created_at timestamp)
- groups (id uuid PK, owner_id uuid FK→profiles, name text, type text ('trip' | 'group'), start_date date, end_date date (nullable), destination text (nullable), notes text, created_at timestamp)
- group_members (group_id uuid FK→groups, user_id uuid FK→profiles, role text, joined_at timestamp, PK(group_id, user_id))

NOTA: El tipo 'trip' tiene end_date obligatorio y sirve como fecha de caducidad para acceso a datos personales. 
El tipo 'group' no tiene end_date (null) y no caduca.

2. Para cada tabla:
   - Habilitar RLS: ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;
   - Crear políticas básicas:
     * profiles: usuarios solo ven su perfil
     * groups: solo visibles para miembros
     * group_members: solo visible para miembros del grupo

3. Crear índices:
   - group_members(user_id)
   - group_members(group_id, user_id)

4. Crear función RPC create_group:
   - Recibe: name, type ('trip' | 'group'), start_date, end_date?, destination?, notes?
   - Valida: si type='trip', end_date es obligatorio
   - Crea group + añade creator como owner en group_members
   - Retorna el group creado

FORMATO:
- Archivo: 001_initial_schema.sql
- Comentarios explicativos en cada sección
- Transacciones para rollback en caso de error

NO IMPLEMENTAR AÚN: documents, share_links, audit_log (eso vendrá después)
```

### Checklist de validación
- [ ] Migraciones ejecutadas sin errores en Supabase
- [ ] RLS activo en todas las tablas
- [ ] Función `create_group` funcional
- [ ] Validación de type y end_date correcta
- [ ] Consultas de prueba funcionan correctamente

---

## **FASE 2: Servicio de Autenticación Client-Side**
**Duración estimada: 2-3 horas**

### Objetivos
- Crear servicio de Supabase client
- Implementar hooks de autenticación
- Gestión de sesión

### Prompt para Cursor AI

```
Crea el servicio de autenticación para Sento:

ARCHIVOS A CREAR:

1. /src/services/supabase.ts
   - Cliente Supabase configurado con variables de entorno
   - Exportar cliente singleton

2. /src/services/auth.service.ts
   - signUp(email, password): Promise<User>
   - signIn(email, password): Promise<User>
   - signOut(): Promise<void>
   - getCurrentUser(): Promise<User | null>
   - Validaciones: email RFC 5322, password min 8 chars + 1 número + 1 letra

3. /src/hooks/useAuth.ts
   - Hook personalizado que expone:
     * user: User | null
     * loading: boolean
     * signIn, signUp, signOut
     * Escucha cambios de sesión (onAuthStateChange)

4. /src/types/auth.types.ts
   - Interfaces: User, AuthError, AuthResponse

REQUISITOS:
- Manejo de errores con mensajes descriptivos
- Loading states apropiados
- Persistencia de sesión automática (Supabase lo maneja)
- TypeScript estricto sin any

TESTING:
- Crear archivo /src/services/__tests__/auth.service.test.ts con casos básicos
```

### Checklist de validación
- [ ] Registro de usuario funcional
- [ ] Login funcional
- [ ] Logout funcional
- [ ] Sesión persiste después de cerrar app
- [ ] Errores manejados correctamente

---

## **FASE 3: Pantallas de Autenticación (UI)**
**Duración estimada: 3-4 horas**

### Objetivos
- Pantalla de bienvenida/splash
- Pantalla de login
- Pantalla de registro
- Navegación básica

### Prompt para Cursor AI

```
Crea las pantallas de autenticación para Sento con Expo Router:

PANTALLAS EN /app:

1. /app/index.tsx (Splash/Bienvenida)
   - Mostrar logo/nombre Sento
   - Botones: "Iniciar Sesión" y "Registrarse"
   - Redirect automático a /home si ya hay sesión

2. /app/auth/sign-in.tsx
   - Form: email, password
   - Botón "Iniciar Sesión"
   - Link "¿No tienes cuenta? Regístrate"
   - Link "¿Olvidaste tu contraseña?" (solo UI, no funcional aún)
   - Usar useAuth hook
   - Validación en tiempo real
   - Loading states

3. /app/auth/sign-up.tsx
   - Form: email, password, confirmar password
   - Checkbox T&C (mock por ahora)
   - Botón "Registrarse"
   - Link "¿Ya tienes cuenta? Inicia sesión"
   - Validaciones: emails coinciden, passwords coinciden, min 8 chars

4. /app/(authenticated)/_layout.tsx
   - Layout protegido que verifica autenticación
   - Redirect a /auth/sign-in si no hay usuario

5. /app/(authenticated)/home.tsx
   - Placeholder simple: "Bienvenido, {user.email}"
   - Botón "Cerrar sesión"

COMPONENTES EN /src/components:
- Button.tsx (reutilizable, con loading state)
- TextInput.tsx (con validación visual)
- ErrorMessage.tsx

ESTILOS:
- Usar Tailwind con NativeWind o StyleSheet nativo
- Diseño limpio, moderno
- Responsive y accesible

NAVEGACIÓN:
- Auth Stack → Authenticated Stack
- No volver atrás desde pantallas autenticadas a auth
```

### Checklist de validación
- [ ] Navegación entre pantallas funciona
- [ ] Formularios validan correctamente
- [ ] Loading states visibles durante operaciones
- [ ] Errores se muestran al usuario
- [ ] Redirección automática funciona
- [ ] No hay memory leaks

---

## **FASE 4: Servicio y Estado de Grupos**
**Duración estimada: 2-3 horas**

### Objetivos
- Servicio para gestión de grupos
- Estado global o contexto
- CRUD básico de grupos

### Prompt para Cursor AI

```
Implementa la gestión de grupos en Sento:

ARCHIVOS:

1. /src/services/groups.service.ts
   - createGroup(data: CreateGroupInput): Promise<Group>
     * Llama a RPC create_group de Supabase
     * Valida que si type='trip', end_date existe
   - getMyGroups(): Promise<Group[]>
     * Query con join a group_members donde user_id = auth.user.id
   - getGroupById(id: string): Promise<Group | null>
   - updateGroup(id: string, data: Partial<Group>): Promise<Group>
     * Permite cambiar type (de 'group' a 'trip' y viceversa)
     * Si cambia a 'trip', end_date es obligatorio
   - deleteGroup(id: string): Promise<void> (soft delete o hard)

2. /src/types/groups.types.ts
   - Interfaces: 
     * Group { id, owner_id, name, type: 'trip' | 'group', start_date, end_date?, destination?, notes?, created_at }
     * GroupMember
     * CreateGroupInput
     * UpdateGroupInput

3. /src/hooks/useGroups.ts
   - Hook que gestiona lista de grupos
   - Funciones: loadGroups, createGroup, refreshGroups
   - Estados: groups, loading, error
   - Usar AsyncStorage para cache local

4. /src/hooks/useGroup.ts (para grupo individual)
   - Recibe groupId
   - Carga detalle del grupo
   - Funciones: updateGroup, deleteGroup
   - Incluye lógica para verificar si grupo tipo 'trip' está caducado

LÓGICA DE CADUCIDAD:
- Función helper: isGroupExpired(group: Group): boolean
  * Si type === 'group': siempre retorna false
  * Si type === 'trip': compara end_date con fecha actual
- Los grupos caducados deben mostrarse diferente en UI (badge, opacity)

OPTIMIZACIONES:
- Cache de grupos en AsyncStorage
- Optimistic updates para mejor UX
- Manejo de errores de red

TIPOS:
interface Group {
  id: string;
  owner_id: string;
  name: string;
  type: 'trip' | 'group';
  start_date: string; // ISO 8601
  end_date?: string; // Obligatorio si type='trip'
  destination?: string;
  notes?: string;
  created_at: string;
  // Relaciones populadas
  members?: GroupMember[];
  owner?: Profile;
}
```

### Checklist de validación
- [ ] Crear grupo tipo 'trip' con end_date funciona
- [ ] Crear grupo tipo 'group' sin end_date funciona
- [ ] Validación de end_date obligatorio para 'trip'
- [ ] Listar grupos funciona
- [ ] Ver detalle de grupo funciona
- [ ] Actualizar grupo y cambiar tipo funciona
- [ ] Eliminar grupo funciona
- [ ] Helper isGroupExpired funciona correctamente
- [ ] Estados de loading apropiados

---

## **FASE 5: UI de Lista y Creación de Grupos**
**Duración estimada: 3-4 horas**

### Objetivos
- Pantalla Home con lista de grupos
- Modal/pantalla para crear grupo
- Diseño de tarjetas de grupo
- Selector de tipo (viaje/grupo)

### Prompt para Cursor AI

```
Crea las pantallas de gestión de grupos:

PANTALLAS:

1. /app/(authenticated)/home.tsx (MEJORAR)
   - Header: "Mis Grupos" + botón (+) crear
   - Lista de grupos con FlatList
   - Empty state: "No tienes grupos. ¡Crea uno!"
   - Pull to refresh
   - Usar useGroups hook
   - Separar visualmente grupos activos de caducados

2. /app/(authenticated)/groups/create.tsx o Modal
   - Form con campos:
     * Nombre del grupo* (required)
     * Tipo*: Radio buttons o Segmented Control
       - 🗓️ Viaje (con fechas)
       - 👥 Grupo (permanente)
     * SI tipo === 'trip':
       - Fecha inicio* (DatePicker)
       - Fecha fin* (DatePicker, obligatorio)
       - Destino (opcional)
     * SI tipo === 'group':
       - Fecha inicio* (DatePicker, fecha de creación)
       - Destino (opcional, puede ser "Familia", "Amigos", etc.)
     * Notas (TextArea, opcional)
   - Validación: 
     * fecha fin >= fecha inicio
     * end_date obligatorio si type='trip'
   - Botón "Crear Grupo"
   - Loading state
   - Success: navegar a detalle del grupo creado

3. /app/(authenticated)/groups/[id].tsx
   - Placeholder por ahora: mostrar nombre, tipo, fechas, destino
   - Badge: "VIAJE" o "GRUPO"
   - Si es viaje caducado: banner "Este viaje ha finalizado"
   - Botón "Editar" (puede ser modal similar a create)
     * Permite cambiar de tipo
   - Botón "Eliminar" con confirmación

COMPONENTES:

1. /src/components/GroupCard.tsx
   - Props: group, onPress
   - Muestra: nombre, tipo (badge), fechas, destino
   - Visual: imagen placeholder, fechas formateadas
   - Estado: 
     * Si type='trip' y caducado: badge "Finalizado" + opacity reducida
     * Si type='group': badge "Activo"
   - Icono diferente según tipo: 🗓️ para viaje, 👥 para grupo

2. /src/components/GroupTypeSelector.tsx
   - Radio buttons o segmented control
   - Props: value, onChange
   - Opciones: "Viaje" | "Grupo"
   - Descripción bajo cada opción:
     * Viaje: "Con fechas de inicio y fin"
     * Grupo: "Sin fecha de finalización"

3. /src/components/DatePicker.tsx (o usar librería)
   - Wrapper de date picker nativo
   - Retorna fecha en formato ISO

4. /src/components/EmptyState.tsx (reutilizable)
   - Props: icon, title, message, action?
   - Diseño centrado y amigable

NAVEGACIÓN:
- Tab navigation en home (preparar para futuras tabs)
- Stack navigation para detalles

FORMATO FECHAS:
- Usar date-fns o day.js para formatear
- Español: "15 Ene 2025 - 22 Ene 2025"
- Para grupos sin end_date: "Desde 15 Ene 2025"
```

### Checklist de validación
- [ ] Lista de grupos se muestra correctamente
- [ ] Selector de tipo funciona
- [ ] Crear grupo tipo 'trip' funciona end-to-end
- [ ] Crear grupo tipo 'group' funciona end-to-end
- [ ] Validación de end_date obligatorio para 'trip'
- [ ] Empty state se muestra cuando no hay grupos
- [ ] Pull to refresh funciona
- [ ] Navegación a detalle funciona
- [ ] DatePicker funciona en iOS y Android
- [ ] Grupos caducados se muestran diferenciados
- [ ] Badge de tipo se muestra correctamente

---

## **FASE 6: Sistema de Invitaciones - Backend**
**Duración estimada: 2-3 horas**

### Objetivos
- Edge Function para generar invitaciones
- Esquema de tokens JWT
- Endpoint para unirse a grupo

### Prompt para Cursor AI

```
Implementa el sistema de invitaciones en el backend:

MIGRACIÓN SQL: 002_invitations.sql
- No necesitamos tabla específica, usaremos JWT stateless

RPC FUNCTIONS EN SUPABASE:

1. join_group(group_id uuid, invite_token text)
   - Verifica que el token JWT es válido (firma, exp)
   - Decodifica payload: {aud: group_id, exp: timestamp}
   - Verifica que aud coincide con group_id
   - Verifica que exp > now()
   - INSERT INTO group_members (group_id, user_id, role) VALUES ($1, auth.uid(), 'member')
     ON CONFLICT DO NOTHING
   - RETURN group completo con members
   - Errores: 403 si token inválido, 409 si ya es miembro

EDGE FUNCTION: /supabase/functions/generate-invite/index.ts

```typescript
// POST /functions/v1/generate-invite
// Headers: Authorization: Bearer <supabase-token>
// Body: { group_id: string, expires_in?: number }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

serve(async (req) => {
  // 1. Verificar auth
  // 2. Verificar que user es owner del grupo
  // 3. Crear JWT con jose/jwt:
  //    - alg: HS256
  //    - aud: group_id
  //    - exp: now + expires_in (default 7 días)
  //    - secret: SUPABASE_JWT_SECRET (env)
  // 4. Construir deep link: `sento://invite/${group_id}?t=${token}`
  // 5. Return: { url: string, expires_at: string }
})
```

ARCHIVO: /src/services/invites.service.ts
- generateInvite(groupId: string): Promise<{url: string, expires_at: string}>
  * Llama a edge function
- joinGroup(groupId: string, token: string): Promise<Group>
  * Llama a RPC join_group

TESTING:
- Probar generación de token
- Probar unión exitosa
- Probar token expirado
- Probar token de otro grupo
```

### Checklist de validación
- [ ] Edge function genera tokens válidos
- [ ] Tokens tienen expiración correcta
- [ ] RPC join_group acepta tokens válidos
- [ ] Rechaza tokens inválidos/expirados
- [ ] No permite duplicados en group_members

---

## **FASE 7: Sistema de Invitaciones - Frontend**
**Duración estimada: 3-4 horas**

### Objetivos
- Botón compartir en detalle de grupo
- Modal con opciones de compartir
- Deep linking para unirse
- Pantalla de unión a grupo

### Prompt para Cursor AI

```
Implementa el flujo de invitaciones en el frontend:

PANTALLAS:

1. /app/(authenticated)/groups/[id].tsx (MEJORAR)
   - Añadir botón "Invitar participantes"
   - Al presionar: abrir modal ShareInviteModal

2. /app/(authenticated)/groups/join.tsx
   - Pantalla que se abre al escanear QR o abrir link
   - Muestra: nombre del grupo, tipo (viaje/grupo), fechas, destino
   - Botón "Unirme al grupo"
   - Si ya es miembro: "Ya eres parte de este grupo"
   - Si no está autenticado: redirect a sign-up con deep link guardado
   - Si es viaje caducado: mostrar warning pero permitir unirse (para ver historial)

COMPONENTES:

1. /src/components/ShareInviteModal.tsx
   - Props: groupId, visible, onClose
   - Genera invitación al abrir (useEffect)
   - Muestra el link generado
   - Botones:
     * Copiar link (Clipboard.setString)
     * Compartir por WhatsApp (Linking.openURL con whatsapp://)
     * Compartir genérico (Share API de React Native)
   - Placeholder para QR (por ahora solo link)

DEEP LINKING:

1. /app/_layout.tsx (ROOT LAYOUT)
   - Configurar Linking de Expo Router
   - Detectar URL: sento://invite/:groupId?t=:token
   - Extraer groupId y token de params
   - Si autenticado: navegar a /groups/join con params
   - Si no autenticado: guardar en AsyncStorage y redirect a sign-in

2. /src/hooks/useDeepLink.ts
   - Hook que detecta deep links al abrir
   - Extrae params
   - Retorna: {groupId, token, isInvite}

LÓGICA:
- Cuando usuario acepta invitación:
  1. Llamar invites.service.joinGroup(groupId, token)
  2. Si éxito: navegar a /groups/[id]
  3. Si error: mostrar mensaje apropiado

COMPARTIR:
- URL formato: sento://invite/uuid?t=eyJhbG...
- Texto WhatsApp: "¡Te invito a unirte a mi grupo [NOMBRE]! Abre este enlace: [URL]"
```

### Checklist de validación
- [ ] Botón invitar visible en detalle de grupo
- [ ] Modal se abre correctamente
- [ ] Link se genera y se puede copiar
- [ ] Compartir por WhatsApp funciona
- [ ] Deep link abre la app (testear con `npx uri-scheme open`)
- [ ] Unirse a grupo funciona end-to-end
- [ ] Manejo de errores (link expirado, ya miembro)
- [ ] Warning de grupo caducado se muestra si aplica

---

## **FASE 8: Esquema de Documentos (Backend)**
**Duración estimada: 2-3 horas**

### Objetivos
- Crear tablas de documentos
- Configurar Supabase Storage
- RPC functions para metadata

### Prompt para Cursor AI

```
Crea el esquema de documentos en Supabase:

MIGRACIÓN: 003_documents.sql

TABLAS:

1. documents
   - id uuid PK
   - group_id uuid FK→groups
   - owner_id uuid FK→profiles
   - type text ('sensitive' | 'other')
   - title text
   - encrypted boolean
   - created_at timestamp

2. document_versions
   - id uuid PK
   - document_id uuid FK→documents
   - storage_path text (ruta en Storage)
   - mime_type text
   - size_bytes integer
   - ocr_data jsonb (nullable)
   - created_at timestamp

RLS POLICIES:
- documents: visible para miembros del grupo (JOIN con group_members)
- document_versions: visible para miembros del grupo del documento
- IMPORTANTE: Si el grupo es tipo 'trip' y está caducado (end_date < now()), 
  los documentos tipo 'sensitive' NO deben ser visibles para miembros que no sean owners

ÍNDICES:
- documents(group_id)
- document_versions(document_id, created_at DESC)

RPC FUNCTIONS:

1. upload_doc_metadata(...)
   - Recibe: group_id, title, type, encrypted
   - Verifica que user es miembro del grupo
   - Verifica que si grupo es 'trip' caducado y documento es 'sensitive', solo owner puede ver
   - INSERT INTO documents ... RETURNING *

2. add_doc_version(...)
   - Recibe: document_id, storage_path, mime_type, size_bytes, ocr_data?
   - Verifica que user es owner del documento
   - INSERT INTO document_versions ... RETURNING *

3. get_group_documents(group_id uuid)
   - Retorna documentos con última versión
   - JOIN con document_versions ORDER BY created_at DESC LIMIT 1
   - Aplica lógica de caducidad: filtra sensibles si grupo caducado y user no es owner

SUPABASE STORAGE:

1. Crear bucket "documents"
   - Privado (no public)
   - File size limit: 10MB
   - Allowed MIME types: image/*, application/pdf

2. RLS en storage.objects:
   - INSERT: user debe ser miembro del grupo
   - SELECT: user debe ser miembro del grupo + respetar caducidad
   - DELETE: solo owner del documento
```

### Checklist de validación
- [ ] Tablas creadas correctamente
- [ ] RLS policies funcionan
- [ ] Lógica de caducidad en policies funciona
- [ ] Bucket de storage creado
- [ ] RPC functions ejecutan sin errores
- [ ] Políticas de storage permiten upload/download apropiados
- [ ] Restricción de documentos sensibles en grupos caducados funciona

---

## **FASE 9: Servicio de Documentos (Frontend)**
**Duración estimada: 2-3 horas**

### Objetivos
- Servicio para gestión de documentos
- Upload de archivos a Supabase Storage
- Hooks para documentos

### Prompt para Cursor AI

```
Implementa el servicio de documentos en el frontend:

ARCHIVOS:

1. /src/services/documents.service.ts

```typescript
// Funciones principales
async uploadDocument(params: {
  groupId: string;
  file: File | Blob;
  title: string;
  type: 'sensitive' | 'other';
  encrypted: boolean;
}): Promise<Document> {
  // 1. Verificar si grupo está caducado (si es trip)
  // 2. Crear metadata con RPC upload_doc_metadata
  // 3. Generar storage_path: `documents/${groupId}/${documentId}/${timestamp}`
  // 4. Upload file a storage con supabase.storage.from('documents').upload()
  // 5. Crear version con RPC add_doc_version
  // 6. Return document completo
}

async getGroupDocuments(groupId: string): Promise<Document[]> {
  // Llamar RPC get_group_documents
  // Los documentos sensibles de grupos caducados ya están filtrados en backend
}

async getDocumentUrl(storagePath: string): Promise<string> {
  // Crear signed URL temporal (60 min)
  // supabase.storage.from('documents').createSignedUrl()
}

async deleteDocument(documentId: string): Promise<void> {
  // Soft delete o hard delete según decidas
}
```

2. /src/types/documents.types.ts
   - Interfaces: Document, DocumentVersion, UploadDocumentInput

3. /src/hooks/useDocuments.ts
   - Hook para lista de documentos de un grupo
   - Estados: documents, loading, uploading, error
   - Funciones: loadDocuments, uploadDocument, refreshDocuments
   - Incluye helper para verificar si documentos sensibles son accesibles

4. /src/hooks/useDocumentUpload.ts
   - Hook especializado para upload con progress
   - Estados: progress, uploading, error
   - Función: upload(file, metadata)

MANEJO DE ARCHIVOS:
- React Native: usar expo-document-picker para seleccionar
- Validaciones: tamaño max 10MB, tipos permitidos
- Progress tracking durante upload

LÓGICA DE CADUCIDAD:
- Helper: canAccessDocument(group: Group, document: Document, isOwner: boolean): boolean
  * Si document.type === 'other': siempre true
  * Si document.type === 'sensitive' && group.type === 'group': siempre true
  * Si document.type === 'sensitive' && group.type === 'trip' && caducado:
    - true si isOwner
    - false si no es owner
```

### Checklist de validación
- [ ] Servicio compila sin errores TypeScript
- [ ] Upload de archivo funciona
- [ ] Metadata se guarda correctamente
- [ ] Lista de documentos se obtiene
- [ ] Signed URLs se generan correctamente
- [ ] Lógica de caducidad implementada en cliente
- [ ] Helper canAccessDocument funciona

---

## **FASE 10: UI de Documentos - Upload Manual**
**Duración estimada: 3-4 horas**

### Objetivos
- Tab de documentos en detalle de grupo
- Botón añadir documento
- Upload manual de archivos
- Lista de documentos

### Prompt para Cursor AI

```
Crea la UI de gestión de documentos:

PANTALLAS:

1. /app/(authenticated)/groups/[id].tsx (MEJORAR)
   - Añadir Tab Navigation: "Detalles" | "Documentos" | "Actividad"
   - Tab "Documentos": renderizar <DocumentsTab groupId={id} group={group} />

COMPONENTES:

1. /src/components/DocumentsTab.tsx
   - Props: groupId, group
   - Usar hook useDocuments(groupId)
   - Header con botón [+ Añadir]
   - Si grupo es 'trip' caducado: banner informativo
     * "Este viaje ha finalizado. Solo puedes ver documentos no sensibles."
     * Si es owner: "Como organizador, puedes ver todos los documentos"
   - Lista de documentos (FlatList)
   - Documentos no accesibles (sensibles en grupo caducado): mostrar bloqueado 🔒
   - Empty state: "No hay documentos. Añade el primero"
   - Pull to refresh

2. /src/components/DocumentCard.tsx
   - Props: document, onPress, isAccessible
   - Muestra: título, tipo, fecha subida, icono según mime_type
   - Badge: "Sensible" si type === 'sensitive'
   - Badge: "Cifrado" si encrypted === true
   - Si !isAccessible: overlay con candado + tooltip
   - Icono: PDF/JPG/PNG

3. /src/components/AddDocumentModal.tsx
   - Props: groupId, group, visible, onClose
   - Verificar si grupo está caducado: no permitir subir si es 'trip' caducado (solo lectura)
   - Dos opciones (por ahora solo implementar Manual):
     * [📄 Manual] - implementar ahora
     * [📷 Escanear] - placeholder, implementar después
   - Formulario Manual:
     * Botón "Seleccionar archivo" (expo-document-picker)
     * Input: Título*
     * Selector: Tipo (Sensible / Otro)
     * Info: Si selecc