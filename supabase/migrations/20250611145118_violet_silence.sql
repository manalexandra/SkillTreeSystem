/*
  # Fix Node Images RLS Policy

  1. Security Updates
    - Enable RLS on `node_images` table
    - Add policy for authenticated users to insert images for nodes they can manage
    - Add policy for authenticated users to view images for accessible nodes
    - Add policy for authenticated users to delete images they uploaded for nodes they can manage

  2. Storage Policies
    - Ensure storage bucket policies allow authenticated users to upload images
*/

-- Enable RLS on node_images table
ALTER TABLE node_images ENABLE ROW LEVEL SECURITY;

-- Policy for inserting images - users can upload images for nodes in trees they manage
CREATE POLICY "Users can upload images for their managed nodes"
  ON node_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
        AND st.created_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.role = 'manager'
        )
    )
  );

-- Policy for viewing images - users can view images for nodes they have access to
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

-- Policy for updating images - users can update images they uploaded for nodes they manage
CREATE POLICY "Users can update their uploaded images for managed nodes"
  ON node_images
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
        AND st.created_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.role = 'manager'
        )
    )
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
        AND st.created_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.role = 'manager'
        )
    )
  );

-- Policy for deleting images - users can delete images they uploaded for nodes they manage
CREATE POLICY "Users can delete their uploaded images for managed nodes"
  ON node_images
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
        AND st.created_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.role = 'manager'
        )
    )
  );

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('node-images', 'node-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the node-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'node-images');

-- Allow authenticated users to view images
CREATE POLICY "Anyone can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'node-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'node-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update their own images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'node-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'node-images' AND auth.uid()::text = (storage.foldername(name))[1]);