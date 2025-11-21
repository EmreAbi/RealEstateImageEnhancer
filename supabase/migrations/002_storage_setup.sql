-- Storage Buckets ve Policies
-- Bu script'i Supabase Dashboard > SQL Editor'de çalıştırın
-- Not: Önce Dashboard'dan buckets oluşturmanız gerekebilir

-- ==============================================
-- STORAGE BUCKETS
-- ==============================================

-- 'images' bucket (public - kullanıcılar resimlerini public URL ile paylaşabilir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- 'thumbnails' bucket (public - herkes görebilir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- STORAGE POLICIES - IMAGES BUCKET
-- ==============================================

-- Herkes public bucket'taki resimleri görebilir (bucket zaten public)
CREATE POLICY "Anyone can view images in public bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Kullanıcılar kendi resimlerini yükleyebilir
-- Path format: {user_id}/{folder_id}/{filename}
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Kullanıcılar kendi resimlerini güncelleyebilir
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Kullanıcılar kendi resimlerini silebilir
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- STORAGE POLICIES - THUMBNAILS BUCKET
-- ==============================================

-- Herkes thumbnails görebilir (public bucket)
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- Kullanıcılar kendi thumbnail'lerini yükleyebilir
CREATE POLICY "Users can upload their own thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Kullanıcılar kendi thumbnail'lerini silebilir
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
