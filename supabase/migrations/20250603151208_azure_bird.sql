/*
  # Skill Tree System Enhancements

  1. New Tables
    - `user_skill_trees`: Assigns users to skill trees
    - `node_comments`: Stores comments on skill nodes
    - `node_progress`: Tracks user progress (0-10 scale)
    - `notifications`: Stores user notifications

  2. Security
    - Enable RLS on all new tables
    - Add policies for user access control
*/

-- User-Tree assignments
CREATE TABLE IF NOT EXISTS user_skill_trees (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id uuid REFERENCES skill_trees(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (user_id, tree_id)
);

ALTER TABLE user_skill_trees ENABLE ROW LEVEL SECURITY;

-- Node comments
CREATE TABLE IF NOT EXISTS node_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid REFERENCES skill_nodes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE node_comments ENABLE ROW LEVEL SECURITY;

-- Node progress (0-10 scale)
CREATE TABLE IF NOT EXISTS node_progress (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id uuid REFERENCES skill_nodes(id) ON DELETE CASCADE,
  score integer CHECK (score >= 0 AND score <= 10),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, node_id)
);

ALTER TABLE node_progress ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('tree_assigned', 'node_comment')),
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  related_tree_id uuid REFERENCES skill_trees(id) ON DELETE CASCADE,
  related_node_id uuid REFERENCES skill_nodes(id) ON DELETE CASCADE
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add description_html column to skill_nodes
ALTER TABLE skill_nodes 
ADD COLUMN IF NOT EXISTS description_html text;

-- RLS Policies

-- User-Tree assignments
CREATE POLICY "Users can view their assigned trees"
  ON user_skill_trees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM skill_trees st 
    WHERE st.id = tree_id AND st.created_by = auth.uid()
  ));

CREATE POLICY "Managers can assign trees"
  ON user_skill_trees
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM skill_trees st 
    WHERE st.id = tree_id AND st.created_by = auth.uid()
  ));

-- Node comments
CREATE POLICY "Users can view comments on accessible nodes"
  ON node_comments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM skill_nodes sn
    JOIN skill_trees st ON st.id = sn.tree_id
    WHERE sn.id = node_id AND (
      st.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_skill_trees ust
        WHERE ust.tree_id = st.id AND ust.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can add comments to accessible nodes"
  ON node_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_id AND (
        st.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_skill_trees ust
          WHERE ust.tree_id = st.id AND ust.user_id = auth.uid()
        )
      )
    )
  );

-- Node progress
CREATE POLICY "Users can view progress on accessible nodes"
  ON node_progress
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_id AND st.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own progress"
  ON node_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON node_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Functions

-- Function to calculate average progress of child nodes
CREATE OR REPLACE FUNCTION calculate_node_progress(p_node_id uuid, p_user_id uuid)
RETURNS numeric AS $$
DECLARE
  avg_score numeric;
BEGIN
  WITH RECURSIVE node_tree AS (
    -- Base case: direct children
    SELECT id, parent_id
    FROM skill_nodes
    WHERE parent_id = p_node_id
    
    UNION ALL
    
    -- Recursive case: all descendants
    SELECT sn.id, sn.parent_id
    FROM skill_nodes sn
    INNER JOIN node_tree nt ON sn.parent_id = nt.id
  )
  SELECT COALESCE(AVG(np.score), 0)
  INTO avg_score
  FROM node_tree nt
  LEFT JOIN node_progress np ON np.node_id = nt.id AND np.user_id = p_user_id;
  
  RETURN avg_score;
END;
$$ LANGUAGE plpgsql;