/*
  # Fix Teams RLS Policies

  1. Changes
    - Enable RLS on teams table
    - Add policy for managers to create teams
    - Add policy for managers to update their teams
    - Add policy for managers to delete their teams
    - Add policy for authenticated users to read teams

  2. Security
    - Only managers can create/update/delete teams
    - All authenticated users can read teams
    - Teams can only be managed by their creators
*/

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read teams" ON teams;
DROP POLICY IF EXISTS "Managers can create teams" ON teams;
DROP POLICY IF EXISTS "Managers can update their teams" ON teams;
DROP POLICY IF EXISTS "Managers can delete their teams" ON teams;

-- Create new policies
CREATE POLICY "Anyone can read teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = created_by) AND 
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

CREATE POLICY "Managers can update their teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = created_by) AND 
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete their teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = created_by) AND 
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );