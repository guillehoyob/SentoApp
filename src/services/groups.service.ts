import { supabase } from './supabase';
import type { Group, CreateGroupInput, UpdateGroupInput } from '../types/groups.types';

/**
 * Helper: Verifica si un grupo tipo 'trip' está caducado
 */
export function isGroupExpired(group: Group): boolean {
  if (group.type === 'group') {
    return false; // Los grupos nunca caducan
  }
  
  if (group.type === 'trip' && group.end_date) {
    const endDate = new Date(group.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  }
  
  return false;
}

/**
 * Crea un nuevo grupo
 */
export async function createGroup(data: CreateGroupInput): Promise<Group> {
  // Validar que si type='trip', end_date existe
  if (data.type === 'trip' && !data.end_date) {
    throw new Error('end_date es obligatorio para grupos tipo trip');
  }

  // Validar que si type='group', end_date no existe
  if (data.type === 'group' && data.end_date) {
    throw new Error('end_date no debe existir para grupos tipo group');
  }

  const { data: result, error } = await supabase.rpc('create_group', {
    p_name: data.name,
    p_type: data.type,
    p_start_date: data.start_date,
    p_end_date: data.end_date || null,
    p_destination: data.destination || null,
    p_notes: data.notes || null,
  });

  if (error) {
    throw new Error(error.message || 'Error al crear el grupo');
  }

  if (!result) {
    throw new Error('No se pudo crear el grupo');
  }

  // Cargar el grupo completo con relaciones
  return getGroupById(result.id) as Promise<Group>;
}

/**
 * Obtiene todos los grupos del usuario actual
 */
export async function getMyGroups(): Promise<Group[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Obtener grupos donde el usuario es owner
  const { data: ownedGroups, error: ownedError } = await supabase
    .from('groups')
    .select(`
      *,
      owner:profiles!owner_id(id, email, full_name),
      members:group_members(
        group_id,
        user_id,
        role,
        joined_at,
        user:profiles!group_members_user_id_fkey(id, email, full_name)
      )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (ownedError) {
    throw new Error(ownedError.message || 'Error al obtener los grupos');
  }

  // Obtener IDs de grupos donde el usuario es miembro
  const { data: membershipData, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  if (membershipError) {
    throw new Error(membershipError.message || 'Error al obtener membresías');
  }

  // Si hay grupos donde es miembro (pero no owner), cargarlos
  let memberGroups: any[] = [];
  if (membershipData && membershipData.length > 0) {
    const memberGroupIds = membershipData
      .map(m => m.group_id)
      .filter(id => !ownedGroups?.some(g => g.id === id)); // Excluir los que ya tiene como owner

    if (memberGroupIds.length > 0) {
      const { data: memberGroupsData, error: memberGroupsError } = await supabase
        .from('groups')
        .select(`
          *,
          owner:profiles!owner_id(id, email, full_name),
          members:group_members(
            group_id,
            user_id,
            role,
            joined_at,
            user:profiles!group_members_user_id_fkey(id, email, full_name)
          )
        `)
        .in('id', memberGroupIds)
        .order('created_at', { ascending: false });

      if (!memberGroupsError && memberGroupsData) {
        memberGroups = memberGroupsData;
      }
    }
  }

  // Combinar owned + member groups
  const allGroups = [...(ownedGroups || []), ...memberGroups];
  
  // Ordenar por fecha de creación
  allGroups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return allGroups as Group[];
}

/**
 * Obtiene un grupo por ID
 */
export async function getGroupById(id: string): Promise<Group | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      owner:profiles!owner_id(id, email, full_name),
      members:group_members(
        group_id,
        user_id,
        role,
        joined_at,
        user:profiles!group_members_user_id_fkey(id, email, full_name)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrado
    }
    throw new Error(error.message || 'Error al obtener el grupo');
  }

  // Añadir propiedad is_owner
  const group = data as Group;
  if (user) {
    group.is_owner = group.owner_id === user.id;
  }

  return group;
}

/**
 * Actualiza un grupo
 */
export async function updateGroup(id: string, data: UpdateGroupInput): Promise<Group> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Obtener el grupo actual para validaciones
  const currentGroup = await getGroupById(id);
  if (!currentGroup) {
    throw new Error('Grupo no encontrado');
  }

  // Validar permisos
  if (currentGroup.owner_id !== user.id) {
    throw new Error('No tienes permisos para actualizar este grupo');
  }

  // Validar cambio de tipo
  const newType = data.type || currentGroup.type;
  const newEndDate = data.end_date !== undefined ? data.end_date : currentGroup.end_date;

  if (newType === 'trip' && !newEndDate) {
    throw new Error('end_date es obligatorio para grupos tipo trip');
  }

  if (newType === 'group' && newEndDate !== null) {
    throw new Error('end_date debe ser null para grupos tipo group');
  }

  // Validar fechas si es trip
  if (newType === 'trip' && newEndDate) {
    const startDate = data.start_date || currentGroup.start_date;
    if (new Date(newEndDate) < new Date(startDate)) {
      throw new Error('end_date debe ser posterior a start_date');
    }
  }

  // Preparar datos para actualizar
  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.start_date !== undefined) updateData.start_date = data.start_date;
  if (data.end_date !== undefined) updateData.end_date = data.end_date;
  if (data.destination !== undefined) updateData.destination = data.destination;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase
    .from('groups')
    .update(updateData)
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) {
    throw new Error(error.message || 'Error al actualizar el grupo');
  }

  // Retornar el grupo actualizado
  const updatedGroup = await getGroupById(id);
  if (!updatedGroup) {
    throw new Error('Error al obtener el grupo actualizado');
  }

  return updatedGroup;
}

/**
 * Elimina un grupo (soft delete o hard)
 */
export async function deleteGroup(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar permisos
  const group = await getGroupById(id);
  if (!group) {
    throw new Error('Grupo no encontrado');
  }

  if (group.owner_id !== user.id) {
    throw new Error('No tienes permisos para eliminar este grupo');
  }

  // Hard delete (eliminar permanentemente)
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) {
    throw new Error(error.message || 'Error al eliminar el grupo');
  }
}

