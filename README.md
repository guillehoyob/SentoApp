# Sento - React Native App

Aplicación React Native desarrollada con Expo SDK 54 y TypeScript.

## Requisitos Previos

- **Node.js**: >= 20.17.0 (se recomienda >= 20.19.4)
- **npm**: >= 10.8.1
- **Expo CLI**: Instalado globalmente o usando npx
- **Expo Go**: App instalada en tu dispositivo móvil (iOS o Android)

## Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd app_composer
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales de Supabase
# SUPABASE_URL=tu_url_aqui
# SUPABASE_ANON_KEY=tu_key_aqui
```

## Desarrollo

Iniciar el servidor de desarrollo:
```bash
npm start
```

O con comandos específicos:
```bash
npm run android  # Para Android
npm run ios       # Para iOS
npm run web       # Para web
```

Escanea el código QR con Expo Go en tu dispositivo móvil.

## Estructura del Proyecto

```
app_composer/
├── app/                    # Rutas con Expo Router
│   ├── _layout.tsx        # Layout principal
│   └── index.tsx          # Pantalla principal
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── services/          # Lógica de negocio (supabase, storage)
│   ├── types/             # Definiciones TypeScript
│   ├── utils/             # Helpers y utilidades
│   └── constants/         # Constantes y configuración
├── assets/                # Imágenes y recursos
├── app.json               # Configuración de Expo
└── package.json           # Dependencias del proyecto
```

## Dependencias Principales

- **expo**: ~54.0.20
- **react-native**: 0.81.5
- **expo-router**: ~6.0.14 (Rutas)
- **@react-native-async-storage/async-storage**: 2.2.0 (Almacenamiento local)
- **expo-linking**: ~8.0.8 (Deep linking)
- **react-native-screens**: ~4.16.0
- **react-native-safe-area-context**: ~5.6.0
- **TypeScript**: ~5.9.2

## Configuración

- **Scheme**: sento
- **Nombre de la app**: Sento
- **Orientación**: Portrait
- **SDK**: Expo SDK 54

## Almacenamiento

Este proyecto usa **AsyncStorage** en lugar de MMKV para compatibilidad con Expo Go.

## Próximos Pasos

- Integración con Supabase
- Autenticación de usuarios
- Gestión de datos en tiempo real

