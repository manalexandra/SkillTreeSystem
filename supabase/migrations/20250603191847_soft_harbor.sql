/*
  # Add type column to skill_types table

  1. Changes
    - Add 'type' column to skill_types table with TEXT data type
    - Set default value to 'technical'
    - Add check constraint to ensure valid types
    - Make column non-nullable
    - Add comment explaining valid types

  2. Security
    - No changes to RLS policies needed
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'skill_types' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE skill_types 
    ADD COLUMN type TEXT NOT NULL DEFAULT 'technical';

    ALTER TABLE skill_types
    ADD CONSTRAINT skill_types_type_check 
    CHECK (type IN ('technical', 'soft_skill', 'leadership'));

    COMMENT ON COLUMN skill_types.type IS 'Type of skill: technical, soft_skill, or leadership';
  END IF;
END $$;