/*
  # Fix RLS policies for node_images table

  1. Security Updates
    - Update RLS policies for `node_images` table to allow proper image uploads
    - Allow authenticated users to insert images for nodes they have access to
    - Maintain security by checking tree ownership and user access

  2. Changes
    - Drop existing restrictive policies
    - Add new policies that allow image uploads for accessible nodes
    - Ensure managers can manage images for their trees
    - Allow users to upload images for nodes in trees they have access to
*/

-- Drop existing policies for node_images
DROP POLICY IF EXISTS "Managers can manage images for their trees" ON node_images;
DROP POLICY IF EXISTS "Users can view images for accessible nodes" ON node_images;

-- Create new policies for node_images table

-- Allow users to view images for nodes they have access to
CREATE POLICY "Users can view images for accessible nodes"
  ON node_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
      AND (
        st.created_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM user_skill_trees ust
          WHERE ust.tree_id = st.id
          AND ust.user_id = auth.uid()
        )
      )
    )
  );

-- Allow authenticated users to insert images for nodes they have access to
CREATE POLICY "Users can upload images for accessible nodes"
  ON node_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
    AND (
      -- Allow if node exists and user has access
      EXISTS (
        SELECT 1
        FROM skill_nodes sn
        JOIN skill_trees st ON st.id = sn.tree_id
        WHERE sn.id = node_images.node_id
        AND (
          st.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM user_skill_trees ust
            WHERE ust.tree_id = st.id
            AND ust.user_id = auth.uid()
          )
        )
      )
      -- Or allow if user is a manager (for new nodes being created)
      OR EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'manager'
      )
    )
  );

-- Allow managers to update images for their trees
CREATE POLICY "Managers can update images for their trees"
  ON node_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

-- Allow managers to delete images for their trees
CREATE POLICY "Managers can delete images for their trees"
  ON node_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );