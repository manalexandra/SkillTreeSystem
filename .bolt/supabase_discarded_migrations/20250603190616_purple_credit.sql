/*
  # Add skill types table and policies

  1. New Tables
    - `skill_types`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `level` (integer, 1-5)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Create index for performance
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can create skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can update their skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can delete their skill types" ON skill_types;

-- Create skill_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS skill_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  CONSTRAINT skill_types_name_key UNIQUE (name),
  CONSTRAINT skill_types_level_check CHECK (level >= 1 AND level <= 5)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS skill_types_created_by_idx ON skill_types(created_by);

-- Enable Row Level Security
ALTER TABLE skill_types ENABLE ROW LEVEL SECURITY;

-- Policies
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
      WHERE users.id = uid()
      AND users.role = 'manager'
    )
  );

CREATE POLICY "Managers can update their skill types"
  ON skill_types
  FOR UPDATE
  TO authenticated
  USING (
    created_by = uid() 
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uid()
      AND users.role = 'manager'
    )
  )
  WITH CHECK (
    created_by = uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uid()
      AND users.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete their skill types"
  ON skill_types
  FOR DELETE
  TO authenticated
  USING (
    created_by = uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uid()
      AND users.role = 'manager'
    )
  );