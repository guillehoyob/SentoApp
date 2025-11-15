export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  // Relaciones populadas
  user?: Profile;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  language?: string;
  created_at: string;
}

export interface Group {
  id: string;
  owner_id: string;
  name: string;
  type: 'trip' | 'group';
  start_date: string; // ISO 8601
  end_date?: string; // Obligatorio si type='trip'
  destination?: string;
  notes?: string;
  created_at: string;
  // Relaciones populadas
  members?: GroupMember[];
  owner?: Profile;
  // Propiedades calculadas
  is_owner?: boolean;
}

export interface CreateGroupInput {
  name: string;
  type: 'trip' | 'group';
  start_date: string; // ISO 8601
  end_date?: string; // Obligatorio si type='trip'
  destination?: string;
  notes?: string;
}

export interface UpdateGroupInput {
  name?: string;
  type?: 'trip' | 'group';
  start_date?: string;
  end_date?: string | null; // null para eliminar end_date al cambiar de trip a group
  destination?: string | null;
  notes?: string | null;
}


