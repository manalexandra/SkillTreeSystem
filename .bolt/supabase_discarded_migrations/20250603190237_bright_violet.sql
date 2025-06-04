/*
  # Skill Types Management System

  1. New Tables
    - `skill_types`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, nullable)
      - `level` (integer, 1-5)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on skill_types table
    - Add policies for:
      - Anyone can read skill types
      - Managers can create skill types
      - Managers can update their own skill types
      - Managers can delete their own skill types

  3. Constraints
    - Level must be between 1 and 5
    - Name must be unique
*/

-- Create skill_types table
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