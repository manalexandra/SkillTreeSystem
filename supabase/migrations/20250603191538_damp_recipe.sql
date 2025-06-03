/*
  # Update skill_types RLS policies

  1. Changes
    - Add RLS policy for managers to create skill types
    - Add RLS policy for managers to update their own skill types
    - Add RLS policy for managers to delete their own skill types
    - Add RLS policy for anyone to read skill types
*/

-- Enable RLS on skill_types table if not already enabled
ALTER TABLE skill_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can create skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can update their skill types" ON skill_types;
DROP POLICY IF EXISTS "Managers can delete their skill types" ON skill_types;

-- Create new policies
CREATE POLICY "Anyone can read skill types"
ON skill_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Managers can create skill types"
ON skill_types FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
);

CREATE POLICY "Managers can update their skill types"
ON skill_types FOR UPDATE
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
ON skill_types FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
);