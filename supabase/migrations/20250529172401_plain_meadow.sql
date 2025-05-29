/*
  # Create users table and RLS policies

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - References auth.users.id
      - `email` (text, unique) - User's email address
      - `role` (text) - User's role (user/manager)
      - `created_at` (timestamp) - When the user was created

  2. Security
    - Enable RLS on `users` table
    - Add policies for:
      - Authenticated users can read all users
      - Managers can update user roles
      - System can insert new users
      - Managers can delete users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can update user roles"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

CREATE POLICY "System can insert new users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Create helper function for checking user roles
CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role = required_role
  );
END;
$$;