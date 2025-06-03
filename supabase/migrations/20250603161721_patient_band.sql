/*
  # Update Teams RLS Policies

  1. Changes
    - Fix RLS policies for teams table to properly allow managers to create teams
    - Ensure proper policy checks using check_user_role function
    - Add explicit policy for team creation by managers

  2. Security
    - Maintains existing RLS enabled state
    - Updates policies to properly check manager role
    - Ensures created_by matches the authenticated user
*/

-- First drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Managers can create teams" ON teams;

-- Create new policy for team creation
CREATE POLICY "Managers can create teams"
ON teams
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by 
  AND check_user_role(auth.uid(), 'manager')
);