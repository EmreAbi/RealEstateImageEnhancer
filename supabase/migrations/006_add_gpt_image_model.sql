-- Ensure GPT-Image-1 model metadata exists and is active
DO $$
DECLARE
  prompt_text text := $prompt$You are a professional real estate photo enhancement AI.
Improve the lighting and overall clarity of this interior photo while keeping all materials exactly as they are in real life.

The parquet / wooden floor must remain completely natural:

Do NOT make it look new

Do NOT make it look glossy

Do NOT change its color or texture

Keep all natural scratches, wear marks and wood grain exactly the same

Lighting & Camera Adjustment Only:

Improve overall exposure with soft, realistic daylight

Balance shadows and highlights

Correct white balance to a neutral, true-to-life tone

Slight contrast & clarity adjustment for camera-like result

Cleaning Rules:

Only remove dust, small stains and dirt smudges from walls, windows and surfaces

Do NOT smooth, repaint or redesign any surface

Do NOT erase natural aging or usage marks

Materials Protection:

Walls, floors, doors, windows, radiators and frames must remain exactly the same

No color change

No texture enhancement

No surface replacement

Final Look:

Must look like the same room,
Just photographed with better light and a professional camera
Not renovated, not retouched, not polished.
Important: The floor must look slightly used and lived-in, not showroom or newly installed.$prompt$;
BEGIN
  INSERT INTO ai_models (
    name,
    display_name,
    description,
    provider,
    model_identifier,
    is_active,
    capabilities,
    settings
  ) VALUES (
    'openai-gpt-image-1',
    'OpenAI GPT-Image Interior Enhancer',
    'OpenAI GPT-Image-1 tuned for interior real estate photos focusing on lighting and clarity.',
    'openai',
    'gpt-image-1',
    true,
    '{"enhance": true, "lighting": true, "cleanup": true}'::jsonb,
    jsonb_build_object('default_prompt', prompt_text)
  )
  ON CONFLICT (name) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        provider = EXCLUDED.provider,
        model_identifier = EXCLUDED.model_identifier,
        is_active = true,
        capabilities = EXCLUDED.capabilities,
        settings = EXCLUDED.settings,
        updated_at = TIMEZONE('utc', NOW());
END $$;
