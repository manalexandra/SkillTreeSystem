/*
  # Add Level Field to Skill Types

  1. Changes
    - Adds level column to skill_types table with constraints
    - Ensures proper policies are in place
    - Adds necessary indexes

  2. Security
    - Maintains existing RLS policies
    - Ensures proper access control for managers
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can create skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can update their skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can delete their skill types" ON skill_types;

-- Add level column with constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'skill_types' AND column_name = 'level'
  ) THEN
    ALTER TABLE skill_types 
    ADD COLUMN level integer NOT NULL DEFAULT 1
    CHECK (level >= 1 AND level <= 5);
  END IF;
END $$;

-- Recreate policies with proper checks
CREATE POLICY "Anyone can read skill types"
  ON skill_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can create skill types"
  ON skill_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

CREATE POLICY "Managers can update their skill types"
  ON skill_types
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  )
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete their skill types"
  ON skill_types
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- Add index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS skill_types_created_by_idx ON skill_types(created_by);