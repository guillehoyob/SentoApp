-- EJECUTAR EN SUPABASE SQL EDITOR
-- Reemplaza TU_EMAIL con el email de la cuenta Usuario B

-- 1. Ver si el usuario está en group_members
SELECT 
  gm.group_id,
  gm.user_id,
  gm.role,
  p.email,
  g.name as group_name
FROM group_members gm
JOIN profiles p ON p.id = gm.user_id
JOIN groups g ON g.id = gm.group_id
WHERE p.email = 'TU_EMAIL_AQUI';

-- 2. Ver TODOS los grupos del usuario (query completa)
SELECT 
  g.id,
  g.name,
  g.type,
  g.owner_id,
  p.email as owner_email,
  EXISTS(
    SELECT 1 FROM group_members 
    WHERE group_id = g.id 
    AND user_id = (SELECT id FROM profiles WHERE email = 'TU_EMAIL_AQUI')
  ) as is_member
FROM groups g
JOIN profiles p ON p.id = g.owner_id
WHERE g.owner_id = (SELECT id FROM profiles WHERE email = 'TU_EMAIL_AQUI')
   OR EXISTS(
     SELECT 1 FROM group_members 
     WHERE group_id = g.id 
     AND user_id = (SELECT id FROM profiles WHERE email = 'TU_EMAIL_AQUI')
   );

