-- Real Estate Image Enhancer Database Schema
-- Bu script'i Supabase Dashboard > SQL Editor'de çalıştırın

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- PROFILES TABLE
-- Kullanıcı profil bilgileri (Supabase Auth ile entegre)
-- ==============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  real_estate_office TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ==============================================
-- AI_MODELS TABLE
-- Kullanılabilir AI modelleri
-- ==============================================
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL, -- 'openai', 'stability-ai', 'replicate', vb.
  model_identifier TEXT NOT NULL, -- API'de kullanılacak model ID
  is_active BOOLEAN DEFAULT true,
  capabilities JSONB DEFAULT '{}', -- Model yetenekleri (örn: {"upscale": true, "enhance": true})
  pricing_info JSONB DEFAULT '{}', -- Fiyatlandırma bilgileri
  settings JSONB DEFAULT '{}', -- Model-specific ayarlar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_models (herkes okuyabilir)
CREATE POLICY "Anyone can view active AI models"
  ON ai_models FOR SELECT
  USING (is_active = true);

-- ==============================================
-- FOLDERS TABLE
-- Resim klasörleri/kategorileri
-- ==============================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0ea5e9',
  description TEXT,
  image_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- IMAGES TABLE
-- Yüklenen resimler
-- ==============================================
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  original_url TEXT NOT NULL, -- Supabase Storage URL
  enhanced_url TEXT, -- İyileştirilmiş resim URL'si
  thumbnail_url TEXT, -- Küçük önizleme
  file_size BIGINT, -- Bytes cinsinden
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'original' CHECK (status IN ('original', 'processing', 'enhanced', 'failed')),
  metadata JSONB DEFAULT '{}', -- EXIF ve diğer metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for images
CREATE POLICY "Users can view their own images"
  ON images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own images"
  ON images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
  ON images FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
  ON images FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- ENHANCEMENT_LOGS TABLE
-- AI enhancement işlem logları
-- ==============================================
CREATE TABLE IF NOT EXISTS enhancement_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE NOT NULL,
  ai_model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER, -- İşlem süresi (milisaniye)
  parameters JSONB DEFAULT '{}', -- Enhancement parametreleri
  result_url TEXT, -- Sonuç resim URL'si
  error_message TEXT,
  cost_credits DECIMAL(10, 4), -- İşlem maliyeti (kredi sistemi için)
  metadata JSONB DEFAULT '{}', -- API response ve diğer bilgiler
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE enhancement_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enhancement_logs
CREATE POLICY "Users can view their own enhancement logs"
  ON enhancement_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enhancement logs"
  ON enhancement_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enhancement logs"
  ON enhancement_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- ==============================================
-- INDEXES
-- Performans için indexler
-- ==============================================
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_folder_id ON images(folder_id);
CREATE INDEX idx_images_status ON images(status);
CREATE INDEX idx_enhancement_logs_user_id ON enhancement_logs(user_id);
CREATE INDEX idx_enhancement_logs_image_id ON enhancement_logs(image_id);
CREATE INDEX idx_enhancement_logs_status ON enhancement_logs(status);
CREATE INDEX idx_enhancement_logs_created_at ON enhancement_logs(created_at DESC);

-- ==============================================
-- FUNCTIONS
-- Yardımcı fonksiyonlar
-- ==============================================

-- Folder image count'unu otomatik güncelleme
CREATE OR REPLACE FUNCTION update_folder_image_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE folders
    SET image_count = image_count + 1,
        updated_at = NOW()
    WHERE id = NEW.folder_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE folders
    SET image_count = GREATEST(0, image_count - 1),
        updated_at = NOW()
    WHERE id = OLD.folder_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.folder_id != NEW.folder_id THEN
    UPDATE folders
    SET image_count = GREATEST(0, image_count - 1),
        updated_at = NOW()
    WHERE id = OLD.folder_id;

    UPDATE folders
    SET image_count = image_count + 1,
        updated_at = NOW()
    WHERE id = NEW.folder_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for folder image count
CREATE TRIGGER update_folder_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON images
FOR EACH ROW
EXECUTE FUNCTION update_folder_image_count();

-- Updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- INITIAL DATA
-- Başlangıç AI modelleri
-- ==============================================
INSERT INTO ai_models (name, display_name, description, provider, model_identifier, capabilities, is_active) VALUES
  (
    'openai-dalle-3',
    'DALL-E 3 Enhancement',
    'OpenAI''nin güçlü DALL-E 3 modeli ile görüntü iyileştirme',
    'openai',
    'dall-e-3',
    '{"enhance": true, "upscale": false, "style_transfer": true}',
    true
  ),
  (
    'stability-esrgan',
    'Real-ESRGAN Upscaler',
    'Yüksek kaliteli görüntü büyütme ve iyileştirme',
    'stability-ai',
    'esrgan-v1-x2plus',
    '{"enhance": true, "upscale": true, "max_scale": 4}',
    true
  ),
  (
    'replicate-realesrgan',
    'RealESRGAN (Replicate)',
    'Replicate üzerinden RealESRGAN modeli',
    'replicate',
    'nightmareai/real-esrgan',
    '{"enhance": true, "upscale": true, "max_scale": 4}',
    true
  ),
  (
    'clipdrop-cleanup',
    'ClipDrop Cleanup',
    'Görüntülerden istenmeyen nesneleri temizleme',
    'clipdrop',
    'cleanup',
    '{"cleanup": true, "remove_objects": true}',
    true
  );

-- ==============================================
-- STORAGE BUCKETS
-- Not: Bu komutları manuel olarak Supabase Dashboard'dan çalıştırmanız gerekebilir
-- Storage > Create new bucket
-- ==============================================

-- Bucket oluşturma için SQL (Dashboard'dan da yapılabilir)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies (buckets oluşturulduktan sonra):
/*
-- Images bucket policies
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Thumbnails bucket policies (public)
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload their own thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
*/
