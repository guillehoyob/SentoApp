# 📋 INSTRUCCIONES FASE 6 - SISTEMA DE INVITACIONES

## 📁 ARCHIVOS QUE ACABAMOS DE CREAR:

```
C:\Users\ghoyo\Desktop\app_composer\
│
├─ supabase/
│  ├─ migrations/
│  │  └─ 009_invitation_system.sql          ← ESTE ejecutarás en Supabase
│  │
│  └─ functions/
│     └─ generate-invite/
│        └─ index.ts                         ← ESTE desplegarás con CLI
│
└─ src/
   ├─ services/
   │  └─ invites.service.ts                  ← ESTE ya está en tu proyecto
   │
   └─ types/
      └─ invites.types.ts                    ← ESTE ya está en tu proyecto
```

---

## 🚀 LO QUE TÚ TIENES QUE HACER AHORA:

---

## 🗄️ **PASO 1: EJECUTAR SQL EN SUPABASE** ⏱️ 3 minutos

### **¿QUÉ VAMOS A HACER?**
Copiar TODO el archivo SQL y ejecutarlo en Supabase. Esto creará la función `join_group()` en tu base de datos.

### **ARCHIVO A USAR:**
```
📄 C:\Users\ghoyo\Desktop\app_composer\supabase\migrations\009_invitation_system.sql
```

---

### **PASO 1.1: Abrir el archivo SQL**

1. En VS Code (o Cursor), ve a la carpeta:
   ```
   supabase > migrations
   ```

2. Abre el archivo:
   ```
   009_invitation_system.sql
   ```

3. **Selecciona TODO el contenido** (Ctrl+A)

4. **Copia TODO** (Ctrl+C)

**IMPORTANTE:** ⚠️ Debes copiar **DESDE LA PRIMERA LÍNEA HASTA LA ÚLTIMA**. TODO el archivo de una vez.

---

### **PASO 1.2: Ir a Supabase Dashboard**

1. Abre tu navegador

2. Ve a: https://supabase.com/dashboard/projects

3. Deberías ver tu proyecto. Haz clic en:
   ```
   📊 iybjzqtiispacfmmynsx
   ```

4. En el **menú lateral izquierdo**, busca y haz clic en:
   ```
   📝 SQL Editor
   ```

---

### **PASO 1.3: Crear nueva query**

1. En la parte superior derecha, haz clic en el botón:
   ```
   ➕ New query
   ```

2. Te aparecerá un editor de texto vacío (fondo oscuro)

3. **Pega TODO el código SQL** que copiaste (Ctrl+V)

---

### **PASO 1.4: Ejecutar la query**

1. Verifica que TODO el código está pegado (debe empezar con `-- ===` y terminar con `-- ===`)

2. En la parte **inferior derecha**, haz clic en el botón verde:
   ```
   ▶ Run
   ```

3. **Espera 2-3 segundos**

---

### **PASO 1.5: VERIFICAR QUE FUNCIONÓ** ✅

**SI TODO SALIÓ BIEN:**

Verás en la parte inferior un mensaje verde:
```
✓ Success. No rows returned
```

Y opcionalmente:
```
Rows: 0
Time: 0.XXX seconds
```

**Esto significa:** La función `join_group` se creó correctamente.

---

### **PASO 1.6: VERIFICACIÓN EXTRA (Opcional pero recomendado)**

Vamos a verificar que la función existe:

1. En el **mismo SQL Editor**, **borra todo** el contenido

