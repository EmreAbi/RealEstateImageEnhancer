-- Share Links Table
-- Allows users to generate shareable links for their images

CREATE TABLE IF NOT EXISTS share_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL, -- Random token for URL
  title TEXT,
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  password_hash TEXT, -- Optional password protection
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for share_links
CREATE POLICY "Users can view their own share links"
  ON share_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own share links"
  ON share_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share links"
  ON share_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own share links"
  ON share_links FOR DELETE
  USING (auth.uid() = user_id);

-- Public access policy for active share links
CREATE POLICY "Anyone can view active share links by token"
  ON share_links FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Indexes
CREATE INDEX idx_share_links_user_id ON share_links(user_id);
CREATE INDEX idx_share_links_image_id ON share_links(image_id);
CREATE INDEX idx_share_links_share_token ON share_links(share_token);
CREATE INDEX idx_share_links_is_active ON share_links(is_active);

-- Function to generate random share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_share_links_updated_at
  BEFORE UPDATE ON share_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
