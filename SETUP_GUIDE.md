# 🚀 Guía de Instalación de Sento App

> **¡Bienvenido!** 👋 Esta guía te ayudará a configurar el proyecto paso a paso. Es súper fácil, solo sigue las instrucciones.

---

## 📋 Tabla de Contenidos

- [Requisitos Previos](#-requisitos-previos)
- [Instalación de Git](#-paso-1-instalar-git)
- [Instalación de Node.js](#-paso-2-instalar-nodejs)
- [Clonar el Repositorio](#-paso-3-clonar-el-repositorio)
- [Instalar Dependencias](#-paso-4-instalar-dependencias)
- [Configurar Variables de Entorno](#-paso-5-configurar-variables-de-entorno)
- [Ejecutar la App](#-paso-6-ejecutar-la-app)
- [Solución de Problemas](#-solución-de-problemas)

---

## 🎯 Requisitos Previos

Necesitarás:
- **Git** - Para clonar el repositorio
- **Node.js** v20.17.0 o superior - Runtime de JavaScript
- **VS Code o Cursor** - Editor de código
- **Expo Go** - App en tu móvil (descárgala de App Store o Google Play)

---

## 🔧 PASO 1: Instalar Git

### Para Windows 🪟

1. **Descarga Git:**
   - Ve a: https://git-scm.com/download/win
   - Descarga el instalador (64-bit Git for Windows Setup)

2. **Instala Git:**
   - Ejecuta el archivo descargado
   - Deja todas las opciones por defecto
   - Click en "Next" hasta "Install"

3. **Verifica la instalación:**
   - Abre **VS Code** o **Cursor**
   - Abre la terminal: `Ctrl + J` o desde menú: `Terminal > New Terminal`
   - Ejecuta:
   ```bash
   git --version
   ```

   **✅ Output esperado:**
   ```
   git version 2.43.0 (o superior)
   ```

   **❌ Si ves un error:**
   - Cierra y vuelve a abrir VS Code/Cursor
   - Si persiste, reinicia tu PC

---

### Para Mac 🍎

1. **Abre Terminal:**
   - Presiona `Cmd + Espacio`
   - Escribe "Terminal" y presiona Enter

2. **Instala Homebrew (si no lo tienes):**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

   **✅ Output esperado:**
   ```
   Installation successful!
   ```

3. **Instala Git:**
   ```bash
   brew install git
   ```

   **✅ Output esperado:**
   ```
   🍺  /opt/homebrew/Cellar/git/2.43.0: XX files, XXX.XMB
   ```

4. **Verifica la instalación:**
   ```bash
   git --version
   ```

   **✅ Output esperado:**
   ```
   git version 2.43.0 (o superior)
   ```

---

## 📦 PASO 2: Instalar Node.js

### Para Windows 🪟

1. **Descarga Node.js:**
   - Ve a: https://nodejs.org/
   - Descarga la versión **LTS** (recomendada)

2. **Instala Node.js:**
   - Ejecuta el instalador
   - Click en "Next" hasta "Install"
   - Marca la opción "Automatically install necessary tools"

3. **Verifica la instalación:**
   - Abre una **nueva terminal** en VS Code/Cursor
   - Ejecuta:
   ```bash
   node --version
   npm --version
   ```

   **✅ Output esperado:**
   ```
   v20.17.0 (o superior)
   10.8.1 (o superior)
   ```

---

### Para Mac 🍎

1. **Instala Node.js con Homebrew:**
   ```bash
   brew install node@20
   ```

   **✅ Output esperado:**
   ```
   🍺  /opt/homebrew/Cellar/node@20/20.17.0: XX files, XXX.XMB
   ```

2. **Verifica la instalación:**
   ```bash
   node --version
   npm --version
   ```

   **✅ Output esperado:**
   ```
   v20.17.0 (o superior)
   10.8.1 (o superior)
   ```

---

## 📂 PASO 3: Clonar el Repositorio

1. **Abre VS Code o Cursor**

2. **Abre la terminal:** `Ctrl + J` (Windows) o `Cmd + J` (Mac)

3. **Navega a donde quieres guardar el proyecto:**
   
   **Windows:**
   ```bash
   cd C:\Users\TuUsuario\Desktop
   ```

   **Mac:**
   ```bash
   cd ~/Desktop
   ```

4. **Clona el repositorio:**
   ```bash
   git clone https://github.com/guillehoyob/SentoApp.git
   ```

   **✅ Output esperado:**
   ```
   Cloning into 'SentoApp'...
   remote: Enumerating objects: XX, done.
   remote: Counting objects: 100% (XX/XX), done.
   remote: Compressing objects: 100% (XX/XX), done.
   Receiving objects: 100% (XX/XX), XX.XX MiB | XX.XX MiB/s, done.
   Resolving deltas: 100% (XX/XX), done.
   ```

5. **Entra a la carpeta del proyecto:**
   ```bash
   cd SentoApp
   ```

6. **Cambia a la rama `development`:**
   ```bash
   git checkout development
   ```

   **✅ Output esperado:**
   ```
   Switched to branch 'development'
   Your branch is up to date with 'origin/development'.
   ```

7. **Abre el proyecto en VS Code/Cursor:**
   
   **Desde la terminal:**
   ```bash
   code .
   ```
   o
   ```bash
   cursor .
   ```

   **Manualmente:**
   - `File > Open Folder...`
   - Selecciona la carpeta `SentoApp`

---

## 📚 PASO 4: Instalar Dependencias

1. **Asegúrate de estar en la carpeta del proyecto:**
   - En la terminal, deberías ver: `C:\Users\...\SentoApp>` (Windows) o `~/Desktop/SentoApp %` (Mac)

2. **Instala todas las dependencias:**
   ```bash
   npm install
   ```

   **⏳ Esto tomará 2-5 minutos dependiendo de tu conexión**

   **✅ Output esperado:**
   ```
   added 1296 packages, and audited 1296 packages in 2m

   177 packages are looking for funding
     run `npm fund` for details

   16 vulnerabilities (4 low, 12 moderate)

   To address issues that do not require attention, run:
     npm audit fix

   To address all issues (including breaking changes), run:
     npm audit fix --force

   Run `npm audit` for details.
   ```

   **⚠️ NOTA:** Los warnings de vulnerabilidades son normales y no afectan el desarrollo.

---

## 🔐 PASO 5: Configurar Variables de Entorno

1. **Copia el archivo de ejemplo:**

   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```

   **Mac/Linux:**
   ```bash
   cp .env.example .env
   ```

2. **Edita el archivo `.env`:**
   - Abre el archivo `.env` en VS Code/Cursor
   - No necesitas modificar nada por ahora (las credenciales ya están configuradas)

   **✅ El archivo debería verse así:**
   ```
   SUPABASE_URL=https://iybjzqtiispacfmmynsx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 🎉 PASO 6: Ejecutar la App

1. **Inicia el servidor de Expo:**
   ```bash
   npx expo start --clear
   ```

   **⏳ Espera 15-30 segundos...**

   **✅ Output esperado:**
   ```
   Starting project at C:\Users\...\SentoApp

   Starting Metro Bundler
   
   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
   █ ▄▄▄▄▄ █▀█ █▄▀▀▄█ ▄▄▄▄▄ █
   █ █   █ █▀▀▀█ ▀▄▀█ █   █ █
   █ █▄▄▄█ █▀ █▀▀ ▀██ █▄▄▄█ █
   █▄▄▄▄▄▄▄█▄▀ ▀▄█ █▄█▄▄▄▄▄▄▄█
   █  ▄ █▀▄ ▄▀▄▀▀▄▄▀▀█▀▀█▄▀▄▄█
   ...
   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

   › Metro waiting on exp://192.168.1.X:8081
   › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

   › Press a │ open Android
   › Press i │ open iOS simulator
   › Press w │ open web

   › Press j │ open debugger
   › Press r │ reload app
   › Press m │ toggle menu
   › Press o │ open project code in your editor

   › Press ? │ show all commands

   Logs for your project will appear below. Press Ctrl+C to exit.
   ```

2. **Escanea el QR con tu móvil:**

   **Para Android 📱:**
   - Abre **Expo Go**
   - Toca "Scan QR code"
   - Apunta al QR en la terminal

   **Para iOS 📱:**
   - Abre la **Cámara** nativa
   - Apunta al QR
   - Toca la notificación "Open in Expo Go"

3. **Espera a que se genere el bundle:**
   
   **⏳ Primera vez: 30-60 segundos**

   **✅ Output esperado en la terminal:**
   ```
   Android Bundled 45123ms C:\Users\...\SentoApp\node_modules\expo-router\entry.js (1448 modules)
   ```

4. **¡La app debería abrirse en tu móvil! 🎉**

---

## 🧪 PASO 7: Probar Gluestack UI (OPCIONAL)

1. **Una vez que la app esté abierta:**
   - Verás la pantalla de inicio
   - Busca el botón **"Gluestack UI Demo" 🎨**
   - Tócalo para ver todos los componentes funcionando

2. **Deberías ver:**
   - ✅ Botones con diferentes colores y tamaños
   - ✅ Inputs funcionales
   - ✅ Badges con diferentes estilos
   - ✅ Todo estilizado con Gluestack UI v2

---

## 🐛 Solución de Problemas

### Error: "comando no encontrado" o "command not found"

**Problema:** Git, Node, o npm no se encuentran.

**Solución:**
1. Cierra y vuelve a abrir VS Code/Cursor
2. Si persiste, reinicia tu computadora
3. Verifica que los instaladores se ejecutaron correctamente

---

### Error: "puerto 8081 ya está en uso"

**Problema:** Hay otro servidor de Expo corriendo.

**Solución (Windows):**
```powershell
netstat -ano | findstr :8081
taskkill /PID [número_del_PID] /F
```

**Solución (Mac):**
```bash
lsof -ti:8081 | xargs kill -9
```

Luego ejecuta de nuevo:
```bash
npx expo start --clear
```

---

### Error: "Cannot resolve module"

**Problema:** Faltan dependencias o hay problemas de caché.

**Solución:**
```bash
# Borra node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

---

### Error: "Unable to resolve @/components/ui/button"

**Problema:** El alias `@/` no está configurado correctamente.

**Solución:** Este problema ya está resuelto en la rama `development`. Asegúrate de estar en esa rama:
```bash
git branch --show-current
```

Si no dice `development`, ejecuta:
```bash
git checkout development
```

---

### La app no carga en el móvil

**Problema:** El móvil y la PC no están en la misma red WiFi.

**Solución:**
1. Verifica que ambos dispositivos estén en la **misma red WiFi**
2. Si usas VPN, desactívala temporalmente
3. Prueba con el modo "Tunnel" en Expo:
   ```bash
   npx expo start --clear --tunnel
   ```

---

### Warnings de "peer dependencies"

**Problema:** Mensajes amarillos durante `npm install`.

**Solución:** Estos warnings son **normales** y no afectan el funcionamiento. Puedes ignorarlos.

---

## 📱 Instalar Expo Go

### Android
1. Abre **Google Play Store**
2. Busca "Expo Go"
3. Instala la app

### iOS
1. Abre **App Store**
2. Busca "Expo Go"
3. Instala la app

---

## 🎓 Comandos Útiles

```bash
# Iniciar el servidor (limpiando caché)
npx expo start --clear

# Iniciar solo para Android
npx expo start --android

# Iniciar solo para iOS
npx expo start --ios

# Ver ramas disponibles
git branch -a

# Ver estado actual de Git
git status

# Actualizar desde GitHub
git pull origin development

# Ver versión de Node
node --version

# Ver versión de npm
npm --version

# Limpiar caché de npm
npm cache clean --force
```

---

## 🆘 ¿Aún tienes problemas?

1. **Copia el error completo** que aparece en la terminal
2. **Envíaselo a una IA** (ChatGPT, Claude, etc.) con este mensaje:
   ```
   Estoy configurando Sento App y me sale este error:
   
   [PEGA AQUÍ EL ERROR]
   
   Estoy usando:
   - Sistema operativo: [Windows/Mac]
   - Node version: [ejecuta: node --version]
   - npm version: [ejecuta: npm --version]
   ```

3. **Sigue las instrucciones** que te dé la IA

---

## 🎯 Stack Tecnológico

Este proyecto usa:
- **Expo SDK 51** - Framework de React Native
- **React Native 0.74.5** - Framework móvil
- **TypeScript** - Lenguaje tipado
- **Gluestack UI v2** - Librería de componentes UI
- **NativeWind v4** - Tailwind CSS para React Native
- **Supabase** - Backend y base de datos
- **Expo Router** - Navegación basada en archivos

---

## 📚 Recursos Adicionales

- [Documentación de Expo](https://docs.expo.dev/)
- [Documentación de Gluestack UI v2](https://v2.gluestack.io/)
- [Documentación de NativeWind](https://www.nativewind.dev/)
- [Documentación de Supabase](https://supabase.com/docs)

---

## ✅ Checklist de Instalación

Marca cada paso cuando lo completes:

- [ ] Git instalado y verificado
- [ ] Node.js instalado y verificado
- [ ] Repositorio clonado
- [ ] Rama `development` activa
- [ ] Dependencias instaladas con `npm install`
- [ ] Archivo `.env` configurado
- [ ] Servidor de Expo iniciado con `npx expo start --clear`
- [ ] QR escaneado y app abierta en el móvil
- [ ] Demo de Gluestack UI probada

---

## 🎉 ¡Felicidades!

Si llegaste hasta aquí y todo funciona, **¡ya tienes Sento App corriendo! 🚀**

Ahora puedes empezar a desarrollar y probar la aplicación.

**¡Happy coding!** 👨‍💻👩‍💻

---

**Creado con ❤️ para hacer tu vida más fácil**

_Si encontraste útil esta guía, dale una ⭐ al repo_

