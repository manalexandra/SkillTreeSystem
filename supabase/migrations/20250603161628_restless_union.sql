/*
  # Fix Teams RLS Policies

  1. Changes
    - Enable RLS on teams table (already enabled)
    - Update policy for team creation to properly check manager role
    - Update policy for team deletion to properly check manager role
    - Update policy for team updates to properly check manager role
    - Update policy for team selection to allow authenticated users to read

  2. Security
    - Managers can create, update, and delete teams
    - All authenticated users can read teams
    - Uses check_user_role() function for role verification
*/

-- Drop existing policies to recreate them with correct conditions
DROP POLICY IF EXISTS "Anyone can read teams" ON teams;
DROP POLICY IF EXISTS "Managers can create teams" ON teams;
DROP POLICY IF EXISTS "Managers can delete their teams" ON teams;
DROP POLICY IF EXISTS "Managers can update their teams" ON teams;

-- Create new policies with correct conditions
CREATE POLICY "Anyone can read teams"
ON teams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Managers can create teams"
ON teams FOR INSERT
TO authenticated
WITH CHECK (
  check_user_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can delete their teams"
ON teams FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by 
  AND check_user_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can update their teams"
ON teams FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by 
  AND check_user_role(auth.uid(), 'manager')
);