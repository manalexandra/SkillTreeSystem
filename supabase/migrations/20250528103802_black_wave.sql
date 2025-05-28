/*
  # Update user role access and policies

  1. Changes
    - Create function for secure role access
    - Drop existing policies
    - Create new policies using the function
    
  2. Security
    - Function to check user roles
    - Update policies to use function instead of direct auth.users access
*/

-- Create a function to check user roles
CREATE OR REPLACE FUNCTION check_user_role(user_id uuid, required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id 
    AND raw_user_meta_data->>'role' = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Managers can delete their own skill trees" ON skill_trees;
DROP POLICY IF EXISTS "Managers can insert skill trees" ON skill_trees;
DROP POLICY IF EXISTS "Managers can update their own skill trees" ON skill_trees;
DROP POLICY IF EXISTS "Managers can delete nodes from their trees" ON skill_nodes;
DROP POLICY IF EXISTS "Managers can insert nodes to their trees" ON skill_nodes;
DROP POLICY IF EXISTS "Managers can update nodes in their trees" ON skill_nodes;

-- Create new policies using the function
CREATE POLICY "Managers can delete their own skill trees"
  ON skill_trees
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = created_by) AND 
    check_user_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers can insert skill trees"
  ON skill_trees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = created_by) AND 
    check_user_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers can update their own skill trees"
  ON skill_trees
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = created_by) AND 
    check_user_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers can delete nodes from their trees"
  ON skill_nodes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_trees st
      WHERE st.id = skill_nodes.tree_id 
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

CREATE POLICY "Managers can insert nodes to their trees"
  ON skill_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM skill_trees st
      WHERE st.id = skill_nodes.tree_id 
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

CREATE POLICY "Managers can update nodes in their trees"
  ON skill_nodes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_trees st
      WHERE st.id = skill_nodes.tree_id 
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );