-- Add FAL.AI Flux-Pro model as alternative provider

-- First, ensure model_identifier has a unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ai_models_model_identifier_key'
  ) THEN
    ALTER TABLE ai_models ADD CONSTRAINT ai_models_model_identifier_key UNIQUE (model_identifier);
  END IF;
END $$;

-- Now insert the FAL.AI models
DO $fal$
DECLARE
  prompt_text TEXT;
BEGIN
  prompt_text := 'You are a professional real estate photo enhancement AI.
Improve the lighting and overall clarity of this interior photo while keeping all materials exactly as they are in real life.

The parquet / wooden floor must remain completely natural:
- Do NOT make it look new
- Do NOT make it look glossy
- Do NOT change its color or texture
- Keep all natural scratches, wear marks and wood grain exactly the same

Lighting & Camera Adjustment Only:
- Improve overall exposure with soft, realistic daylight
- Balance shadows and highlights
- Correct white balance to a neutral, true-to-life tone
- Slight contrast & clarity adjustment for camera-like result

Cleaning Rules:
- Only remove dust, small stains and dirt smudges from walls, windows and surfaces
- Do NOT smooth, repaint or redesign any surface
- Do NOT erase natural aging or usage marks

Materials Protection:
- Walls, floors, doors, windows, radiators and frames must remain exactly the same
- No color change
- No texture enhancement
- No surface replacement

Final Look:
- Must look like the same room
- Just photographed with better light and a professional camera
- Not renovated, not retouched, not polished
- Important: The floor must look slightly used and lived-in, not showroom or newly installed.';

  -- FAL.AI Flux Pro
  INSERT INTO ai_models (
    model_identifier,
    name,
    provider,
    display_name,
    description,
    is_active,
    settings
  ) VALUES (
    'fal-ai/flux-pro',
    'fal_ai_flux_pro',
    'fal-ai',
    'FAL.AI Flux Pro',
    'High-quality image enhancement using FAL.AI Flux Pro model',
    true,
    jsonb_build_object(
      'default_prompt', prompt_text,
      'image_size', 'square_hd',
      'num_inference_steps', 28,
      'guidance_scale', 3.5,
      'num_images', 1,
      'enable_safety_checker', true,
      'output_format', 'png'
    )
  )
  ON CONFLICT (model_identifier) 
  DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    settings = EXCLUDED.settings,
    updated_at = now();

  -- FAL.AI Reve Remix
  INSERT INTO ai_models (
    model_identifier,
    name,
    provider,
    display_name,
    description,
    is_active,
    settings
  ) VALUES (
    'fal-ai/reve/remix',
    'fal_ai_reve_remix',
    'fal-ai',
    'FAL.AI Reve Remix',
    'AI-powered image remixing and enhancement with creative control',
    true,
    jsonb_build_object(
      'default_prompt', prompt_text,
      'image_size', 'square_hd',
      'guidance_scale', 3.5,
      'num_inference_steps', 28,
      'strength', 0.6,
      'num_images', 1,
      'enable_safety_checker', true,
      'output_format', 'png'
    )
  )
  ON CONFLICT (model_identifier) 
  DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    settings = EXCLUDED.settings,
    updated_at = now();

  -- FAL.AI Nano Banana Pro
  INSERT INTO ai_models (
    model_identifier,
    name,
    provider,
    display_name,
    description,
    is_active,
    settings
  ) VALUES (
    'fal-ai/nano-banana-pro/edit',
    'fal_ai_nano_banana_pro',
    'fal-ai',
    'FAL.AI Nano Banana Pro',
    'Fast and efficient image editing with high quality results',
    true,
    jsonb_build_object(
      'default_prompt', prompt_text,
      'guidance_scale', 3.5,
      'num_inference_steps', 20,
      'strength', 0.7,
      'num_images', 1,
      'enable_safety_checker', true,
      'output_format', 'png'
    )
  )
  ON CONFLICT (model_identifier) 
  DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    settings = EXCLUDED.settings,
    updated_at = now();
END;
$fal$;
