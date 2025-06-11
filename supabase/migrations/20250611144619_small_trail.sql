/*
  # Fix Node Links RLS Policies

  1. Changes
    - Update RLS policies for node_links table to properly handle inserts
    - Ensure managers can manage links for nodes in their trees
    - Fix policy conditions to match the actual data structure

  2. Security
    - Maintains security by ensuring only managers can manage links for their trees
    - Users can view links for accessible nodes
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Managers can manage links for their trees" ON node_links;
DROP POLICY IF EXISTS "Users can view links for accessible nodes" ON node_links;

-- Create updated policies with proper conditions
CREATE POLICY "Managers can manage links for their trees"
  ON node_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_links.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_links.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

CREATE POLICY "Users can view links for accessible nodes"
  ON node_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_links.node_id
      AND (
        st.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_skill_trees ust
          WHERE ust.tree_id = st.id AND ust.user_id = auth.uid()
        )
      )
    )
  );