2. Escribe esta query:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'join_group';
   ```

3. Haz clic en **Run**

4. Deberías ver una tabla con:
   ```
   routine_name
   ------------
   join_group
   ```

**Si ves esto:** ✅ ¡Perfecto! La función existe.

**Si no ves nada:** ❌ Algo salió mal en el Paso 1.4. Vuelve a intentarlo.

---

### **🐛 SI TUVISTE UN ERROR:**

#### Error: "function join_group already exists"
**Solución:** Ya la ejecutaste antes. ¡Está bien! Continúa al Paso 2.

#### Error: "syntax error at or near..."
**Solución:** 
1. Verifica que copiaste **TODO el archivo** (desde la línea 1 hasta el final)
2. No debe faltar ningún `;` o palabra clave
3. Intenta copiar de nuevo desde el archivo

---

## ☁️ **PASO 2: DESPLEGAR EDGE FUNCTION** ⏱️ 10 minutos

### **¿QUÉ VAMOS A HACER?**
Instalar el CLI de Supabase y subir la función TypeScript que genera los tokens JWT.

### **ARCHIVO A DESPLEGAR:**
```
📄 C:\Users\ghoyo\Desktop\app_composer\supabase\functions\generate-invite\index.ts
```

---

### **PASO 2.1: Instalar Supabase CLI**

Vamos a usar **Scoop** (un instalador de paquetes para Windows).

#### **2.1.1: Abrir PowerShell como Administrador**

1. Presiona la tecla **Windows**

2. Escribe: `powershell`

3. **Clic derecho** en "Windows PowerShell"

4. Selecciona: **"Ejecutar como administrador"**

5. Si te pide permiso, haz clic en **"Sí"**

---

#### **2.1.2: Verificar si tienes Scoop instalado**

En PowerShell, escribe:
```powershell
scoop --version
```

**SI ves algo como:** `Current Scoop version: 0.X.X`
→ ✅ Ya tienes Scoop. **Salta al Paso 2.1.4**

**SI ves:** `scoop: The term 'scoop' is not recognized...`
→ ❌ No tienes Scoop. **Continúa al Paso 2.1.3**

---

#### **2.1.3: Instalar Scoop (solo si no lo tienes)**

1. Copia este comando:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
   ```

2. Pega en PowerShell y presiona **Enter**

3. Copia este comando:
   ```powershell
   irm get.scoop.sh | iex
   ```

4. Pega en PowerShell y presiona **Enter**

5. **Espera 1-2 minutos** mientras se instala

6. Verás mensajes como "Downloading..." y al final "Scoop was installed successfully!"

---

#### **2.1.4: Instalar Supabase CLI con Scoop**

