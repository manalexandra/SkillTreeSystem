/*
  # Fix Teams RLS Policies

  1. Changes
    - Enable RLS on teams table
    - Add policy for managers to create teams
    - Add policy for managers to manage their own teams
    - Add policy for authenticated users to read teams

  2. Security
    - Only managers can create and manage teams
    - All authenticated users can read teams
*/

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Allow managers to create teams
CREATE POLICY "Managers can create teams"
ON teams
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
);

-- Allow managers to manage their own teams
CREATE POLICY "Managers can manage their own teams"
ON teams
FOR ALL
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
);

-- Allow all authenticated users to read teams
CREATE POLICY "Anyone can read teams"
ON teams
FOR SELECT
TO authenticated
USING (true);