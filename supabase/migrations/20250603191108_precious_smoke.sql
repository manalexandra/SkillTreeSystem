/*
  # Add skill types with type field
  
  1. New Tables
    - Adds type field to skill_types table
    - Adds check constraint for valid type values
    
  2. Security
    - Enables RLS
    - Adds policies for CRUD operations
    - Only managers can create/update/delete
    - All authenticated users can read
*/

-- Create skill_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS skill_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('technical', 'soft_skill', 'leadership')),
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  CONSTRAINT skill_types_name_key UNIQUE (name)
);

-- Create index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS skill_types_created_by_idx ON skill_types(created_by);

-- Enable Row Level Security
DO $$ 
BEGIN
  ALTER TABLE skill_types ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_types' 
    AND policyname = 'Anyone can read skill types'
  ) THEN
    CREATE POLICY "Anyone can read skill types"
      ON skill_types
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_types' 
    AND policyname = 'Managers can create skill types'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_types' 
    AND policyname = 'Managers can update their skill types'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_types' 
    AND policyname = 'Managers can delete their skill types'
  ) THEN
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
  END IF;
END $$;