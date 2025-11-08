// =====================================================
// EDGE FUNCTION: generate-invite
// =====================================================
// Esta función genera un token JWT de invitación para
// unirse a un grupo. Solo el owner del grupo puede generarlo.
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// =====================================================
// CONCEPTOS:
// =====================================================
// JWT (JSON Web Token): Token firmado digitalmente que contiene:
//   - aud (audience): ID del grupo
//   - exp (expiration): Timestamp de expiración
//   - iat (issued at): Timestamp de creación
//
// Deep Link: URL que abre la app directamente en una pantalla específica
//   Formato: sento://invite/GROUP_ID?t=TOKEN_JWT
// =====================================================

// Interfaz para el body de la request
interface RequestBody {
  group_id: string;
  expires_in?: number; // Segundos hasta expiración (default 7 días)
}

// Interfaz para la respuesta
interface InviteResponse {
  url: string;
  expires_at: string;
  token: string; // Útil para debugging
}

serve(async (req: Request) => {
  // =====================================================
  // 1. CONFIGURACIÓN Y VALIDACIÓN INICIAL
  // =====================================================
  
  // Solo permitir método POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // =====================================================
    // 2. OBTENER Y VALIDAR TOKEN DE AUTENTICACIÓN
    // =====================================================
    
    // Extraer el token de Supabase del header Authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado - falta token de autenticación" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // El token viene en formato: "Bearer eyJhbGc..."
    const token = authHeader.replace("Bearer ", "");

    // =====================================================
    // 3. CREAR CLIENTE DE SUPABASE
    // =====================================================
    
    // Obtener las variables de entorno de Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuración de Supabase no encontrada");
    }

    // Crear cliente autenticado con el token del usuario
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verificar que el usuario está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token de autenticación inválido" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // =====================================================
    // 4. PARSEAR Y VALIDAR REQUEST BODY
    // =====================================================
    
    const body: RequestBody = await req.json();
    const { group_id, expires_in = 604800 } = body; // Default: 7 días

    if (!group_id) {
      return new Response(
        JSON.stringify({ error: "group_id es requerido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // =====================================================
    // 5. VERIFICAR QUE EL USUARIO ES OWNER DEL GRUPO
    // =====================================================
    
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, owner_id, name, type")
      .eq("id", group_id)
      .single();

    if (groupError || !group) {
      return new Response(
        JSON.stringify({ error: "Grupo no encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verificar que el usuario actual es el owner
    if (group.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ 
          error: "No autorizado - solo el organizador puede generar invitaciones" 
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // =====================================================
    // 6. GENERAR TOKEN JWT
    // =====================================================
    
    // Obtener el secreto JWT de Supabase
    const jwtSecret = Deno.env.get("JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("JWT_SECRET no configurado");
    }

    // Crear el payload del JWT
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + expires_in;

    const payload = {
      aud: group_id, // Audience: ID del grupo
      exp: expiresAt, // Expiration: Timestamp de expiración
      iat: now, // Issued at: Timestamp de creación
      iss: "sento-app", // Issuer: Nuestra app
    };

    // Firmar el token con el algoritmo HS256
    // HS256 = HMAC con SHA-256 (firma simétrica con secreto compartido)
    // Convertir el secret a formato TextEncoder para djwt
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const inviteToken = await create(
      { alg: "HS256", typ: "JWT" },
      payload,
      key
    );

    // =====================================================
    // 7. CONSTRUIR DEEP LINK
    // =====================================================
    
    // Deep link format: sento://invite/GROUP_ID?t=TOKEN
    // Cuando el usuario abre este link, la app se abre en la pantalla de invitación
    const deepLink = `sento://invite/${group_id}?t=${inviteToken}`;

    // =====================================================
    // 8. RETORNAR RESPUESTA
    // =====================================================
    
    const response: InviteResponse = {
      url: deepLink,
      expires_at: new Date(expiresAt * 1000).toISOString(),
      token: inviteToken,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    // =====================================================
    // MANEJO DE ERRORES
    // =====================================================
    
    console.error("Error generando invitación:", error);

    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

// =====================================================
// EXPLICACIÓN DE CONCEPTOS:
// =====================================================
//
// 1. DENO: Runtime de JavaScript/TypeScript (como Node.js)
//    - Más seguro (permisos explícitos)
//    - Usa URLs para imports (esm.sh, deno.land)
//    - Usado por Supabase Edge Functions
//
// 2. JWT (JSON Web Token):
//    - Header: Algoritmo y tipo (HS256, JWT)
//    - Payload: Datos (aud, exp, iat)
//    - Signature: Firma criptográfica
//    - Formato final: xxxxx.yyyyy.zzzzz
//
// 3. HS256: HMAC-SHA256
//    - Algoritmo de firma simétrica
//    - Usa un secreto compartido (SUPABASE_JWT_SECRET)
//    - Rápido y seguro para tokens de corta duración
//
// 4. Deep Link:
//    - URL especial que abre la app
//    - sento://invite/... → abre pantalla de invitación
//    - Se configura en app.json
//
// 5. Variables de entorno automáticas en Edge Functions:
//    - SUPABASE_URL: URL de tu proyecto
//    - SUPABASE_ANON_KEY: Llave pública
//    - SUPABASE_JWT_SECRET: Secreto para firmar tokens
//      (se encuentra en Settings > API > JWT Secret)
//
// =====================================================

