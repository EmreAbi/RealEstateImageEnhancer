-- Fix storage bucket to be public
-- This migration fixes the 400 Bad Request error when accessing images

-- Update the images bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'images';

-- Drop old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;

-- Create new public SELECT policy
CREATE POLICY "Anyone can view images in public bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');