1. Añadir el repositorio de Supabase:
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   ```

2. Presiona **Enter**. Verás: `The supabase bucket was added successfully.`

3. Instalar Supabase CLI:
   ```powershell
   scoop install supabase
   ```

4. Presiona **Enter**. **Espera 1-2 minutos** mientras descarga e instala.

5. Verás al final: `'supabase' (X.X.X) was installed successfully!`

---

#### **2.1.5: VERIFICAR instalación**

Escribe:
```powershell
supabase --version
```

Deberías ver algo como:
```
1.123.4
```

**Si ves un número de versión:** ✅ ¡Perfecto! CLI instalado.

**Si ves error:** ❌ Cierra y vuelve a abrir PowerShell, luego intenta de nuevo.

---

### **PASO 2.2: Login en Supabase**

#### **2.2.1: Ejecutar login**

En PowerShell, escribe:
```powershell
supabase login
```

Presiona **Enter**.

---

#### **2.2.2: Autorizar en el navegador**

1. Se abrirá tu navegador automáticamente

2. Si no estás logueado en Supabase, inicia sesión

3. Verás una página que dice: **"Authorize Supabase CLI?"**

4. Haz clic en el botón verde: **"Authorize"**

5. Verás: **"You can close this window"**

6. Vuelve a PowerShell

---

#### **2.2.3: VERIFICAR login**

En PowerShell deberías ver:
```
✓ Access token saved to: C:\Users\ghoyo\AppData\Local\supabase\access-token
```

**Si ves esto:** ✅ Estás logueado correctamente.

---

### **PASO 2.3: Linkear tu proyecto**

Ahora vamos a conectar el CLI con tu proyecto específico de Supabase.

#### **2.3.1: Ir a la carpeta del proyecto**

En PowerShell, escribe:
```powershell
cd C:\Users\ghoyo\Desktop\app_composer
```

Presiona **Enter**.

---

#### **2.3.2: Linkear el proyecto**

Escribe:
```powershell
supabase link --project-ref iybjzqtiispacfmmynsx
```

Presiona **Enter**.

---

#### **2.3.3: Ingresar contraseña de la base de datos**

Te preguntará:
```
Enter your database password (or leave blank to skip):
```

**IMPORTANTE:** ⚠️ Esta es la contraseña que pusiste cuando **creaste el proyecto** en Supabase.

**SI NO LA RECUERDAS:**
1. Ve a Supabase Dashboard
2. Settings > Database
3. Database Password > Reset password

Escribe tu contraseña y presiona **Enter**.

**NOTA:** No verás los caracteres mientras escribes (es normal por seguridad).

---

#### **2.3.4: VERIFICAR linkeo**

Deberías ver:
```
✓ Linked to iybjzqtiispacfmmynsx
```

**Si ves esto:** ✅ Proyecto conectado correctamente.

**Si ves error de contraseña:** Intenta de nuevo con `supabase link --project-ref iybjzqtiispacfmmynsx`

---

### **PASO 2.4: DESPLEGAR la Edge Function**

Ahora sí, vamos a subir la función a Supabase.

#### **2.4.1: Comando de deploy**

En PowerShell (asegúrate de estar en `C:\Users\ghoyo\Desktop\app_composer`), escribe:

```powershell
supabase functions deploy generate-invite
```

Presiona **Enter**.

---

#### **2.4.2: Esperar el despliegue**

Verás mensajes como:
```
Deploying Function...
Bundling generate-invite
Uploading...
Deployed Function generate-invite
```

**Esto tarda 10-30 segundos.**

---

#### **2.4.3: VERIFICAR despliegue**

Al final deberías ver:
```
✓ Deployed Function generate-invite on project iybjzqtiispacfmmynsx
```

**Si ves esto:** ✅ ¡Edge Function desplegada correctamente!

---

### **PASO 2.5: VERIFICAR en Supabase Dashboard**

Vamos a confirmar visualmente que la función está activa.

1. Ve a tu navegador

2. Abre: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx

3. En el **menú lateral izquierdo**, busca:
   ```
   ⚡ Edge Functions
   ```

4. Haz clic en **"Edge Functions"**

5. Deberías ver una lista con:
   ```
   📦 generate-invite
   Status: Active (punto verde)
   ```

6. Si haces clic en "generate-invite", verás detalles como:
   - URL: `https://xxx.supabase.co/functions/v1/generate-invite`
   - Logs
   - Settings

**Si ves la función con estado "Active":** ✅ ¡TODO PERFECTO!

---

### **🐛 SI TUVISTE UN ERROR:**

#### Error: "Failed to bundle function"
**Solución:** 
1. Verifica que el archivo existe: `supabase\functions\generate-invite\index.ts`
2. Intenta de nuevo: `supabase functions deploy generate-invite --legacy-bundle`

#### Error: "Project not linked"
**Solución:** Vuelve al Paso 2.3 y ejecuta `supabase link` de nuevo

#### Error: "Invalid JWT"
**Solución:** Tu sesión expiró. Ejecuta `supabase login` de nuevo

---

## ✅ **PASO 3: VERIFICACIÓN FINAL** ⏱️ 2 minutos

### **¿QUÉ VAMOS A HACER?**
Verificar que todo está configurado correctamente.

---

### **PASO 3.1: JWT Secret (Automático)**

La Edge Function necesita un "secreto" para firmar los tokens JWT.

**BUENAS NOTICIAS:** ✅ Supabase **automáticamente** configura esto en las Edge Functions.

**NO NECESITAS HACER NADA.** 🎉

Si quieres verlo (solo por curiosidad):
1. Ve a Supabase Dashboard
2. Settings > API
3. Busca: "JWT Settings" > "JWT Secret"

Pero **NO tienes que copiarlo ni configurarlo**. Ya está hecho.

---

### **PASO 3.2: Checklist Final**

Verifica que completaste todo:

- [ ] **✅ Migración SQL ejecutada**
  - Ir a: SQL Editor en Supabase
  - Ver: "Success. No rows returned"
  - Verificar: Query de verificación mostró `join_group`

