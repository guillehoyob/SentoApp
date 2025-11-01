# Checklist y Guía Completa - Autenticación Sento

## ✅ Lo que YA está implementado

### 1. Tipos TypeScript
- ✅ `src/types/auth.types.ts` - Interfaces completas (User, AuthError, AuthResponse, etc.)

### 2. Servicios
- ✅ `src/services/supabase.ts` - Cliente Supabase configurado
- ✅ `src/services/auth.service.ts` - Servicio completo de autenticación con:
  - Validación de email (RFC 5322)
  - Validación de password (mín 8 chars, 1 letra, 1 número)
  - signUp, signIn, signInWithGoogle, signOut, getCurrentUser
  - Manejo de errores descriptivos

### 3. Hooks
- ✅ `src/hooks/useAuth.ts` - Hook personalizado con:
  - Estado de usuario y loading
  - Escucha cambios de sesión (onAuthStateChange)
  - Métodos de autenticación expuestos

### 4. Pantallas
- ✅ `app/auth/login.tsx` - Pantalla de login
- ✅ `app/auth/register.tsx` - Pantalla de registro
- ✅ `app/index.tsx` - Pantalla principal con info del usuario
- ✅ `app/_layout.tsx` - Navegación protegida automática

### 5. Navegación
- ✅ Rutas protegidas automáticamente
- ✅ Redirección automática según estado de autenticación

## 📋 Pasos que TÚ debes hacer en Supabase

### PASO 1: Habilitar Email Auth
1. Ve a **Authentication** → **Providers** en Supabase Dashboard
2. Habilita **Email** si no está habilitado
3. Configura según prefieras:
   - **Enable email confirmations**: Recomendado para producción (deshabilitado para desarrollo rápido)
   - **Secure email change**: Habilitado

### PASO 2: Configurar Google OAuth
1. Ve a **Authentication** → **Providers** → **Google**
2. Habilita Google provider
3. Necesitas crear credenciales en Google Cloud Console:
   - Ve a https://console.cloud.google.com
   - Crea un nuevo proyecto o selecciona uno existente
   - Ve a **APIs & Services** → **Credentials**
   - Crea **OAuth 2.0 Client ID**
   - Tipo: **Web application**
   - **Authorized redirect URIs**: 
     ```
     https://iybjzqtiispacfmmynsx.supabase.co/auth/v1/callback
     ```
   - Copia **Client ID** y **Client Secret**
4. Pega las credenciales en Supabase:
   - **Client ID (for OAuth)**: tu Client ID
   - **Client Secret (for OAuth)**: tu Client Secret

### PASO 3: Configurar URL de redirección
1. En Supabase Dashboard → **Authentication** → **URL Configuration**
2. Agrega en **Redirect URLs**:
   ```
   sento://auth/callback
   exp://localhost:8081/--/auth/callback
   ```

### PASO 4: Verificar política RLS para profiles
La política RLS debería permitir que los usuarios inserten su propio perfil. Si no funciona, ejecuta esto en SQL Editor:

```sql
-- Verificar que la política existe
SELECT * FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile';

-- Si no existe, créala:
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
```

## 🧪 Cómo probar

### Prueba 1: Registro con Email
1. Abre la app
2. Debe redirigirte a `/auth/login`
3. Toca "Regístrate"
4. Completa el formulario:
   - Email válido
   - Contraseña: mínimo 8 caracteres con 1 letra y 1 número
   - Nombre completo
5. Toca "Registrarse"
6. Debe crear la cuenta y redirigir a login

### Prueba 2: Login con Email
1. Usa las credenciales creadas
2. Debe iniciar sesión y redirigir a `/`
3. Debe mostrar tu nombre y email

### Prueba 3: Google OAuth (después de configurar)
1. Toca "Continuar con Google"
2. Debe abrir el navegador/webview
3. Selecciona tu cuenta de Google
4. Debe redirigir de vuelta a la app
5. Debe crear el perfil automáticamente si es primera vez

### Prueba 4: Cerrar Sesión
1. Toca "Cerrar Sesión"
2. Debe redirigir a `/auth/login`

## ⚠️ Problemas Comunes

### Error: "Users can insert own profile" no funciona
- **Causa**: La política RLS puede estar bloqueando la inserción
- **Solución**: Ejecuta el SQL del PASO 4

### Error: Google OAuth no funciona
- **Causa**: Credenciales incorrectas o URL de redirect mal configurada
- **Solución**: Verifica PASO 2 y PASO 3

### Error: Email no se confirma
- **Causa**: Confirmación de email habilitada
- **Solución**: Deshabilita temporalmente en Supabase Dashboard para desarrollo

## 📝 Próximos Pasos (después de validar autenticación)

1. **Servicios para Trips**:
   - Crear servicio para CRUD de viajes
   - Usar función `create_trip` creada en migración
   - Implementar listar, editar, eliminar viajes

2. **Pantallas de Viajes**:
   - Lista de viajes
   - Crear nuevo viaje
   - Detalle de viaje

3. **Gestión de Miembros**:
   - Añadir miembros a viajes
   - Ver miembros de un viaje
   - Eliminar miembros

## 🔍 Validación Final

Cuando completes los pasos de Supabase, marca cada uno:

- [ ] Email Auth habilitado en Supabase
- [ ] Google OAuth configurado con credenciales
- [ ] URLs de redirect configuradas
- [ ] Política RLS para insertar profiles verificada
- [ ] Registro con email funciona
- [ ] Login con email funciona
- [ ] Logout funciona
- [ ] Google OAuth funciona (opcional)

Cuando todo esté validado, avísame y continuamos con los servicios de trips.

