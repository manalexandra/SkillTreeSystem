/*
  # Add user profile fields

  1. Changes
    - Add first_name, last_name, and image_url columns to users table
    - These fields are optional and can be null

  2. Security
    - No changes to RLS policies needed
    - Existing policies will handle the new fields
*/

-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS image_url text;