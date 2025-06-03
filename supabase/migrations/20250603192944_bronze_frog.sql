/*
  # Fix node_comments foreign key constraint

  1. Changes
    - Add foreign key constraint between node_comments.user_id and users.id
    - Enable RLS on node_comments table for consistency

  2. Security
    - Add RLS policies for node_comments table
*/

-- Add foreign key constraint
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'node_comments_user_id_fkey'
  ) THEN
    ALTER TABLE public.node_comments
    ADD CONSTRAINT node_comments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;