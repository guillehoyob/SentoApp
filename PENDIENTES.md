# Pendientes

## OAuth con Google

### Configuración en Google Cloud Console
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccionar el proyecto o crear uno nuevo
3. Habilitar "Google+ API" en APIs & Services
4. Crear credenciales OAuth 2.0:
   - Tipo: Web application
   - Authorized redirect URIs:
     - `http://localhost:8081`
     - `http://localhost:8081/auth/callback`
     - `https://iybjzqtiispacfmmynsx.supabase.co/auth/v1/callback`
5. Copiar Client ID y Client Secret

### Configuración en Supabase
1. Dashboard → Authentication → Providers → Google
2. Habilitar "Enable Sign in with Google"
3. Pegar Client ID y Client Secret
4. Guardar

### Notas
- El callback URL de Supabase ya está configurado: `https://iybjzqtiispacfmmynsx.supabase.co/auth/v1/callback`
- Para desarrollo local, agregar `http://localhost:8081` y `http://localhost:8081/auth/callback` en Google Cloud Console
- El flujo funciona así: Usuario → Google → Supabase → App (`/auth/callback`)

## Confirmación de Email

### Opción 1: Deshabilitar (Desarrollo)
- Dashboard → Authentication → Settings → Email Auth
- Desactivar "Enable email confirmations"
- Los usuarios pueden iniciar sesión inmediatamente después de registrarse

### Opción 2: Habilitar con servicio de email local (Desarrollo)
1. Usar servicio como [Mailtrap](https://mailtrap.io/) o [MailHog](https://github.com/mailhog/MailHog)
2. Configurar SMTP en Supabase:
   - Dashboard → Settings → Auth → SMTP Settings
   - Usar credenciales del servicio de email
3. Los emails de confirmación llegarán al servicio de prueba

### Opción 3: Usar ngrok para producción (Testing)
1. Instalar ngrok: `npm install -g ngrok`
2. Exponer localhost: `ngrok http 8081`
3. Usar la URL de ngrok en Supabase Redirect URLs
4. Configurar email templates en Supabase con la URL de ngrok

### Notas
- En producción, usar un dominio real y configurar SMTP real
- Los emails de confirmación contienen un link que debe apuntar a la app
- Para mobile, el link debe usar el scheme `sento://` configurado en `app.json`

