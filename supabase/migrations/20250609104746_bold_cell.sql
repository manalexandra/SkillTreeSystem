/*
  # Create Avatar Storage Bucket and Policies

  1. Storage Setup
    - Create avatars bucket for profile pictures
    - Set bucket to public for read access
    
  2. Security Policies
    - Allow authenticated users to upload their own avatars
    - Allow users to update/delete their own avatars
    - Allow public read access to all avatars
    
  3. Notes
    - Uses storage-specific functions for policy creation
    - Filename must start with user ID for security
*/

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Create storage policies using storage functions
-- Policy: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name ~ ('^' || auth.uid()::text || '-.*')
);

-- Policy: Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name ~ ('^' || auth.uid()::text || '-.*')
)
WITH CHECK (
  bucket_id = 'avatars' AND
  name ~ ('^' || auth.uid()::text || '-.*')
);

-- Policy: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name ~ ('^' || auth.uid()::text || '-.*')
);

-- Policy: Allow public read access to all avatars
CREATE POLICY "Public read access for avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');