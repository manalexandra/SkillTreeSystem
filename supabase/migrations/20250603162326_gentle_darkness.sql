/*
  # Update teams table RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies for managers and admins
    - Allow read access for all authenticated users
    
  2. Security
    - Only managers and admins can create/manage teams
    - All authenticated users can read teams
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read teams" ON teams;
DROP POLICY IF EXISTS "Managers can create teams" ON teams;
DROP POLICY IF EXISTS "Managers can manage their own teams" ON teams;
DROP POLICY IF EXISTS "Managers and admins can create teams" ON teams;
DROP POLICY IF EXISTS "Managers and admins can delete their teams" ON teams;
DROP POLICY IF EXISTS "Managers and admins can update their teams" ON teams;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Anyone can read teams"
ON teams
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Managers and admins can create teams"
ON teams
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND (users.role = 'manager' OR users.role = 'admin')
));

CREATE POLICY "Managers and admins can update their teams"
ON teams
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = created_by)
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'manager' OR users.role = 'admin')
  )
);

CREATE POLICY "Managers and admins can delete their teams"
ON teams
FOR DELETE
TO authenticated
USING (
  (auth.uid() = created_by)
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'manager' OR users.role = 'admin')
  )
);