- [ ] **✅ Edge Function desplegada**
  - Ir a: Edge Functions en Supabase
  - Ver: `generate-invite` con estado "Active" (verde)

- [ ] **✅ Archivos del proyecto**
  - Existe: `src/services/invites.service.ts`
  - Existe: `src/types/invites.types.ts`

**Si marcaste los 3:** ✅ **¡FASE 6 COMPLETADA!** 🎉

---

### **PASO 3.3: Obtener ID de un grupo (para testing)**

Para probar que funciona, necesitarás el ID de un grupo existente.

#### **Opción 1: Desde la app (más fácil)**

1. Abre tu app en el móvil/emulador

2. Ve a "Mis Grupos"

3. Entra en cualquier grupo

4. En la URL o en consola (si estás en web preview), verás algo como:
   ```
   /group-detail?id=a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

5. Copia el ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

#### **Opción 2: Desde Supabase Dashboard**

1. Ve a Supabase Dashboard

2. En el menú: **Table Editor**

3. Selecciona la tabla: **`groups`**

4. Copia cualquier `id` de la primera columna

**Guarda este ID**, lo usaremos en la Fase 7 para probar.

---

## 📚 **EXPLICACIÓN: ¿QUÉ ACABAS DE CREAR?**

### **1️⃣ RPC Function: `join_group`** (SQL en PostgreSQL)

**Ubicación:** Base de datos de Supabase

**Qué hace:**
```
Usuario abre link → App extrae token → Llama a join_group(groupId, token)
                                              ↓
                                    1. Verifica que el usuario está logueado
                                    2. Decodifica el token JWT
                                    3. Verifica que el token es para ese grupo
                                    4. Verifica que no ha expirado
                                    5. Añade al usuario a group_members
                                    6. Retorna el grupo completo
```

**Se ejecuta desde la app:**
```typescript
await supabase.rpc('join_group', {
  p_group_id: 'abc-123',
  p_invite_token: 'eyJhbG...'
})
```

---

### **2️⃣ Edge Function: `generate-invite`** (TypeScript en Deno)

**Ubicación:** Supabase Cloud (servidor)

**Qué hace:**
```
Usuario pulsa "Invitar" → App llama a generate-invite → Edge Function
                                                              ↓
                                                    1. Verifica que eres el owner
                                                    2. Genera JWT con:
                                                       {aud: group_id, exp: timestamp}
                                                    3. Firma el token con secreto
                                                    4. Construye deep link:
                                                       sento://invite/xxx?t=yyy
                                                    5. Retorna URL y fecha de expiración
```

**Se ejecuta desde la app:**
```typescript
await supabase.functions.invoke('generate-invite', {
  body: { group_id: 'abc-123' }
})
```

---

### **3️⃣ Servicio: `invites.service.ts`** (TypeScript en la app)

**Ubicación:** `src/services/invites.service.ts`

**Qué hace:**
```
Proporciona funciones fáciles de usar desde tus componentes:

generateInvite(options)
  → Llama a la Edge Function
  → Retorna: { url, expires_at, token }

joinGroup(options)
  → Llama a la RPC Function
  → Retorna: Group completo

decodeInviteToken(token)
  → Lee info del token SIN validarlo
  → Útil para preview
```

**Se usa en componentes React Native:**
```typescript
import { generateInvite } from '@/services/invites.service';

