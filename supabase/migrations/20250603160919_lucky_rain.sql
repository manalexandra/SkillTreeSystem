/*
  # Add Teams Support

  1. New Tables
    - `teams` - Stores team information
      - `id` (uuid, primary key) - Unique identifier for the team
      - `name` (text) - Team name
      - `description` (text) - Team description
      - `created_by` (uuid) - Reference to the manager who created the team
      - `created_at` (timestamp) - When the team was created

    - `team_members` - Stores team membership
      - `team_id` (uuid) - Reference to the team
      - `user_id` (uuid) - Reference to the user
      - `joined_at` (timestamp) - When the user joined the team

  2. Changes
    - Add `team_id` to skill_trees table
    - Update user_skill_trees to handle team assignments

  3. Security
    - Enable RLS on all new tables
    - Add policies for managers and team members
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- Add team_id to skill_trees
ALTER TABLE skill_trees
ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policies for teams
CREATE POLICY "Anyone can read teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND 
    check_user_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers can update their teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by AND 
    check_user_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers can delete their teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by AND 
    check_user_role(auth.uid(), 'manager')
  );

-- Policies for team_members
CREATE POLICY "Anyone can read team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_id
      AND created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

-- Function to assign tree to team members
CREATE OR REPLACE FUNCTION assign_tree_to_team()
RETURNS TRIGGER AS $$
BEGIN
  -- When a tree is assigned to a team, assign it to all team members
  IF NEW.team_id IS NOT NULL THEN
    INSERT INTO user_skill_trees (user_id, tree_id, assigned_by)
    SELECT 
      tm.user_id,
      NEW.id,
      NEW.created_by
    FROM team_members tm
    WHERE tm.team_id = NEW.team_id
    ON CONFLICT (user_id, tree_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for team assignments
CREATE TRIGGER tree_team_assignment
  AFTER INSERT OR UPDATE OF team_id ON skill_trees
  FOR EACH ROW
  EXECUTE FUNCTION assign_tree_to_team();

-- Function to handle new team members
CREATE OR REPLACE FUNCTION assign_trees_to_new_team_member()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user joins a team, assign all team's trees to them
  INSERT INTO user_skill_trees (user_id, tree_id, assigned_by)
  SELECT 
    NEW.user_id,
    st.id,
    st.created_by
  FROM skill_trees st
  WHERE st.team_id = NEW.team_id
  ON CONFLICT (user_id, tree_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new team members
CREATE TRIGGER new_team_member_assignment
  AFTER INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION assign_trees_to_new_team_member();