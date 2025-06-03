/*
  # Add foreign key constraint to team_members table

  1. Changes
    - Add foreign key constraint from team_members.user_id to users.id
    - This enables proper joins between team_members and users tables
    - Ensures referential integrity for user_id values

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

DO $$ BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'team_members_user_id_fkey'
    AND table_name = 'team_members'
  ) THEN
    ALTER TABLE team_members
    ADD CONSTRAINT team_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;
  END IF;
END $$;