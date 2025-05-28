/*
  # Create Skill Tree System Tables

  1. New Tables
    - `skill_trees` - Stores skill tree metadata
      - `id` (uuid, primary key) - Unique identifier for the tree
      - `name` (text) - Name of the skill tree
      - `created_by` (uuid) - Reference to the user who created the tree
      - `created_at` (timestamp) - When the tree was created

    - `skill_nodes` - Stores individual nodes within skill trees
      - `id` (uuid, primary key) - Unique identifier for the node
      - `tree_id` (uuid) - Reference to the parent skill tree
      - `parent_id` (uuid, nullable) - Reference to parent node (null for root nodes)
      - `title` (text) - Name of the skill/task
      - `description` (text) - Detailed description of the skill/task
      - `order_index` (integer) - Sorting order among siblings
      - `created_at` (timestamp) - When the node was created

    - `user_node_progress` - Tracks user progress on nodes
      - `user_id` (uuid) - Reference to the user
      - `node_id` (uuid) - Reference to the skill node
      - `completed` (boolean) - Whether the node is completed
      - `completed_at` (timestamp) - When the node was completed

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create skill_trees table
CREATE TABLE IF NOT EXISTS skill_trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create skill_nodes table
CREATE TABLE IF NOT EXISTS skill_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES skill_trees(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES skill_nodes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_node_progress table
CREATE TABLE IF NOT EXISTS user_node_progress (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id uuid REFERENCES skill_nodes(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (user_id, node_id)
);

-- Enable Row Level Security
ALTER TABLE skill_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_node_progress ENABLE ROW LEVEL SECURITY;

-- Policies for skill_trees
CREATE POLICY "Anyone can read skill trees"
  ON skill_trees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can insert skill trees"
  ON skill_trees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'manager'
  ));

CREATE POLICY "Managers can update their own skill trees"
  ON skill_trees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'manager'
  ));

CREATE POLICY "Managers can delete their own skill trees"
  ON skill_trees
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'manager'
  ));

-- Policies for skill_nodes
CREATE POLICY "Anyone can read skill nodes"
  ON skill_nodes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can insert nodes to their trees"
  ON skill_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM skill_trees st
    WHERE st.id = tree_id AND st.created_by = auth.uid() AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'manager'
    )
  ));

CREATE POLICY "Managers can update nodes in their trees"
  ON skill_nodes
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM skill_trees st
    WHERE st.id = tree_id AND st.created_by = auth.uid() AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'manager'
    )
  ));

CREATE POLICY "Managers can delete nodes from their trees"
  ON skill_nodes
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM skill_trees st
    WHERE st.id = tree_id AND st.created_by = auth.uid() AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'manager'
    )
  ));

-- Policies for user_node_progress
CREATE POLICY "Users can read their own progress"
  ON user_node_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can read progress for their trees"
  ON user_node_progress
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM skill_nodes sn
    JOIN skill_trees st ON sn.tree_id = st.id
    WHERE sn.id = node_id AND st.created_by = auth.uid() AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'manager'
    )
  ));

CREATE POLICY "Users can update their own progress"
  ON user_node_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their existing progress"
  ON user_node_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);