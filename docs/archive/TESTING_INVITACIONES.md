# 🧪 TEST DE INVITACIONES (Sin Deep Links Clickables)

## ✅ **Problema Resuelto**
Deep links `sento://` funcionan ✅ pero NO son clickables en email/SMS/navegadores.

**Solución:** Pantalla de testing para pegar groupId y token manualmente.

---

## 🚀 **Cómo Probar (2 Opciones)**

### **Opción 1: Con Logout (Simula 2 usuarios)**

```
USUARIO A (Cuenta actual):
1. Home → Crear nuevo grupo "Test Invite"
2. Entrar al grupo
3. Botón "👥 Invitar"
4. Botón "📋 Ver Group ID y Token"
5. Copiar Group ID (primer botón)
6. Copiar Token (segundo botón)
7. Cerrar modal → Logout

USUARIO B (Nueva cuenta):
8. Registrar nueva cuenta
9. Home → "🧪 Test: Unirse a Grupo"
10. Pegar Group ID
11. Pegar Token
12. "Unirse al Grupo"
✅ Debe decir: "Te uniste a Test Invite"

VERIFICAR:
13. Login con Usuario A
14. Entrar grupo "Test Invite"
15. Ver miembros → Usuario B debe aparecer ✅
```

---

### **Opción 2: Con 2 Móviles/APKs**

```
MÓVIL A:
1. Crear grupo
2. Invitar → Ver Group ID y Token
3. Compartir por cualquier app (copiar texto)

MÓVIL B:
4. Recibir mensaje (texto plano)
5. Copiar Group ID manualmente
6. Copiar Token manualmente
7. Home → Test: Unirse a Grupo
8. Pegar ambos
9. Unirse
```

---

## 📋 **Nueva Feature: Pantalla Test Join**

**Ubicación:** Home → Botón "🧪 Test: Unirse a Grupo"

**Función:**
- Campos para pegar groupId y token por separado
- Llama `joinGroup()` directamente
- Navega al grupo tras unirse
- **Solo para testing/desarrollo**

**Ventajas:**
- ✅ No necesitas deep links clickables
- ✅ Funciona con logout + nueva cuenta
- ✅ Funciona entre múltiples dispositivos
- ✅ Puedes probar todo el flujo de invitaciones

---

## 🎯 **Extraer Group ID y Token**

**En el modal de invitación:**

1. Generar invitación
2. Botón **"📋 Ver Group ID y Token"**
3. Alert muestra ambos
4. Botones para copiar cada uno por separado

**Link generado:**
```
sento://invite/GROUP_ID?t=TOKEN
              ^^^^^^^^     ^^^^^
              Copiar      Copiar
```

---

## ✅ **Verificar que Funcionó**

### **Test Completo:**

```
1. Usuario A crea grupo "París 2025"
2. Usuario A genera invitación
3. Usuario A copia groupId y token
4. Usuario B (nueva cuenta) usa Test Join
5. Usuario B pega groupId y token
6. Usuario B se une exitosamente
7. Usuario A ve a B en miembros del grupo ✅
8. Usuario B ve grupo "París 2025" en su lista ✅
```

---

## 🚀 **Siguiente: Test Multi-Usuario Real**

Una vez que esto funciona, puedes probar:

- [ ] Usuario B sube documentos
- [ ] Usuario B comparte con grupo
- [ ] Usuario A ve documentos de B
- [ ] Usuario A solicita documentos
- [ ] Usuario B aprueba solicitudes
- [ ] Ambos ven logs de acceso

**Todo desde Test Join sin necesidad de deep links clickables.**

---

## 💡 **En Producción (Futuro)**

Para que deep links sean clickables:

**Opción 1:** Universal Links (recomendado)
- Comprar dominio `sento.app`
- Links: `https://sento.app/invite/...`
- Clickables en cualquier app
- Requiere configuración `.well-known`

**Opción 2:** App Links (Android only)
- Similar a Universal Links
- Solo funciona en Android
- Gratis

**Por ahora:** Test Join es suficiente para MVP y desarrollo.

