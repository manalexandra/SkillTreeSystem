import { supabase } from './supabase';
import type { SkillNode } from '../types';

export interface NodeContent {
  id: string;
  nodeId: string;
  contentHtml: string;
  contentJson?: any;
  contentText?: string;
  version: number;
  createdBy: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface NodeMetadata {
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'team';
  version: number;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface NodeTag {
  id: string;
  nodeId: string;
  tag: string;
  createdBy: string;
  createdAt: string;
}

export interface NodeLink {
  id: string;
  nodeId: string;
  title: string;
  url: string;
  description?: string;
  linkType: 'internal' | 'external';
  orderIndex: number;
  createdBy: string;
  createdAt: string;
}

export interface NodeImage {
  id: string;
  nodeId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  altText?: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Content sanitization function
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - remove dangerous elements and attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gi, '');
};

// Extract plain text from HTML for search indexing
export const extractTextFromHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Save node content with versioning
export const saveNodeContent = async (
  nodeId: string,
  contentHtml: string,
  contentJson?: any,
  userId?: string
): Promise<NodeContent | null> => {
  try {
    // Sanitize HTML content
    const sanitizedHtml = sanitizeHtml(contentHtml);
    const contentText = extractTextFromHtml(sanitizedHtml);

    // Get current version number
    const { data: currentContent } = await supabase
      .from('node_content')
      .select('version')
      .eq('node_id', nodeId)
      .eq('is_current', true)
      .single();

    const newVersion = (currentContent?.version || 0) + 1;

    // Mark previous version as not current
    if (currentContent) {
      await supabase
        .from('node_content')
        .update({ is_current: false })
        .eq('node_id', nodeId)
        .eq('is_current', true);
    }

    // Insert new content version
    const { data, error } = await supabase
      .from('node_content')
      .insert({
        node_id: nodeId,
        content_html: sanitizedHtml,
        content_json: contentJson,
        content_text: contentText,
        version: newVersion,
        created_by: userId,
        is_current: true
      })
      .select()
      .single();

    if (error) throw error;

    // Update the skill_nodes table with the new content
    await supabase
      .from('skill_nodes')
      .update({
        content_html: sanitizedHtml,
        content_json: contentJson,
        version: newVersion,
        last_modified_by: userId,
        last_modified_at: new Date().toISOString()
      })
      .eq('id', nodeId);

    return {
      id: data.id,
      nodeId: data.node_id,
      contentHtml: data.content_html,
      contentJson: data.content_json,
      contentText: data.content_text,
      version: data.version,
      createdBy: data.created_by,
      createdAt: data.created_at,
      isCurrent: data.is_current
    };
  } catch (error) {
    console.error('Error saving node content:', error);
    return null;
  }
};

// Get node content
export const getNodeContent = async (nodeId: string): Promise<NodeContent | null> => {
  try {
    const { data, error } = await supabase
      .from('node_content')
      .select('*')
      .eq('node_id', nodeId)
      .eq('is_current', true)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      nodeId: data.node_id,
      contentHtml: data.content_html,
      contentJson: data.content_json,
      contentText: data.content_text,
      version: data.version,
      createdBy: data.created_by,
      createdAt: data.created_at,
      isCurrent: data.is_current
    };
  } catch (error) {
    console.error('Error getting node content:', error);
    return null;
  }
};

// Get content version history
export const getContentVersions = async (nodeId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('content_versions')
      .select('*')
      .eq('node_id', nodeId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting content versions:', error);
    return [];
  }
};

// Save node metadata
export const saveNodeMetadata = async (
  nodeId: string,
  metadata: Partial<NodeMetadata>,
  userId?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('skill_nodes')
      .update({
        seo_title: metadata.seoTitle,
        seo_description: metadata.seoDescription,
        keywords: metadata.keywords,
        status: metadata.status,
        visibility: metadata.visibility,
        last_modified_by: userId,
        last_modified_at: new Date().toISOString()
      })
      .eq('id', nodeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving node metadata:', error);
    return false;
  }
};

// Tag management
export const getNodeTags = async (nodeId: string): Promise<NodeTag[]> => {
  try {
    const { data, error } = await supabase
      .from('node_tags')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at');

    if (error) throw error;
    return data?.map(tag => ({
      id: tag.id,
      nodeId: tag.node_id,
      tag: tag.tag,
      createdBy: tag.created_by,
      createdAt: tag.created_at
    })) || [];
  } catch (error) {
    console.error('Error getting node tags:', error);
    return [];
  }
};

export const addNodeTag = async (
  nodeId: string,
  tag: string,
  userId: string
): Promise<NodeTag | null> => {
  try {
    const { data, error } = await supabase
      .from('node_tags')
      .insert({
        node_id: nodeId,
        tag: tag.toLowerCase().trim(),
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      nodeId: data.node_id,
      tag: data.tag,
      createdBy: data.created_by,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error adding node tag:', error);
    return null;
  }
};

export const removeNodeTag = async (nodeId: string, tag: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('node_tags')
      .delete()
      .eq('node_id', nodeId)
      .eq('tag', tag.toLowerCase().trim());

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing node tag:', error);
    return false;
  }
};

// Link management
export const getNodeLinks = async (nodeId: string): Promise<NodeLink[]> => {
  try {
    const { data, error } = await supabase
      .from('node_links')
      .select('*')
      .eq('node_id', nodeId)
      .order('order_index');

    if (error) throw error;
    return data?.map(link => ({
      id: link.id,
      nodeId: link.node_id,
      title: link.title,
      url: link.url,
      description: link.description,
      linkType: link.link_type,
      orderIndex: link.order_index,
      createdBy: link.created_by,
      createdAt: link.created_at
    })) || [];
  } catch (error) {
    console.error('Error getting node links:', error);
    return [];
  }
};

export const addNodeLink = async (
  nodeId: string,
  linkData: Omit<NodeLink, 'id' | 'nodeId' | 'createdAt'>,
  userId: string
): Promise<NodeLink | null> => {
  try {
    const { data, error } = await supabase
      .from('node_links')
      .insert({
        node_id: nodeId,
        title: linkData.title,
        url: linkData.url,
        description: linkData.description,
        link_type: linkData.linkType,
        order_index: linkData.orderIndex,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      nodeId: data.node_id,
      title: data.title,
      url: data.url,
      description: data.description,
      linkType: data.link_type,
      orderIndex: data.order_index,
      createdBy: data.created_by,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error adding node link:', error);
    return null;
  }
};

export const removeNodeLink = async (linkId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('node_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing node link:', error);
    return false;
  }
};

// Image management
export const getNodeImages = async (nodeId: string): Promise<NodeImage[]> => {
  try {
    const { data, error } = await supabase
      .from('node_images')
      .select('*')
      .eq('node_id', nodeId)
      .order('uploaded_at');

    if (error) throw error;
    return data?.map(image => ({
      id: image.id,
      nodeId: image.node_id,
      filename: image.filename,
      originalName: image.original_name,
      fileSize: image.file_size,
      mimeType: image.mime_type,
      storagePath: image.storage_path,
      altText: image.alt_text,
      caption: image.caption,
      uploadedBy: image.uploaded_by,
      uploadedAt: image.uploaded_at
    })) || [];
  } catch (error) {
    console.error('Error getting node images:', error);
    return [];
  }
};

// Search content
export const searchContent = async (query: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('node_content')
      .select(`
        *,
        skill_nodes (
          id,
          title,
          tree_id,
          skill_trees (
            id,
            name
          )
        )
      `)
      .textSearch('content_text', query)
      .eq('is_current', true)
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
};