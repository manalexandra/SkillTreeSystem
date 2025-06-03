/*
  # Add level field to skill types

  1. Changes
    - Add level column to skill_types table with constraint (1-5)
    - Drop existing policies to avoid conflicts
    - Recreate policies with proper checks
  
  2. Constraints
    - Level must be between 1 and 5
    - Default value is 1
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can create skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can update their skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can delete their skill types" ON skill_types;

-- Add level column if it doesn't exist
ALTER TABLE skill_types 
ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1
CHECK (level >= 1 AND level <= 5);

-- Recreate policies
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

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS skill_types_created_by_idx ON skill_types(created_by);