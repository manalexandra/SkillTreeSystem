/*
  # Add level field to skill types

  1. Changes
    - Add level field to skill_types table
    - Add check constraint to ensure level is between 1 and 5
*/

ALTER TABLE skill_types
ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1
CHECK (level >= 1 AND level <= 5);