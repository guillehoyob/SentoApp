# 📊 ESTADO COMPLETO PRD - SENTO APP

## 📋 ÍNDICE
1. [Autenticación & Onboarding](#1-autenticación--onboarding)
2. [Gestión de Grupos/Viajes](#2-gestión-de-gruposviajes)
3. [Sistema de Invitaciones](#3-sistema-de-invitaciones)
4. [Vault de Documentos](#4-vault-de-documentos)
5. [Itinerarios](#5-itinerarios)
6. [Gastos Compartidos](#6-gastos-compartidos)
7. [Chat Grupal](#7-chat-grupal)
8. [Notificaciones](#8-notificaciones)
9. [Refactorización & Mejoras](#9-refactorización--mejoras)
10. [Plan de Validación](#10-plan-de-validación)

---

# 1. AUTENTICACIÓN & ONBOARDING

## ✅ **COMPLETADO**
- **Registro/Login** con Supabase Auth (email/password)
- **Perfil básico** (`profiles` table)
- **RLS policies** para `profiles`
- **Pantallas:**
  - `app/(auth)/login.tsx`
  - `app/(auth)/signup.tsx`
  - Layout protegido `app/(authenticated)/_layout.tsx`

## ⏸️ **FALTA DESARROLLAR**
- [ ] Login con Google/Apple (OAuth)
- [ ] Onboarding inicial (tutorial primera vez)
- [ ] Editar perfil completo (foto, bio, preferencias)
- [ ] Cambiar contraseña
- [ ] Recuperar contraseña (forgot password)
- [ ] Configuración de privacidad

## 🧪 **FALTA PROBAR**
- [ ] Registro → Login → Logout
- [ ] Cerrar sesión → Volver a entrar
- [ ] Múltiples usuarios registrados
- [ ] Tokens expiración/renovación

---

# 2. GESTIÓN DE GRUPOS/VIAJES

## ✅ **COMPLETADO**

### **Backend (BD):**
- **Tabla `groups`**: id, owner_id, name, type (trip/group), start_date, end_date, destination, notes
- **Tabla `group_members`**: group_id, user_id, role (owner/admin/member), joined_at
- **RPC Functions:**
  - `create_group()` - Crear grupo/viaje
  - `get_my_groups()` - No, se hace en frontend
  - `set_group_requirements()` - Definir docs obligatorios
  - `get_group_requirements()` - Obtener requisitos
- **RLS Policies**: Owners ven sus grupos, miembros ven grupos donde participan

### **Frontend:**
- **Pantallas:**
  - `app/(authenticated)/home.tsx` - Dashboard principal
  - `app/(authenticated)/groups.tsx` - Lista de grupos
  - `app/(authenticated)/create-group.tsx` - Crear grupo/viaje
  - `app/(authenticated)/group-detail.tsx` - Detalle + editar + eliminar
- **Hooks:**
  - `src/hooks/useGroups.ts` - CRUD grupos (con cache AsyncStorage)
  - `src/hooks/useGroup.ts` - Detalle individual
- **Services:**
  - `src/services/groups.service.ts` - Lógica negocio
- **Features:**
  - Crear grupo/viaje (tipo, fechas, destino)
  - Ver lista (con auto-refresh al volver)
  - Editar grupo (inline)
  - Eliminar grupo
  - Ver miembros
  - Requisitos documentos (obligatorio/opcional)
  - Card amarilla 📋 muestra requisitos
  - Botón ✏️ Editar (solo owners, próximamente)

## ⏸️ **FALTA DESARROLLAR**
- [ ] Editar requisitos (modal completo)
- [ ] Gestionar miembros UI (promover admin, expulsar)
- [ ] Roles admin (UI + permisos diferenciados)
- [ ] Archivar grupos/viajes
- [ ] Duplicar grupo
- [ ] Filtros/búsqueda grupos
- [ ] Ordenar (fecha, nombre, tipo)
- [ ] Estadísticas grupo (docs compartidos, gastos, etc)

## 🧪 **FALTA PROBAR**
- [x] Crear grupo → Aparece en lista
- [x] Editar grupo → Cambios persisten
- [x] Eliminar grupo → Desaparece
- [ ] Usuario B ve grupo de A (tras unirse)
- [ ] Expiración viajes (end_date < now)
- [ ] Requisitos al crear (aparecen en detalle)

**Cómo probar:**
1. Crear 5 grupos diferentes (2 trips, 3 groups)
2. Editar cada uno (nombre, fechas, notas)
3. Eliminar 2
4. Verificar lista actualiza
5. Verificar requisitos aparecen

---

# 3. SISTEMA DE INVITACIONES

## ✅ **COMPLETADO**

### **Backend:**
- **Edge Function**: `generate-invite-link` (Deno)
  - Genera JWT con group_id + expiración
  - Devuelve deep link `sento://join?token=...`
- **RPC Function**: `join_group_via_invite(p_token text)`
  - Valida token
  - Añade usuario a grupo
  - Inserta en `group_members`
- **RLS Policies**: Verifican permisos para unirse

### **Frontend:**
- **Pantalla**: `app/(authenticated)/join.tsx`
  - Captura deep link
  - Llama `join_group_via_invite`
  - Navega a grupo
- **Componente**: `src/components/ShareInviteModal.tsx`
  - Genera link
  - Copia portapapeles
  - Botón dev (simular sin APK)
- **Deep Linking**: Configurado en `app.json` (scheme `sento://`)

## ⏸️ **FALTA DESARROLLAR**
- [ ] Modal onboarding al unirse (mostrar requisitos) - **Creado, falta integrar**
- [ ] Compartir via WhatsApp/Telegram/Email nativo
- [ ] QR code para invitación
- [ ] Links públicos (sin token, cualquiera se une)
- [ ] Límite usos por link
- [ ] Revocación de invitaciones

## 🧪 **FALTA PROBAR**
- [ ] Generar link → Copiar → Abrir en otro dispositivo
- [ ] Token válido → Se une correctamente
- [ ] Token expirado → Error
- [ ] Token inválido → Error
- [ ] Usuario ya en grupo → Detecta duplicado
- [ ] Deep link abre app correctamente (APK)

**Cómo probar (REQUIERE APK):**
1. Usuario A: Crear grupo
2. Usuario A: Generar invitación
3. Usuario A: Enviar link por WhatsApp a Usuario B
4. Usuario B: Clic link → Abre app Sento
5. Usuario B: Ve modal onboarding (requisitos)
6. Usuario B: Acepta → Se une al grupo
7. Ambos: Verifican B aparece en miembros

---

# 4. VAULT DE DOCUMENTOS

## ✅ **COMPLETADO**

### **Backend (BD):**

**8 Tablas creadas:**
1. `user_documents` - Documentos personales
2. `document_files` - Múltiples archivos por documento
3. `document_shares` - Compartir con grupos
4. `document_individual_shares` - Compartir 1-a-1 (NO USADO AÚN)
5. `document_access_logs` - Auditoría accesos
6. `document_access_requests` - Solicitudes acceso
7. `bulk_access_requests` - Solicitudes masivas (NO USADO AÚN)
8. `group_document_requirements` - Requisitos por grupo

**29 RPC Functions:**
- Gestión docs: `create_personal_document`, `update_document_info`, `update_document_fields`, `delete_personal_document`, `get_my_documents`
- Archivos: `add_document_file`, `delete_document_file`
- Compartir: `share_document_with_group`, `hide_document_from_group`, `show_document_in_group`, `update_document_share`, `delete_document_share`
- Solicitudes: `request_document_access`, `approve_access_request`, `reject_access_request`, `request_documents_from_group`
- Acceso: `get_document_url`, `get_group_shared_documents`
- Auditoría: `get_my_document_access_logs`
- Requisitos: `set_group_requirements`, `get_group_requirements`
- Roles: `promote_to_admin`, `demote_from_admin`
- Rate limiting: `check_rate_limit`

**30+ Índices optimizados**
**24+ RLS Policies**
**Bucket Storage**: `documents` (con RLS)

### **Frontend:**

**Pantallas:**
- `app/(authenticated)/vault.tsx` - Mi vault personal
- `app/(authenticated)/document-logs.tsx` - Logs de acceso
- `app/(authenticated)/access-requests.tsx` - Solicitudes pendientes

**Componentes:**
- `src/components/UploadDocumentModal.tsx` - Subir documento
- `src/components/ShareDocumentModal.tsx` - Compartir con grupo (5 tipos permisos)
- `src/components/EditDocumentModalFull.tsx` - Editar todo (título, tipo, campos, archivos)
- `src/components/RequestDocumentsModal.tsx` - Mass requests desde grupo
- `src/components/GroupOnboardingModal.tsx` - Requisitos al unirse (creado, no integrado)

**Hooks:**
- `src/hooks/useDocuments.ts` - Gestión documentos personales
- `src/hooks/useAccessRequests.ts` - Solicitudes pendientes
- `src/hooks/useGroupDocuments.ts` - Docs compartidos en grupo

**Services:**
- `src/services/documents.service.ts` - Lógica completa (31 funciones)

**Tipos de Documentos:**
- Pasaporte (🛂): Número, Fecha Exp/Cad, País
- DNI/Cédula (🪪): Número, Fecha Exp/Cad
- Seguro (🏥): Nº Póliza, Proveedor, Fecha Cad, Tel Emergencia
- Licencia (🚗): Número, Clase, Fecha Cad, País
- Otro (📄): Sin campos predefinidos

**5 Tipos de Permisos:**
1. **Manual**: Permanente hasta revocar
2. **Trip-linked**: Expira con el viaje (end_date)
3. **Temporal**: Fecha expiración personalizada
4. **Manual con start**: Activo desde fecha específica
5. **Programado**: Activo entre 2 fechas (starts_at → expires_at)

**Features Implementadas:**
- ✅ Subir documento (título, tipo, archivo)
- ✅ Múltiples archivos por documento
- ✅ Campos personalizados por tipo
- ✅ Copiar campos al clipboard
- ✅ Ver/abrir documentos (expo-web-browser)
- ✅ Editar documento completo (modal full)
- ✅ Editar nombres archivos (inline)
- ✅ Eliminar documento
- ✅ Compartir con grupo (5 tipos)
- ✅ Ocultar/mostrar en grupo
- ✅ Editar/revocar permisos (botón ⚙️)
- ✅ Ver logs de acceso (pantalla dedicada)
- ✅ Solicitudes pendientes (pantalla dedicada)
- ✅ Aprobar/rechazar solicitudes
- ✅ Mass requests UI (botón 📥 desde grupo)
- ✅ Requisitos grupo (crear + ver)
- ✅ Auto-refresh documentos en grupo

## ⏸️ **FALTA DESARROLLAR**

**Backend:**
- [ ] Whitelist pre-aprobados (backend existe, falta UI)
- [ ] Bulk requests avanzadas (tabla existe, no se usa)
- [ ] Individual shares 1-a-1 (tabla existe, no se usa)
- [ ] Renovar/extender permisos
- [ ] Notificaciones solicitudes (Firebase)
- [ ] Notificaciones expiraciones (Firebase)

**Frontend:**
- [ ] Integrar modal onboarding en flujo join
- [ ] Editar requisitos grupo (modal completo)
- [ ] UI whitelist (pre-aprobar usuarios)
- [ ] Rate limiting visible (contador)
- [ ] Filtrar logs (por doc, por grupo)
- [ ] Exportar logs (CSV/PDF)
- [ ] Búsqueda documentos vault
- [ ] Ordenar documentos (tipo/fecha/nombre)
- [ ] Bulk actions (compartir/revocar múltiples)
- [ ] Badges contador (solicitudes pendientes)
- [ ] Indicador progreso requisitos
- [ ] OCR automático (extraer campos de imagen)
- [ ] Cifrado local archivos
- [ ] Backup automático

**Documentos Grupales (No sensibles):**
- [ ] Tabla `group_documents` (reservas, tickets, mapas)
- [ ] Subir docs compartidos al grupo
- [ ] Carpetas/categorías
- [ ] Control versiones

## 🧪 **FALTA PROBAR**

**1 Usuario (Ahora):**
- [x] Subir documento
- [x] Editar campos
- [x] Añadir múltiples archivos
- [x] Editar nombre archivo
- [x] Ver documento
- [x] Copiar campos
- [x] Compartir con grupo
- [x] Ocultar/mostrar
- [x] Ver logs acceso
- [x] Eliminar documento
- [ ] Crear grupo con requisitos → Validar aparecen

**2+ Usuarios (REQUIERE APK):**
- [ ] A crea grupo con requisitos (passport obligatorio, dni opcional)
- [ ] B recibe invitación
- [ ] B ve modal onboarding (requisitos)
- [ ] B acepta y se une
- [ ] B sube passport + dni
- [ ] B comparte passport con grupo
- [ ] A ve passport de B en grupo
- [ ] A solicita DNI a B (individual)
- [ ] B ve solicitud en "Solicitudes pendientes"
- [ ] B aprueba solicitud
- [ ] A ve DNI de B
- [ ] Ambos verifican logs (A accedió a docs de B)
- [ ] B oculta passport
- [ ] A ya no ve passport
- [ ] A solicita passport de nuevo
- [ ] B rechaza
- [ ] A solicita múltiples docs a múltiples usuarios (mass request)
- [ ] C, D, E ven solicitudes
- [ ] Algunos aprueban, otros rechazan
- [ ] A ve quién aprobó
- [ ] Probar permisos temporales (crear con expires_at = +2min, esperar, verificar no accesible)

**Cómo probar (APK):**
```bash
# Instalar en 2+ móviles
# Usuario A: Crear "Viaje París"
# Usuario A: Requisitos → Passport (obligatorio), Insurance (opcional)
# Usuario A: Generar invitación
# Usuario B: Abrir link
# Usuario B: Ver modal → "📋 Requisitos: 🛂 Passport (Obligatorio), 🏥 Seguro (Opcional)"
# Usuario B: Checkbox "Acepto compartir estos documentos"
# Usuario B: "Unirme al Grupo"
# Usuario B: Vault → Subir Passport
# Usuario B: Compartir con "Viaje París"
# Usuario A: Entrar grupo → Ver docs compartidos → Ver passport de B
# Usuario A: Botón 📥 Solicitar → Seleccionar Insurance → Enviar
# Usuario B: Vault → "Ver solicitudes pendientes" → Aprobar
# Usuario A: Refrescar grupo → Ver insurance de B
# Ambos: Ver logs → Verificar accesos registrados
```

---

# 5. ITINERARIOS

## ❌ **NO DESARROLLADO**

### **Qué falta:**
- [ ] Tabla `itinerary_days` (day_number, date, group_id)
- [ ] Tabla `itinerary_activities` (day_id, time, title, location, notes, type)
- [ ] RPC Functions (CRUD actividades)
- [ ] RLS Policies
- [ ] Pantalla itinerario por días
- [ ] Añadir/editar/eliminar actividades
- [ ] Arrastrar/reordenar actividades
- [ ] Integración con mapas (mostrar ubicaciones)
- [ ] Compartir itinerario (PDF/imagen)

---

# 6. GASTOS COMPARTIDOS

## ❌ **NO DESARROLLADO**

### **Qué falta:**
- [ ] Tabla `expenses` (group_id, payer_id, amount, currency, description, date, category)
- [ ] Tabla `expense_splits` (expense_id, user_id, amount, paid)
- [ ] RPC Functions (CRUD gastos, calcular balances)
- [ ] RLS Policies
- [ ] Pantalla gastos del grupo
- [ ] Añadir gasto (dividir igual/desigual/porcentaje)
- [ ] Marcar como pagado
- [ ] Resumen balances ("A debe X a B")
- [ ] Gráficos gastos por categoría
- [ ] Exportar resumen (PDF)
- [ ] Integración monedas (conversión)

---

# 7. CHAT GRUPAL

## ❌ **NO DESARROLLADO**

### **Qué falta:**
- [ ] Tabla `chat_messages` (group_id, sender_id, message, type, metadata, timestamp)
- [ ] RPC Functions (enviar, recibir, marcar leídos)
- [ ] RLS Policies
- [ ] Realtime subscriptions (Supabase Realtime)
- [ ] Pantalla chat por grupo
- [ ] Enviar texto/emoji
- [ ] Enviar imágenes/archivos
- [ ] Responder mensajes
- [ ] Reacciones emoji
- [ ] Notificaciones nuevos mensajes
- [ ] Indicador "escribiendo..."
- [ ] Marcar mensajes como leídos

---

# 8. NOTIFICACIONES

## ❌ **NO DESARROLLADO**

### **Qué falta:**
- [ ] Configurar Firebase Cloud Messaging (FCM)
- [ ] Tabla `notification_tokens` (user_id, token, platform)
- [ ] Edge Function `send-notification`
- [ ] Tipos de notificaciones:
  - Nueva invitación grupo
  - Solicitud acceso documento
  - Solicitud aprobada/rechazada
  - Documento compartido contigo
  - Permiso por expirar (24h antes)
  - Nuevo mensaje chat
  - Nuevo gasto añadido
  - Actividad itinerario próxima
- [ ] Pantalla configuración notificaciones
- [ ] Marcar notificaciones como leídas
- [ ] Badge contador

---

# 9. REFACTORIZACIÓN & MEJORAS

## 📚 **APRENDER/ESTUDIAR**

### **Plan de Estudio (40-60 horas):**

**Semana 1: Backend (Supabase)**
- [ ] **Día 1-2**: Revisar todas las tablas (`groups`, `user_documents`, etc)
  - Entender relaciones (FK, CASCADE)
  - Revisar índices (por qué están ahí)
  - Estudiar RLS policies (quién puede ver qué)
- [ ] **Día 3-4**: Revisar RPC Functions (29 funciones)
  - Leer cada una línea por línea
  - Entender lógica de negocio
  - Probar en SQL Editor
- [ ] **Día 5**: Storage + Edge Functions
  - Políticas bucket `documents`
  - `generate-invite-link` (Deno, JWT)

**Semana 2: Frontend (React Native)**
- [ ] **Día 1-2**: Estructura carpetas y navegación
  - `app/` (Expo Router)
  - `src/` (hooks, services, components, types)
  - Flujo autenticación
- [ ] **Día 3-4**: Hooks personalizados
  - `useGroups`, `useGroup`, `useDocuments`, etc
  - Cómo funcionan con cache (AsyncStorage)
  - Optimistic updates
- [ ] **Día 5**: Services y componentes
  - `groups.service.ts`, `documents.service.ts`
  - Modales complejos (`EditDocumentModalFull`)

**Semana 3: Flujos Completos**
- [ ] **Día 1**: Flujo crear grupo → invitar → unirse
- [ ] **Día 2**: Flujo subir doc → compartir → solicitar → aprobar
- [ ] **Día 3**: Flujo requisitos → onboarding → cumplimiento
- [ ] **Día 4**: Flujo logs, auditoría, rate limiting
- [ ] **Día 5**: Casos edge (errores, expiración, permisos)

### **Recursos de Aprendizaje:**
- **Supabase Docs**: https://supabase.com/docs
- **Expo Router Docs**: https://docs.expo.dev/router/introduction/
- **PostgreSQL Tutorial**: https://www.postgresqltutorial.com/
- **React Native Docs**: https://reactnative.dev/docs/getting-started

---

## 🔨 **REFACTORIZACIÓN CÓDIGO**

### **Prioridad Alta:**
- [ ] **Eliminar código muerto**
  - Archivos obsoletos borrados: ✅ (ya hecho)
  - Funciones no usadas en services
  - Componentes duplicados
  - Imports innecesarios
- [ ] **Consistencia naming**
  - Variables: camelCase
  - Componentes: PascalCase
  - Constantes: UPPER_SNAKE_CASE
  - Archivos: kebab-case o PascalCase (decidir uno)
- [ ] **Tipos TypeScript completos**
  - Eliminar `any` (reemplazar con tipos específicos)
  - Interfaces para todos los objetos
  - Enums para opciones fijas
- [ ] **Manejo errores consistente**
  - Try-catch en todos los async
  - Mensajes error user-friendly
  - Logging errores (consola + Sentry futuro)
- [ ] **Comentarios y documentación**
  - JSDoc para funciones públicas
  - Comentarios inline para lógica compleja
  - README por carpeta (`src/hooks/README.md`)

### **Prioridad Media:**
- [ ] **Optimización performance**
  - Memoization (`useMemo`, `useCallback`)
  - Lazy loading componentes pesados
  - Optimizar queries BD (less joins, indexes)
  - Comprimir imágenes antes upload
- [ ] **Testing**
  - Unit tests (Jest) para services
  - Integration tests (end-to-end con APK)
  - Test RLS policies (SQL)
- [ ] **Internacionalización (i18n)**
  - Extraer todos los strings
  - Archivo `es.json`, `en.json`
  - Hook `useTranslation`

### **Prioridad Baja:**
- [ ] **Monorepo structure** (si crece mucho)
- [ ] **CI/CD** (GitHub Actions)
- [ ] **Monitoreo** (Sentry, Analytics)

---

## 🎨 **UI/UX MEJORAS**

### **Principios UX (Experto):**
1. **Consistencia**: Mismos colores, tipografías, espaciados
2. **Feedback visual**: Loading, success, error siempre claros
3. **Jerarquía**: Lo importante más grande/contrastado
4. **Accesibilidad**: Tamaños táctiles (min 44x44px), contraste WCAG AA
5. **Microinteracciones**: Animaciones sutiles (fade, slide)

### **Plan UI:**

**Semana 1: Auditoría**
- [ ] Capturar screenshots de TODAS las pantallas
- [ ] Identificar inconsistencias (colores, espaciados, botones)
- [ ] Listar elementos repetidos (candidatos a componente)

**Semana 2: Design System**
- [ ] **Colores**: Definir paleta (primary, secondary, neutral, danger, success)
- [ ] **Tipografía**: Escalas (h1, h2, body, caption)
- [ ] **Espaciado**: Sistema 4px (xs=4, sm=8, md=16, lg=24, xl=32)
- [ ] **Componentes base**:
  - Button (variants: primary, secondary, outline, danger)
  - Input (variants: default, error, disabled)
  - Card (variants: elevated, outlined)
  - Modal (variants: full, bottom-sheet)
  - Alert/Toast
  - Badge
  - Avatar
  - Skeleton loaders

**Semana 3: Implementación**
- [ ] Migrar todos los componentes a Design System
- [ ] Crear Storybook (opcional, para visualizar componentes)
- [ ] Aplicar animaciones (react-native-reanimated)
- [ ] Dark mode (opcional)

**Semana 4: Polish**
- [ ] Iconos consistentes (Expo Icons o custom)
- [ ] Ilustraciones empty states
- [ ] Micro-interacciones (botones, swipe, pull-to-refresh)
- [ ] Splash screen & App icon

### **Herramientas:**
- **Figma**: Diseñar mockups (gratis para 1 proyecto)
- **Coolors.co**: Generar paletas colores
- **Type Scale**: Calcular escalas tipografía
- **Lottie**: Animaciones (lottiefiles.com)

---

# 10. PLAN DE VALIDACIÓN

## 🔍 **FLUJOS COMPLETOS**

### **Flujo 1: Autenticación**
```
1. Abrir app → Pantalla Login
2. Registro → Email + Password + Nombre
3. Verificar email (si Supabase configurado)
4. Login → Home
5. Logout → Volver a Login
6. Login de nuevo → Home
```

### **Flujo 2: Crear Grupo Simple**
```
1. Home → "Mis Grupos"
2. "✨ Crear mi primer grupo"
3. Tipo: Grupo
4. Nombre: "Amigos Madrid"
5. Fecha inicio: Hoy
6. Crear → Vuelve a lista → Aparece grupo
7. Entrar → Ver detalle
8. Editar nombre → "Amigos Madrid 2025"
9. Guardar → Verificar cambio
```

### **Flujo 3: Crear Viaje con Requisitos**
```
1. Crear grupo → Tipo: Viaje
2. Nombre: "París Marzo"
3. Fechas: 15-20 Marzo 2025
4. Destino: "París, Francia"
5. Scroll → Requisitos:
   - Pasaporte: Obligatorio ✅
   - DNI: Opcional ✅
   - Seguro: Opcional ✅
6. Crear → Entrar grupo
7. Scroll → Ver card amarilla 📋
8. Verificar aparecen 3 requisitos correctos
```

### **Flujo 4: Invitación (1 usuario)**
```
1. Entrar grupo
2. Botón "👥 Invitar"
3. "Simular invitación (Dev)" → Copiar link
4. Pegar link en navegador → Nada (requiere APK)
5. (Validar: link generado correctamente)
```

### **Flujo 5: Documentos - Subir**
```
1. Home → "Mi Vault"
2. "➕ Subir primer documento"
3. Tipo: Pasaporte
4. Título: "Mi Pasaporte"
5. Seleccionar archivo (imagen/PDF)
6. Subir → Esperar ✅ verde
7. Cerrar modal → Ver documento en lista
8. Expandir → Ver detalles
```

### **Flujo 6: Documentos - Editar Campos**
```
1. Vault → Expandir documento
2. "✏️ Editar Todo"
3. Campos:
   - Número: "AB123456"
   - Fecha Expedición: "01/01/2020"
   - Fecha Caducidad: "01/01/2030"
   - País: "España"
4. Guardar → Cerrar
5. Expandir documento → Verificar campos aparecen
6. Probar copiar cada campo (📋)
```

### **Flujo 7: Documentos - Múltiples Archivos**
```
1. Vault → Expandir documento → Editar
2. Scroll → "📎 Archivos (1)"
3. "➕ Añadir Archivo"
4. Seleccionar archivo 2
5. Esperar → Debe aparecer (2)
6. Añadir archivo 3 → (3)
7. Editar nombre archivo 2 → "Página 2"
8. Guardar → Cerrar
9. Expandir → Verificar 3 archivos, uno se llama "Página 2"
```

### **Flujo 8: Documentos - Compartir**
```
1. Vault → Documento → Expandir
2. "📤 Compartir"
3. Seleccionar grupo "París Marzo"
4. Tipo permiso: Manual (permanente)
5. Compartir → Ver "📤 Compartido en: París Marzo"
6. Salir vault → Entrar grupo "París Marzo"
7. Scroll → "Documentos Compartidos: 1"
8. Ver documento listado → Expandir
9. Verificar aparecen campos copiables
10. Verificar aparecen archivos (3)
11. Clic archivo → Se abre en navegador
```

### **Flujo 9: Documentos - Ocultar/Mostrar**
```
1. Vault → Documento compartido → Expandir
2. "👁️‍🗨️ Ocultar de este grupo"
3. Confirmar
4. Salir vault → Entrar grupo
5. Documento debe aparecer con "🔒 Oculto"
6. (Solo owner lo ve oculto, otros no lo ven)
7. Volver vault → "👁️ Mostrar de nuevo"
8. Refrescar grupo → Documento visible
```

### **Flujo 10: Documentos - Editar/Revocar Permiso**
```
1. Vault → Documento compartido → Expandir
2. Sección "📤 Compartido en"
3. Botón ⚙️ del grupo
4. Opciones:
   - Editar → "Próximamente"
   - Revocar → Confirmar
5. Revocar → Documento desaparece de "Compartido en"
6. Entrar grupo → Documento ya no aparece
```

### **Flujo 11: Documentos - Eliminar**
```
1. Vault → Documento → Expandir
2. Scroll abajo → "🗑️ Eliminar Documento"
3. Confirmar → "Esta acción no se puede deshacer"
4. Eliminar → Documento desaparece de vault
5. Entrar grupo (si estaba compartido) → No aparece
```

### **Flujo 12: Logs de Acceso**
```
1. Vault → "📊 Ver logs de acceso"
2. Debe estar vacío (o con tus propios accesos)
3. Abrir documento varias veces
4. Refrescar logs → Ver registros
5. (Con 2 usuarios: B accede → A ve log "B accedió a [doc]")
```

### **Flujo 13: Solicitar Documentos (Mass Request)**
```
1. Entrar grupo "París Marzo"
2. Botón "📥 Solicitar"
3. Seleccionar documentos:
   - Pasaporte ✅
   - Seguro ✅
4. Usuarios: (vacío = todos)
5. "Enviar Solicitudes"
6. Alert: "0 solicitudes creadas" (no hay otros usuarios)
7. (Con 2 usuarios: Debe crear solicitudes)
```

### **Flujo 14: Solicitudes Pendientes**
```
1. Vault → "📥 Ver solicitudes pendientes"
2. Debe estar vacío
3. (Con 2 usuarios):
   - A solicita → B ve solicitud
   - B: ✓ Aprobar o ✗ Rechazar
   - A: Puede acceder al documento
```

---

## 🧪 **FLUJOS APK (2+ Usuarios)**

### **Test Multi-Usuario Completo (30-45 min):**

**Setup:**
- 2 móviles con app instalada
- Usuario A registrado
- Usuario B registrado

**Flujo:**
```
[USUARIO A]
1. Crear viaje "Barcelona Verano"
2. Fechas: 1-7 Julio 2025
3. Requisitos:
   - Passport: Obligatorio
   - Insurance: Opcional
4. Generar invitación → Copiar link
5. Enviar link a Usuario B (WhatsApp)

[USUARIO B]
6. Recibir WhatsApp → Clic link
7. App se abre → Pantalla join
8. Ver modal onboarding:
   - "📋 Requisitos del Grupo"
   - "🛂 Pasaporte (Obligatorio)"
   - "🏥 Seguro (Opcional)"
   - Checkbox "Acepto compartir..."
9. Marcar checkbox → "Unirme al Grupo"
10. Navega a grupo "Barcelona Verano"
11. Ver miembros: A (owner), B (member)

[USUARIO B]
12. Ir a "Mi Vault"
13. Subir Pasaporte:
    - Campos: AB987654, 01/01/2019, 01/01/2029, Spain
    - 2 archivos (portada + datos)
14. Compartir con "Barcelona Verano" (Manual)
15. Subir Seguro:
    - Campos: POL-12345, Axa, 31/12/2025, 900123456
    - 1 archivo
16. Compartir con "Barcelona Verano" (Trip-linked)

[USUARIO A]
17. Refrescar grupo
18. Ver "Documentos Compartidos: 2"
19. Expandir Pasaporte de B:
    - Ver campos copiables
    - Copiar número: AB987654
    - Ver 2 archivos
    - Clic archivo 1 → Se abre navegador
20. Expandir Seguro de B:
    - Ver campos
    - Clic archivo → Se abre

[USUARIO A]
21. Botón 📥 Solicitar
22. Seleccionar: DNI
23. Usuario: B
24. Enviar → "1 solicitud creada"

[USUARIO B]
25. Vault → "📥 Solicitudes pendientes"
26. Ver: "A solicita DNI para Barcelona Verano"
27. ✓ Aprobar

[USUARIO A]
28. Refrescar grupo
29. Ver DNI de B aparece

[USUARIO B]
30. Vault → Expandir Pasaporte → "👁️‍🗨️ Ocultar"
31. Confirmar

[USUARIO A]
32. Refrescar grupo
33. Pasaporte de B aparece "🔒 Oculto - Solicitar acceso"
34. Clic "Solicitar acceso" → Envía solicitud

[USUARIO B]
35. Solicitudes pendientes → Ver nueva solicitud
36. ✗ Rechazar → "No disponible ahora"

[AMBOS USUARIOS]
37. A: Vault → Logs → Ver accesos a docs propios
38. B: Logs → Ver "A accedió a Pasaporte" + "A accedió a Seguro"

[TEST EXPIRACIÓN]
39. B: Compartir doc con permiso Temporal (expires_at = +2 minutos)
40. A: Accede → Funciona
41. Esperar 3 minutos
42. A: Intenta acceder → Error "Permiso expirado"
43. Verificar en logs: "denied" + "Permiso expirado"
```

---

## 🛠️ **HERRAMIENTAS FLUJOS**

### **Gratuitas:**
1. **Excalidraw** (https://excalidraw.com)
   - Diagramas flujo mano alzada
   - Colaborativo
   - Export PNG/SVG

2. **Draw.io / diagrams.net** (https://app.diagrams.net)
   - Diagramas profesionales
   - Flowcharts, UML, etc
   - Gratis, no requiere registro

3. **Miro** (https://miro.com)
   - Plan gratuito: 3 boards
   - Templates flowcharts
   - Colaborativo

4. **Whimsical** (https://whimsical.com)
   - Plan gratuito: 4 boards
   - Flowcharts + wireframes
   - Muy rápido

5. **Figma FigJam** (https://figma.com/figjam)
   - Gratis con cuenta Figma
   - Flowcharts + sticky notes
   - Colaborativo

### **Aceleración:**
- **PlantUML** (https://plantuml.com): Diagramas desde código
- **Mermaid** (https://mermaid.js.org): Markdown → Diagramas
- **IA Prompt**:
  ```
  "Crea un flowchart en formato Mermaid para:
  Usuario A crea grupo → invita B → B se une → B sube doc → A lo ve"
  ```

---

## 📝 **CHECKLIST VALIDACIÓN FINAL**

### **Pre-APK (1 Usuario):**
- [ ] Todos los flujos 1-14 ejecutados
- [ ] Screenshots de cada paso
- [ ] Lista bugs encontrados
- [ ] Tests pasados: 80%+

### **Post-APK (2+ Usuarios):**
- [ ] Flujo multi-usuario completo ejecutado
- [ ] Invitaciones funcionan
- [ ] Solicitudes funcionan
- [ ] Logs registran correctamente
- [ ] Permisos temporales expiran
- [ ] Tests pasados: 95%+

### **Pre-Lanzamiento:**
- [ ] UI/UX mejorado (Design System)
- [ ] Código refactorizado
- [ ] Tests automatizados (Jest)
- [ ] Performance optimizado
- [ ] Notificaciones implementadas (Firebase)
- [ ] Documentación completa
- [ ] Tests pasados: 100%

---

**ESTADO ACTUAL:** MVP 95% (funcional 1 usuario)  
**SIGUIENTE MILESTONE:** APK → Test multi-usuario → Refactorización → Lanzamiento

