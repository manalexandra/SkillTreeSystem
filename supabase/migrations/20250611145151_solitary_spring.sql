/*
  # Fix Node Images RLS Policy Violation

  1. Changes
    - Enable RLS on node_images table
    - Drop existing policies to avoid conflicts
    - Create new policies for proper access control
    - Set up storage bucket and policies for node images

  2. Security
    - Managers can upload images for nodes in their trees
    - Users can view images for accessible nodes
    - Users can manage their own uploaded images
    - Public read access for image display
*/

-- Enable RLS on node_images table
ALTER TABLE node_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can upload images for their managed nodes" ON node_images;
  DROP POLICY IF EXISTS "Users can view images for accessible nodes" ON node_images;
  DROP POLICY IF EXISTS "Users can update their uploaded images for managed nodes" ON node_images;
  DROP POLICY IF EXISTS "Users can delete their uploaded images for managed nodes" ON node_images;
  DROP POLICY IF EXISTS "Managers can manage images for their trees" ON node_images;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policy for managing images - managers can do all operations for nodes in their trees
CREATE POLICY "Managers can manage images for their trees"
  ON node_images
  FOR ALL
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

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('node-images', 'node-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
  DROP POLICY IF EXISTS "Node images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload node images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update node images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete node images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Storage policies for the node-images bucket
-- Allow public read access to images
CREATE POLICY "Node images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'node-images');

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload node images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'node-images');

-- Allow users to update images
CREATE POLICY "Users can update node images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'node-images')
  WITH CHECK (bucket_id = 'node-images');

-- Allow users to delete images
CREATE POLICY "Users can delete node images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'node-images');