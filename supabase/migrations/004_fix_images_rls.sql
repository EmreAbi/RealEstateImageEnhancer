-- Debug and fix RLS policies for images table
-- This script helps diagnose and fix image visibility issues

-- First, let's check current policies
-- Run this in Supabase SQL Editor to see current policies:
-- SELECT * FROM pg_policies WHERE tablename = 'images';

-- Drop existing SELECT policy and recreate it
DROP POLICY IF EXISTS "Users can view their own images" ON images;

-- Recreate SELECT policy with explicit casting
CREATE POLICY "Users can view their own images"
  ON images FOR SELECT
  USING (auth.uid() = user_id);

-- Ensure INSERT policy exists
DROP POLICY IF EXISTS "Users can create their own images" ON images;
CREATE POLICY "Users can create their own images"
  ON images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Users can update their own images" ON images;
CREATE POLICY "Users can update their own images"
  ON images FOR UPDATE
  USING (auth.uid() = user_id);

-- Ensure DELETE policy exists
DROP POLICY IF EXISTS "Users can delete their own images" ON images;
CREATE POLICY "Users can delete their own images"
  ON images FOR DELETE
  USING (auth.uid() = user_id);

-- Test query to verify RLS is working
-- Run this while authenticated to test:
-- SELECT id, name, user_id, folder_id, created_at FROM images;
