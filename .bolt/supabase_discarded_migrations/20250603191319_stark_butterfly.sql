/*
  # Add RLS policies for skill_types table

  1. Security Changes
    - Enable RLS on skill_types table
    - Add policy for managers to create skill types
    - Add policy for managers to update their own skill types
    - Add policy for managers to delete their own skill types
    - Add policy for authenticated users to read skill types
*/

-- Enable RLS
ALTER TABLE skill_types ENABLE ROW LEVEL SECURITY;

-- Allow managers to create skill types
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

-- Allow managers to update their own skill types
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

-- Allow managers to delete their own skill types
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

-- Allow authenticated users to read skill types
CREATE POLICY "Anyone can read skill types"
ON skill_types
FOR SELECT
TO authenticated
USING (true);