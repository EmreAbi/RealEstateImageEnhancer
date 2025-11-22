-- Set only Reve model as active and default
-- Deactivate ALL other models but keep them in database for potential future use

-- First, deactivate ALL models
UPDATE ai_models
SET is_active = false;

-- Then, activate ONLY Reve
UPDATE ai_models
SET is_active = true
WHERE model_identifier = 'fal-ai/reve/remix';
