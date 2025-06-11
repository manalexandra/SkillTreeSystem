/*
  # Rich Text Editor Implementation
  
  1. New Tables
    - node_content: Rich content storage with versioning
    - node_images: Image management for nodes
    - content_versions: Version history tracking
    - node_tags: Tag management system
    - node_links: Related links management
  
  2. Changes
    - Add rich content fields to skill_nodes table
    - Add content versioning and metadata
    - Add SEO and visibility controls
  
  3. Security
    - Enable RLS on all new tables
    - Add policies for content access control
    - Implement HTML sanitization
  
  4. Storage
    - Create node-images bucket for media storage
    - Add storage policies for image management
*/

-- Add rich content fields to skill_nodes
ALTER TABLE skill_nodes 
ADD COLUMN IF NOT EXISTS content_html TEXT,
ADD COLUMN IF NOT EXISTS content_json JSONB,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'team')),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT now();

-- Create node_content table for rich content storage
CREATE TABLE IF NOT EXISTS node_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  content_html TEXT NOT NULL,
  content_json JSONB,
  content_text TEXT, -- Plain text version for search
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT true,
  UNIQUE(node_id, version)
);

-- Create node_images table for image management
CREATE TABLE IF NOT EXISTS node_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Create content_versions table for version history
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_html TEXT,
  content_json JSONB,
  metadata JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  change_summary TEXT,
  UNIQUE(node_id, version)
);

-- Create node_tags table for tag management
CREATE TABLE IF NOT EXISTS node_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(node_id, tag)
);

-- Create node_links table for related links
CREATE TABLE IF NOT EXISTS node_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  link_type TEXT DEFAULT 'external' CHECK (link_type IN ('internal', 'external')),
  order_index INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE node_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_links ENABLE ROW LEVEL SECURITY;

-- Policies for node_content
CREATE POLICY "Users can view content for accessible nodes"
  ON node_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_content.node_id
      AND (
        st.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_skill_trees ust
          WHERE ust.tree_id = st.id AND ust.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Managers can manage content for their trees"
  ON node_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_content.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

-- Policies for node_images
CREATE POLICY "Users can view images for accessible nodes"
  ON node_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
      AND (
        st.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_skill_trees ust
          WHERE ust.tree_id = st.id AND ust.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Managers can manage images for their trees"
  ON node_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_images.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view versions for accessible nodes"
  ON content_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = content_versions.node_id
      AND (
        st.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_skill_trees ust
          WHERE ust.tree_id = st.id AND ust.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Managers can manage versions for their trees"
  ON content_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = content_versions.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

CREATE POLICY "Users can view tags for accessible nodes"
  ON node_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_tags.node_id
      AND (
        st.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_skill_trees ust
          WHERE ust.tree_id = st.id AND ust.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Managers can manage tags for their trees"
  ON node_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_tags.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

CREATE POLICY "Users can view links for accessible nodes"
  ON node_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_links.node_id
      AND (
        st.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_skill_trees ust
          WHERE ust.tree_id = st.id AND ust.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Managers can manage links for their trees"
  ON node_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_nodes sn
      JOIN skill_trees st ON st.id = sn.tree_id
      WHERE sn.id = node_links.node_id
      AND st.created_by = auth.uid()
      AND check_user_role(auth.uid(), 'manager')
    )
  );

-- Create storage bucket for node images
INSERT INTO storage.buckets (id, name, public)
VALUES ('node-images', 'node-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for node images
CREATE POLICY "Node images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'node-images');

CREATE POLICY "Managers can upload node images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'node-images'
    AND check_user_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers can update node images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'node-images'
    AND check_user_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers can delete node images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'node-images'
    AND check_user_role(auth.uid(), 'manager')
  );

-- Function to create content version
CREATE OR REPLACE FUNCTION create_content_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new version when content is updated
  IF TG_OP = 'UPDATE' AND (
    OLD.content_html IS DISTINCT FROM NEW.content_html OR
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description
  ) THEN
    INSERT INTO content_versions (
      node_id,
      version,
      title,
      description,
      content_html,
      content_json,
      metadata,
      created_by,
      change_summary
    ) VALUES (
      NEW.id,
      NEW.version,
      NEW.title,
      NEW.description,
      NEW.content_html,
      NEW.content_json,
      jsonb_build_object(
        'seo_title', NEW.seo_title,
        'seo_description', NEW.seo_description,
        'keywords', NEW.keywords,
        'status', NEW.status,
        'visibility', NEW.visibility
      ),
      NEW.last_modified_by,
      'Content updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for version history
CREATE TRIGGER skill_nodes_version_trigger
  AFTER UPDATE ON skill_nodes
  FOR EACH ROW
  EXECUTE FUNCTION create_content_version();

-- Function to sanitize HTML content
CREATE OR REPLACE FUNCTION sanitize_html_content(content TEXT)
RETURNS TEXT AS $$
DECLARE
  sanitized_content TEXT;
BEGIN
  -- Basic HTML sanitization - remove script tags and dangerous attributes
  -- Remove script tags
  sanitized_content := regexp_replace(content, '<script[^>]*>.*?</script>', '', 'gi');
  
  -- Remove event handlers (onclick, onload, etc.)
  sanitized_content := regexp_replace(sanitized_content, 'on[a-z]+\s*=\s*"[^"]*"', '', 'gi');
  sanitized_content := regexp_replace(sanitized_content, 'on[a-z]+\s*=\s*''[^'']*''', '', 'gi');
  
  -- Remove javascript: protocol
  sanitized_content := regexp_replace(sanitized_content, 'javascript:', '', 'gi');
  
  -- Remove data: protocol for images (potential XSS vector)
  sanitized_content := regexp_replace(sanitized_content, 'src\s*=\s*"data:[^"]*"', '', 'gi');
  sanitized_content := regexp_replace(sanitized_content, 'src\s*=\s*''data:[^'']*''', '', 'gi');
  
  RETURN sanitized_content;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_node_content_node_id ON node_content(node_id);
CREATE INDEX IF NOT EXISTS idx_node_content_current ON node_content(node_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_node_images_node_id ON node_images(node_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_node_id ON content_versions(node_id, version);
CREATE INDEX IF NOT EXISTS idx_node_tags_node_id ON node_tags(node_id);
CREATE INDEX IF NOT EXISTS idx_node_links_node_id ON node_links(node_id, order_index);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_status ON skill_nodes(status);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_visibility ON skill_nodes(visibility);

-- Add full-text search index for content
CREATE INDEX IF NOT EXISTS idx_node_content_search ON node_content USING gin(to_tsvector('english', content_text));