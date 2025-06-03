/*
  # Add foreign key constraint to team_members table

  1. Changes
    - Add foreign key constraint between team_members.user_id and users.id
    - This enables proper joins between team_members and users tables
    - Ensures referential integrity for user_id in team_members

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_user_id_fkey'
  ) THEN
    ALTER TABLE team_members 
    ADD CONSTRAINT team_members_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;