const invite = await generateInvite({ groupId: '...' });
console.log(invite.url); // sento://invite/...
```

---

## 🎯 **FLUJO COMPLETO (Cómo funciona todo junto):**

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: GENERAR INVITACIÓN                                   │
└─────────────────────────────────────────────────────────────┘

[Usuario A - Owner del grupo]
  │
  ├─ Pulsa "Invitar"
  │
  ├─ App llama: generateInvite({ groupId: 'xxx' })
  │               │
  │               └─ Llama Edge Function: generate-invite
  │                              │
  │                              ├─ Verifica: ¿Es owner? ✓
  │                              ├─ Genera JWT firmado
  │                              └─ Retorna: sento://invite/xxx?t=eyJ...
  │
  └─ Usuario A comparte link por WhatsApp


┌─────────────────────────────────────────────────────────────┐
│ PASO 2: ACEPTAR INVITACIÓN                                   │
└─────────────────────────────────────────────────────────────┘

[Usuario B - Amigo invitado]
  │
  ├─ Abre link: sento://invite/xxx?t=eyJ...
  │
  ├─ App extrae: groupId = 'xxx', token = 'eyJ...'
  │
  ├─ App llama: joinGroup({ groupId: 'xxx', token: 'eyJ...' })
  │               │
  │               └─ Llama RPC: join_group(groupId, token)
  │                              │
  │                              ├─ Decodifica token ✓
  │                              ├─ Verifica grupo ✓
  │                              ├─ Verifica expiración ✓
  │                              ├─ INSERT INTO group_members
  │                              └─ Retorna grupo completo
  │
  └─ ¡Usuario B ahora es miembro del grupo! 🎉
```

---

## 🎓 **CONCEPTOS QUE APRENDISTE:**

### **JWT (JSON Web Token)**
Es como un "ticket digital" firmado:
```
Partes:
  1. Header: {alg: "HS256", typ: "JWT"}
  2. Payload: {aud: "group-id", exp: 1234567890}
  3. Signature: Firma criptográfica

Formato: xxxxx.yyyyy.zzzzz

Ventaja: No necesitas guardarlo en la base de datos
```

### **Edge Functions**
Mini-servidores en la nube de Supabase:
```
- Escritos en TypeScript/JavaScript
- Corren en Deno (como Node.js pero más seguro)
- Se llaman con peticiones HTTP
- Tienen variables de entorno automáticas
```

### **RPC Functions**
Funciones SQL que viven en la base de datos:
```
- Escritas en PL-pgSQL (lenguaje de PostgreSQL)
- Se llaman con: supabase.rpc('nombre', params)
- Acceso directo a tablas
- Muy rápidas para operaciones complejas
```

### **Deep Links**
URLs especiales que abren tu app:
```
Formato: sento://ruta/params
Ejemplo: sento://invite/abc-123?t=eyJ...

Cuando el usuario abre el link:
  → El sistema operativo detecta "sento://"
  → Abre tu app automáticamente
  → La app lee los parámetros
```

---

## ✅ **¿COMPLETASTE TODO?**

Si marcaste los 3 ítems del checklist en el Paso 3.2:

🎉 **¡FELICIDADES! FASE 6 COMPLETADA** 🎉

**Dime:** "Listo, completé la Fase 6"

Y te explicaré qué sigue (Fase 7: Frontend de Invitaciones)

---

## 🆘 **¿NECESITAS AYUDA?**

**Si algo salió mal, dime:**
- En qué paso estás
- Qué comando ejecutaste
- Qué error te salió (copia el mensaje completo)

**Preguntas comunes:**

❓ **"No entiendo qué es un JWT"**
→ Es como un ticket de cine: tiene info (película, hora, sala) y una firma que no se puede falsificar.

❓ **"¿Por qué necesitamos Edge Function Y RPC?"**
→ Edge Function: Genera el ticket (puede hacer operaciones complejas, firmar, etc.)
→ RPC: Verifica el ticket y deja entrar (acceso directo a la base de datos)

❓ **"El comando supabase no funciona"**
→ Cierra y vuelve a abrir PowerShell (a veces necesita reiniciarse)

❓ **"Me da error de contraseña al linkear"**
→ Es la contraseña de la BASE DE DATOS (no de tu cuenta Supabase)
→ La encuentras en: Settings > Database > Database Password

---

## 🚀 **PRÓXIMAMENTE: FASE 7**

Cuando estés listo, en la Fase 7 crearemos:
- 🎨 Botón "Invitar" en pantalla de grupo
- 💬 Modal para compartir por WhatsApp
- 🔗 Deep linking (abrir app desde links)
- 🎯 Pantalla de aceptar invitación

**¡Casi terminamos el sistema de invitaciones! 💪**

