/*
  # Add skill types table and policies

  1. New Tables
    - `skill_types`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for:
      - Reading (all authenticated users)
      - Creating (managers only)
      - Updating (managers, own records)
      - Deleting (managers, own records)
*/

-- Create skill types table if it doesn't exist
CREATE TABLE IF NOT EXISTS skill_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE skill_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read skill types" ON skill_types;
  DROP POLICY IF EXISTS "Managers can create skill types" ON skill_types;
  DROP POLICY IF EXISTS "Managers can update their skill types" ON skill_types;
  DROP POLICY IF EXISTS "Managers can delete their skill types" ON skill_types;
END $$;

-- Create policies
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'skill_types_created_by_idx'
  ) THEN
    CREATE INDEX skill_types_created_by_idx ON skill_types(created_by);
  END IF;
END $$;