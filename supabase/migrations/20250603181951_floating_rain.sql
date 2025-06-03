/*
  # Fix User Registration Policies

  1. Changes
    - Add policy to allow new user registration
    - Modify existing policies to ensure proper access control

  2. Security
    - Enable RLS on users table (already enabled)
    - Add policy for new user registration
    - Ensure policies follow principle of least privilege
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "System can insert new users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;

-- Add new policy for user registration
CREATE POLICY "Allow user registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (
  -- Allow insert only if the user is inserting their own record
  auth.uid() = id
);

-- Ensure other policies remain intact but are properly scoped
DROP POLICY IF EXISTS "Authenticated users can read all users" ON public.users;
CREATE POLICY "Authenticated users can read all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Managers can update user roles" ON public.users;
CREATE POLICY "Managers can update user roles"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
);

DROP POLICY IF EXISTS "Managers can delete users" ON public.users;
CREATE POLICY "Managers can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
);