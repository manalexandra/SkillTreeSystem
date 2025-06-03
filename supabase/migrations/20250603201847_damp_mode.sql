/*
  # Add completed trees functionality
  
  1. New Tables
    - completed_trees
      - user_id (uuid, references auth.users)
      - tree_id (uuid, references skill_trees)
      - skill_type_id (uuid, references skill_types)
      - completed_at (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for viewing and inserting completed trees
  
  3. Functions
    - Add is_tree_completable function to check if a tree can be marked as complete
*/

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own completed trees" ON completed_trees;
  DROP POLICY IF EXISTS "Users can view completed trees of users they manage" ON completed_trees;
  DROP POLICY IF EXISTS "System can insert completed trees" ON completed_trees;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create completed_trees table if it doesn't exist
CREATE TABLE IF NOT EXISTS completed_trees (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id uuid REFERENCES skill_trees(id) ON DELETE CASCADE,
  skill_type_id uuid REFERENCES skill_types(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, tree_id)
);

-- Enable RLS
ALTER TABLE completed_trees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own completed trees"
  ON completed_trees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view completed trees of users they manage"
  ON completed_trees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_trees st
      WHERE st.id = completed_trees.tree_id
      AND st.created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert completed trees"
  ON completed_trees
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_tree_completable(uuid, uuid);

-- Create function to check if a tree is completable
CREATE OR REPLACE FUNCTION is_tree_completable(p_user_id uuid, p_tree_id uuid)
RETURNS boolean AS $$
DECLARE
  total_nodes integer;
  completed_nodes integer;
BEGIN
  -- Get total number of nodes in the tree
  SELECT COUNT(*)
  INTO total_nodes
  FROM skill_nodes
  WHERE tree_id = p_tree_id;

  -- Get number of completed nodes for the user
  SELECT COUNT(*)
  INTO completed_nodes
  FROM node_progress
  WHERE user_id = p_user_id
  AND node_id IN (
    SELECT id FROM skill_nodes WHERE tree_id = p_tree_id
  )
  AND score = 10;

  -- Tree is completable if all nodes are completed with max score
  RETURN total_nodes > 0 AND total_nodes = completed_nodes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;