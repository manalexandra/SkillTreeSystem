/*
  # Create Skill Types Table

  1. New Tables
    - `skill_types`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `type` (text) - e.g., 'technical', 'soft_skill', 'leadership'

  2. Security
    - Enable RLS
    - Policies for CRUD operations
*/

-- Create skill_types table
CREATE TABLE IF NOT EXISTS skill_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('technical', 'soft_skill', 'leadership')),
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  CONSTRAINT skill_types_name_key UNIQUE (name)
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