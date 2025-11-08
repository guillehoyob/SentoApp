// =====================================================
// SERVICIO: Invitaciones
// =====================================================
// Este servicio maneja la generación y aceptación de
// invitaciones para unirse a grupos
// =====================================================

import { supabase } from './supabase';
import { Group } from '../types/groups.types';

// =====================================================
// INTERFACES
// =====================================================

/**
 * Respuesta al generar una invitación
 */
export interface GenerateInviteResponse {
  url: string;          // Deep link completo: sento://invite/xxx?t=yyy
  expires_at: string;   // ISO timestamp de cuándo expira
  token: string;        // Token JWT (útil para debugging)
}

/**
 * Opciones para generar invitación
 */
export interface GenerateInviteOptions {
  groupId: string;
  expiresIn?: number;   // Segundos hasta expiración (default: 7 días)
}

/**
 * Opciones para unirse a un grupo
 */
export interface JoinGroupOptions {
  groupId: string;
  token: string;
}

// =====================================================
// CONSTANTES
// =====================================================

const SEVEN_DAYS_IN_SECONDS = 604800;

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Genera un link de invitación para un grupo
 * 
 * FLUJO:
 * 1. Verifica que el usuario esté autenticado
 * 2. Llama a la Edge Function generate-invite
 * 3. La Edge Function verifica que eres owner del grupo
 * 4. Genera un JWT con el ID del grupo y expiración
 * 5. Retorna un deep link que abre la app
 * 
 * @param options - Opciones de invitación
 * @returns Objeto con URL, fecha de expiración y token
 * @throws Error si no está autenticado o no tiene permisos
 * 
 * EJEMPLO:
 * ```typescript
 * const invite = await generateInvite({ 
 *   groupId: 'uuid-del-grupo',
 *   expiresIn: 86400  // 1 día
 * });
 * 
 * console.log(invite.url);
 * // Output: sento://invite/uuid-del-grupo?t=eyJhbG...
 * ```
 */
export async function generateInvite(
  options: GenerateInviteOptions
): Promise<GenerateInviteResponse> {
  // 1. Verificar autenticación
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('Debes iniciar sesión para generar invitaciones');
  }

  // 2. Llamar a la Edge Function
  // NOTA: Las Edge Functions se llaman con supabase.functions.invoke()
  const { data, error } = await supabase.functions.invoke<GenerateInviteResponse>(
    'generate-invite',
    {
      body: {
        group_id: options.groupId,
        expires_in: options.expiresIn || SEVEN_DAYS_IN_SECONDS,
      },
    }
  );

  // 3. Manejo de errores
  if (error) {
    console.error('Error generando invitación:', error);
    throw new Error(error.message || 'Error al generar invitación');
  }

  if (!data) {
    throw new Error('No se recibió respuesta de la función de invitación');
  }

  return data;
}

/**
 * Une al usuario actual a un grupo usando un token de invitación
 * 
 * FLUJO:
 * 1. Verifica que el usuario esté autenticado
 * 2. Llama a la RPC function join_group en Supabase
 * 3. La función verifica que el token sea válido
 * 4. Añade al usuario como miembro del grupo
 * 5. Retorna el grupo completo con todos sus miembros
 * 
 * @param options - ID del grupo y token de invitación
 * @returns Grupo completo con información de miembros
 * @throws Error si el token es inválido, expiró, o ya eres miembro
 * 
 * EJEMPLO:
 * ```typescript
 * try {
 *   const group = await joinGroup({
 *     groupId: 'uuid-del-grupo',
 *     token: 'eyJhbG...'
 *   });
 *   console.log(`Te uniste a: ${group.name}`);
 * } catch (error) {
 *   if (error.message.includes('expirado')) {
 *     alert('Este link de invitación ya expiró');
 *   }
 * }
 * ```
 */
export async function joinGroup(options: JoinGroupOptions): Promise<Group> {
  // 1. Verificar autenticación
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('Debes iniciar sesión para unirte a un grupo');
  }

  // 2. Llamar a la RPC function
  // NOTA: Las RPC functions se llaman con supabase.rpc()
  const { data, error } = await supabase.rpc('join_group', {
    p_group_id: options.groupId,
    p_invite_token: options.token,
  });

  // 3. Manejo de errores específicos
  if (error) {
    console.error('Error uniéndose al grupo:', error);

    // Mapear códigos SQL a mensajes amigables
    if (error.code === '23505') {
      throw new Error('Ya eres miembro de este grupo');
    }
    if (error.code === '22023') {
      throw new Error('Token de invitación inválido o expirado');
    }
    if (error.code === '42704') {
      throw new Error('Grupo no encontrado');
    }
    if (error.code === '42501') {
      throw new Error('Debes iniciar sesión');
    }

    throw new Error(error.message || 'Error al unirse al grupo');
  }

  if (!data) {
    throw new Error('No se recibió respuesta al unirse al grupo');
  }

  // 4. Retornar el grupo parseado
  return data as Group;
}

/**
 * Verifica si un token de invitación es válido sin unirse al grupo
 * 
 * ÚTIL PARA:
 * - Mostrar preview del grupo antes de aceptar
 * - Verificar que el link no ha expirado
 * - Mostrar mensaje amigable si el token es inválido
 * 
 * @param token - Token JWT de invitación
 * @returns Objeto con información del token
 * 
 * EJEMPLO:
 * ```typescript
 * const info = decodeInviteToken('eyJhbG...');
 * if (info.expired) {
 *   alert('Este link ya expiró');
 * } else {
 *   console.log(`Invitación para grupo: ${info.groupId}`);
 *   console.log(`Expira: ${new Date(info.expiresAt * 1000)}`);
 * }
 * ```
 */
export function decodeInviteToken(token: string): {
  groupId: string;
  expiresAt: number;
  expired: boolean;
} | null {
  try {
    // JWT tiene formato: header.payload.signature
    // Solo necesitamos el payload (parte 2)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decodificar el payload Base64URL
    const payload = JSON.parse(atob(parts[1]));

    const now = Math.floor(Date.now() / 1000);

    return {
      groupId: payload.aud,
      expiresAt: payload.exp,
      expired: payload.exp < now,
    };
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
}

// =====================================================
// EXPLICACIÓN DE CONCEPTOS:
// =====================================================
//
// 1. Edge Function vs RPC Function:
//    Edge Function:
//      - Código TypeScript/JavaScript
//      - Corre en Deno (runtime de Supabase)
//      - Se invoca con: supabase.functions.invoke()
//      - Uso: Lógica compleja, integraciones, generación de tokens
//    
//    RPC Function:
//      - Código SQL/PL-pgSQL
//      - Corre en PostgreSQL
//      - Se invoca con: supabase.rpc()
//      - Uso: Operaciones de base de datos, validaciones
//
// 2. JWT Decode:
//    - atob() decodifica Base64 a string
//    - No verifica la firma (eso lo hace el servidor)
//    - Útil para leer datos sin hacer request
//
// 3. Error Handling:
//    - Cada función SQL puede retornar códigos específicos
//    - Los mapeamos a mensajes amigables
//    - El usuario ve: "Token expirado" en vez de "ERRCODE 22023"
//
// 4. TypeScript Generics:
//    - supabase.functions.invoke<TipoDeRespuesta>()
//    - Nos da autocompletado y type safety
//
// =====================================================

