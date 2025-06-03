/*
  # Fix skill types RLS policies
  
  1. Changes
    - Add IF NOT EXISTS to policy creation statements
    - Ensure policies don't conflict with existing ones
  
  2. Security
    - Maintains existing RLS policies for skill types table
    - Ensures proper access control for managers and users
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Managers can create skill types" ON skill_types;
  DROP POLICY IF EXISTS "Managers can update their skill types" ON skill_types;
  DROP POLICY IF EXISTS "Managers can delete their skill types" ON skill_types;
  DROP POLICY IF EXISTS "Anyone can read skill types" ON skill_types;
END $$;

-- Enable RLS (idempotent)
ALTER TABLE skill_types ENABLE ROW LEVEL SECURITY;

-- Recreate policies
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
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
)
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
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
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
);

CREATE POLICY "Anyone can read skill types"
ON skill_types
FOR SELECT
TO authenticated
USING (true);