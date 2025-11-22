-- Add Credit System to Real Estate Image Enhancer
-- This migration adds user credits functionality
-- Each new user gets 30 free enhancement credits

-- ==============================================
-- 1. ADD CREDITS COLUMN TO PROFILES
-- ==============================================

-- Add credits_remaining column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS credits_remaining DECIMAL(10, 2) DEFAULT 30.00;

-- Update existing users to have 30 credits
UPDATE profiles
SET credits_remaining = 30.00
WHERE credits_remaining IS NULL;

-- ==============================================
-- 2. UPDATE AUTO-CREATE PROFILE FUNCTION
-- ==============================================

-- Update the handle_new_user function to include initial credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, real_estate_office, email, credits_remaining)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'real_estate_office', 'Real Estate Office'),
    NEW.email,
    30.00 -- Initial free credits for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. CREATE CREDIT DEDUCTION FUNCTION
-- ==============================================

-- Function to deduct credits from user balance
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance DECIMAL(10, 2);
BEGIN
  -- Get current balance with row lock
  SELECT credits_remaining INTO current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE profiles
  SET credits_remaining = credits_remaining - p_amount,
      updated_at = TIMEZONE('utc', NOW())
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 4. CREATE CREDIT REFUND FUNCTION
-- ==============================================

-- Function to refund credits (in case of failed enhancement)
CREATE OR REPLACE FUNCTION public.refund_user_credits(
  p_user_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits_remaining = credits_remaining + p_amount,
      updated_at = TIMEZONE('utc', NOW())
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 5. UPDATE ENHANCEMENT_LOGS DEFAULT COST
-- ==============================================

-- Set default cost for enhancements to 1 credit
ALTER TABLE enhancement_logs
ALTER COLUMN cost_credits SET DEFAULT 1.00;

-- Update existing logs that don't have cost set
UPDATE enhancement_logs
SET cost_credits = 1.00
WHERE cost_credits IS NULL;

-- ==============================================
-- 6. CREATE VIEW FOR USER CREDIT HISTORY
-- ==============================================

-- View to easily see credit usage history with image details
CREATE OR REPLACE VIEW user_credit_history AS
SELECT
  el.id,
  el.user_id,
  el.image_id,
  el.status,
  el.cost_credits,
  el.created_at,
  el.completed_at,
  el.duration_ms,
  i.name as image_name,
  i.original_url,
  am.display_name as ai_model_name,
  am.provider as ai_provider
FROM enhancement_logs el
LEFT JOIN images i ON el.image_id = i.id
LEFT JOIN ai_models am ON el.ai_model_id = am.id
ORDER BY el.created_at DESC;

-- Grant select permission on view
ALTER VIEW user_credit_history OWNER TO postgres;

-- RLS Policy for the view
CREATE POLICY "Users can view their own credit history"
  ON enhancement_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ==============================================
-- 7. CREATE INDEX FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_profiles_credits
ON profiles(credits_remaining);

CREATE INDEX IF NOT EXISTS idx_enhancement_logs_cost
ON enhancement_logs(cost_credits, created_at DESC);

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON COLUMN profiles.credits_remaining IS 'Number of enhancement credits remaining for user. Each enhancement costs 1 credit by default.';
COMMENT ON FUNCTION public.deduct_user_credits IS 'Deducts credits from user balance. Returns false if insufficient credits.';
COMMENT ON FUNCTION public.refund_user_credits IS 'Refunds credits to user balance (used when enhancement fails).';
COMMENT ON VIEW user_credit_history IS 'Complete view of user credit usage with image and model details. Logs remain even after image deletion.';
