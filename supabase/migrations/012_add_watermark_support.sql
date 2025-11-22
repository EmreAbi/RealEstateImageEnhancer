-- Add Watermark Support to Real Estate Image Enhancer
-- This migration adds watermark functionality to images

-- ==============================================
-- 1. ADD WATERMARKED_URL TO IMAGES TABLE
-- ==============================================

-- Add watermarked_url column to store watermarked versions
ALTER TABLE images
ADD COLUMN IF NOT EXISTS watermarked_url TEXT;

-- Add watermark_settings column to store watermark configuration
ALTER TABLE images
ADD COLUMN IF NOT EXISTS watermark_settings JSONB DEFAULT NULL;

COMMENT ON COLUMN images.watermarked_url IS 'URL of the image with company watermark applied';
COMMENT ON COLUMN images.watermark_settings IS 'Watermark settings used (position, opacity, etc.)';

-- ==============================================
-- 2. UPDATE ENHANCEMENT_LOGS FOR WATERMARK TRACKING
-- ==============================================

-- Add watermark tracking to enhancement logs
ALTER TABLE enhancement_logs
ADD COLUMN IF NOT EXISTS watermark_applied BOOLEAN DEFAULT false;

ALTER TABLE enhancement_logs
ADD COLUMN IF NOT EXISTS watermark_settings JSONB DEFAULT NULL;

COMMENT ON COLUMN enhancement_logs.watermark_applied IS 'Whether watermark was applied during this operation';
COMMENT ON COLUMN enhancement_logs.watermark_settings IS 'Watermark settings used in this operation';

-- ==============================================
-- 3. CREATE INDEX FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_images_watermarked
ON images(watermarked_url) WHERE watermarked_url IS NOT NULL;

-- ==============================================
-- MIGRATION NOTES
-- ==============================================

-- Watermark settings JSON structure:
-- {
--   "position": "bottom-right" | "bottom-left" | "top-right" | "top-left",
--   "opacity": 0.3,  // 0.0 to 1.0
--   "logoUrl": "https://...",
--   "appliedAt": "2024-01-01T00:00:00Z"
-- }
