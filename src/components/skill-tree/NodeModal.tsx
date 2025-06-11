import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import type { SkillNode, SkillTree, NodeLink, NodeImage } from '../../types';
import { 
  X, 
  Save, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  FileText,
  Hash,
  Link as LinkIcon,
  Calendar,
  User as UserIcon,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Download,
  Edit3
} from 'lucide-react';

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: SkillNode) => void;
  node?: SkillNode | null;
  treeId: string;
  parentNode?: SkillNode | null;
  trees: SkillTree[];
}

interface FormData {
  title: string;
  description: string;
  parentId: string | null;
  orderIndex: number;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'team';
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

interface FormErrors {
  title?: string;
  description?: string;
  orderIndex?: string;
  seoTitle?: string;
  seoDescription?: string;
  general?: string;
}

interface LinkFormData {
  title: string;
  url: string;
  description: string;
  linkType: 'internal' | 'external';
}

const NodeModal: React.FC<NodeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  node,
  treeId,
  parentNode,
  trees
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [availableNodes, setAvailableNodes] = useState<SkillNode[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  // Links state
  const [links, setLinks] = useState<NodeLink[]>([]);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState<LinkFormData>({
    title: '',
    url: '',
    description: '',
    linkType: 'external'
  });
  
  // Images state
  const [images, setImages] = useState<NodeImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    parentId: null,
    orderIndex: 0,
    status: 'published',
    visibility: 'public',
    seoTitle: '',
    seoDescription: '',
    keywords: []
  });

  const isEditMode = !!node;
  const currentTree = trees.find(tree => tree.id === treeId);

  // Load form data when modal opens or node changes
  useEffect(() => {
    if (isOpen) {
      if (node) {
        // Edit mode - populate with existing data
        setFormData({
          title: node.title || '',
          description: node.description || '',
          parentId: node.parentId || null,
          orderIndex: node.orderIndex || 0,
          status: node.status || 'published',
          visibility: node.visibility || 'public',
          seoTitle: node.seoTitle || '',
          seoDescription: node.seoDescription || '',
          keywords: node.keywords || []
        });
        loadNodeLinks(node.id);
        loadNodeImages(node.id);
      } else {
        // Add mode - reset form
        setFormData({
          title: '',
          description: '',
          parentId: parentNode?.id || null,
          orderIndex: 0,
          status: 'published',
          visibility: 'public',
          seoTitle: '',
          seoDescription: '',
          keywords: []
        });
        setLinks([]);
        setImages([]);
      }
      setErrors({});
      setSuccess(null);
      setKeywordInput('');
      setShowLinkForm(false);
      setEditingLinkId(null);
      resetLinkForm();
      loadAvailableNodes();
    }
  }, [isOpen, node, parentNode]);

  // Load available parent nodes
  const loadAvailableNodes = async () => {
    if (!treeId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('skill_nodes')
        .select('id, title, parent_id, order_index')
        .eq('tree_id', treeId)
        .order('order_index');

      if (error) throw error;

      // Filter out the current node and its descendants to prevent circular references
      let filteredNodes = data || [];
      if (node) {
        const getDescendantIds = (nodeId: string, nodes: any[]): string[] => {
          const children = nodes.filter(n => n.parent_id === nodeId);
          const descendantIds = children.map(child => child.id);
          children.forEach(child => {
            descendantIds.push(...getDescendantIds(child.id, nodes));
          });
          return descendantIds;
        };

        const excludeIds = [node.id, ...getDescendantIds(node.id, filteredNodes)];
        filteredNodes = filteredNodes.filter(n => !excludeIds.includes(n.id));
      }

      setAvailableNodes(filteredNodes.map(n => ({
        id: n.id,
        title: n.title,
        parentId: n.parent_id,
        orderIndex: n.order_index,
        treeId: treeId,
        description: '',
        createdAt: ''
      })));
    } catch (err) {
      console.error('Error loading nodes:', err);
      setErrors({ general: 'Failed to load available parent nodes' });
    } finally {
      setLoading(false);
    }
  };

  // Load node links
  const loadNodeLinks = async (nodeId: string) => {
    try {
      const { data, error } = await supabase
        .from('node_links')
        .select('*')
        .eq('node_id', nodeId)
        .order('order_index');

      if (error) throw error;

      setLinks(data?.map(link => ({
        id: link.id,
        nodeId: link.node_id,
        title: link.title,
        url: link.url,
        description: link.description,
        linkType: link.link_type,
        orderIndex: link.order_index,
        createdBy: link.created_by,
        createdAt: link.created_at
      })) || []);
    } catch (err) {
      console.error('Error loading node links:', err);
    }
  };

  // Load node images
  const loadNodeImages = async (nodeId: string) => {
    try {
      const { data, error } = await supabase
        .from('node_images')
        .select('*')
        .eq('node_id', nodeId)
        .order('uploaded_at');

      if (error) throw error;

      setImages(data?.map(image => ({
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
      })) || []);
    } catch (err) {
      console.error('Error loading node images:', err);
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Description validation
    if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Order index validation
    if (formData.orderIndex < 0) {
      newErrors.orderIndex = 'Order index must be 0 or greater';
    }

    // SEO title validation
    if (formData.seoTitle && formData.seoTitle.length > 60) {
      newErrors.seoTitle = 'SEO title should be less than 60 characters for optimal display';
    }

    // SEO description validation
    if (formData.seoDescription && formData.seoDescription.length > 160) {
      newErrors.seoDescription = 'SEO description should be less than 160 characters for optimal display';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setSaving(true);
    setErrors({});

    try {
      const nodeData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        parent_id: formData.parentId,
        order_index: formData.orderIndex,
        status: formData.status,
        visibility: formData.visibility,
        seo_title: formData.seoTitle.trim() || null,
        seo_description: formData.seoDescription.trim() || null,
        keywords: formData.keywords.length > 0 ? formData.keywords : null,
        last_modified_by: user.id,
        last_modified_at: new Date().toISOString()
      };

      let savedNodeId: string;

      if (isEditMode && node) {
        // Update existing node
        const { data, error } = await supabase
          .from('skill_nodes')
          .update({
            ...nodeData,
            version: (node.version || 1) + 1
          })
          .eq('id', node.id)
          .select()
          .single();

        if (error) throw error;
        savedNodeId = data.id;

        const updatedNode: SkillNode = {
          id: data.id,
          treeId: data.tree_id,
          parentId: data.parent_id,
          title: data.title,
          description: data.description,
          descriptionHtml: data.description_html,
          contentHtml: data.content_html,
          contentJson: data.content_json,
          seoTitle: data.seo_title,
          seoDescription: data.seo_description,
          keywords: data.keywords,
          status: data.status,
          visibility: data.visibility,
          version: data.version,
          lastModifiedBy: data.last_modified_by,
          lastModifiedAt: data.last_modified_at,
          orderIndex: data.order_index,
          createdAt: data.created_at
        };

        onSave(updatedNode);
        setSuccess('Node updated successfully!');
      } else {
        // Create new node
        const { data, error } = await supabase
          .from('skill_nodes')
          .insert({
            tree_id: treeId,
            ...nodeData
          })
          .select()
          .single();

        if (error) throw error;
        savedNodeId = data.id;

        const newNode: SkillNode = {
          id: data.id,
          treeId: data.tree_id,
          parentId: data.parent_id,
          title: data.title,
          description: data.description,
          descriptionHtml: data.description_html,
          contentHtml: data.content_html,
          contentJson: data.content_json,
          seoTitle: data.seo_title,
          seoDescription: data.seo_description,
          keywords: data.keywords,
          status: data.status,
          visibility: data.visibility,
          version: data.version,
          lastModifiedBy: data.last_modified_by,
          lastModifiedAt: data.last_modified_at,
          orderIndex: data.order_index,
          createdAt: data.created_at
        };

        onSave(newNode);
        setSuccess('Node created successfully!');
      }

      // Save links for new nodes
      if (!isEditMode && links.length > 0) {
        await saveNodeLinks(savedNodeId);
      }

      // Close modal after short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error saving node:', err);
      setErrors({ 
        general: err instanceof Error ? err.message : 'Failed to save node. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Save node links
  const saveNodeLinks = async (nodeId: string) => {
    if (links.length === 0) return;

    try {
      const linksToInsert = links.map((link, index) => ({
        node_id: nodeId,
        title: link.title,
        url: link.url,
        description: link.description,
        link_type: link.linkType,
        order_index: index,
        created_by: user!.id
      }));

      const { error } = await supabase
        .from('node_links')
        .insert(linksToInsert);

      if (error) throw error;
    } catch (err) {
      console.error('Error saving node links:', err);
    }
  };

  // Handle keyword management
  const addKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keywordToRemove)
    }));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  // Link management
  const resetLinkForm = () => {
    setLinkForm({
      title: '',
      url: '',
      description: '',
      linkType: 'external'
    });
  };

  const handleAddLink = () => {
    if (!linkForm.title.trim() || !linkForm.url.trim()) return;
    
    if (!isValidUrl(linkForm.url)) {
      alert('Please enter a valid URL');
      return;
    }

    const newLink: NodeLink = {
      id: Date.now().toString(),
      nodeId: node?.id || '',
      title: linkForm.title.trim(),
      url: linkForm.url.trim(),
      description: linkForm.description.trim(),
      linkType: linkForm.linkType,
      orderIndex: links.length,
      createdBy: user!.id,
      createdAt: new Date().toISOString()
    };

    if (editingLinkId) {
      // Update existing link
      setLinks(prev => prev.map(link => 
        link.id === editingLinkId ? { ...newLink, id: editingLinkId } : link
      ));
      setEditingLinkId(null);
    } else {
      // Add new link
      setLinks(prev => [...prev, newLink]);
    }

    resetLinkForm();
    setShowLinkForm(false);

    // Save to database if editing existing node
    if (isEditMode && node) {
      saveLink(newLink);
    }
  };

  const saveLink = async (link: NodeLink) => {
    if (!node) return;

    try {
      if (editingLinkId && editingLinkId !== link.id) {
        // Update existing link
        const { error } = await supabase
          .from('node_links')
          .update({
            title: link.title,
            url: link.url,
            description: link.description,
            link_type: link.linkType
          })
          .eq('id', editingLinkId);

        if (error) throw error;
      } else {
        // Insert new link
        const { error } = await supabase
          .from('node_links')
          .insert({
            node_id: node.id,
            title: link.title,
            url: link.url,
            description: link.description,
            link_type: link.linkType,
            order_index: link.orderIndex,
            created_by: user!.id
          });

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error saving link:', err);
    }
  };

  const handleEditLink = (link: NodeLink) => {
    setLinkForm({
      title: link.title,
      url: link.url,
      description: link.description || '',
      linkType: link.linkType
    });
    setEditingLinkId(link.id);
    setShowLinkForm(true);
  };

  const handleRemoveLink = async (linkId: string) => {
    setLinks(prev => prev.filter(link => link.id !== linkId));

    // Remove from database if editing existing node
    if (isEditMode && node) {
      try {
        const { error } = await supabase
          .from('node_links')
          .delete()
          .eq('id', linkId);

        if (error) throw error;
      } catch (err) {
        console.error('Error removing link:', err);
      }
    }
  };

  // Image management
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('node-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('node-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Create image object
      const newImage: NodeImage = {
        id: Date.now().toString(),
        nodeId: node?.id || '',
        filename: fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath: fileName,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString()
      };

      setImages(prev => [...prev, newImage]);

      // Save to database if editing existing node
      if (isEditMode && node) {
        const { error: dbError } = await supabase
          .from('node_images')
          .insert({
            node_id: node.id,
            filename: fileName,
            original_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: fileName,
            uploaded_by: user.id
          });

        if (dbError) {
          console.error('Failed to save image metadata:', dbError);
        }
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async (imageId: string, storagePath: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));

    try {
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from('node-images')
        .remove([storagePath]);

      if (storageError) {
        console.error('Error removing from storage:', storageError);
      }

      // Remove from database if editing existing node
      if (isEditMode && node) {
        const { error: dbError } = await supabase
          .from('node_images')
          .delete()
          .eq('id', imageId);

        if (dbError) {
          console.error('Error removing from database:', dbError);
        }
      }
    } catch (err) {
      console.error('Error removing image:', err);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  // Get image URL
  const getImageUrl = (image: NodeImage): string => {
    const { data } = supabase.storage
      .from('node-images')
      .getPublicUrl(image.storagePath);
    return data.publicUrl;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Auto-generate SEO title from title
  useEffect(() => {
    if (formData.title && !formData.seoTitle) {
      setFormData(prev => ({
        ...prev,
        seoTitle: prev.title.slice(0, 60)
      }));
    }
  }, [formData.title]);

  // Auto-generate SEO description from description
  useEffect(() => {
    if (formData.description && !formData.seoDescription) {
      setFormData(prev => ({
        ...prev,
        seoDescription: prev.description.slice(0, 160)
      }));
    }
  }, [formData.description]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {isEditMode ? 'Edit Node' : 'Add New Node'}
              </h3>
              <p className="text-primary-100 mt-1">
                {currentTree?.name && `in ${currentTree.name}`}
                {parentNode && ` under "${parentNode.title}"`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              disabled={saving}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                {success}
              </div>
            )}

            {/* General Error */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {errors.general}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Loading node data...
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Basic Information
                  </h4>

                  {/* Title */}
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter node title"
                      maxLength={100}
                      required
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.title.length}/100 characters
                    </p>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter node description"
                      rows={4}
                      maxLength={500}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  {/* Parent Node */}
                  <div className="mb-4">
                    <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Node
                    </label>
                    <select
                      id="parentId"
                      value={formData.parentId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">No Parent (Root Node)</option>
                      {availableNodes.map(node => (
                        <option key={node.id} value={node.id}>
                          {node.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Order Index */}
                  <div className="mb-4">
                    <label htmlFor="orderIndex" className="block text-sm font-medium text-gray-700 mb-1">
                      Order Index
                    </label>
                    <input
                      type="number"
                      id="orderIndex"
                      value={formData.orderIndex}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.orderIndex ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min={0}
                    />
                    {errors.orderIndex && (
                      <p className="mt-1 text-sm text-red-600">{errors.orderIndex}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Lower numbers appear first in the list
                    </p>
                  </div>

                  {/* Status & Visibility */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
                        Visibility
                      </label>
                      <select
                        id="visibility"
                        value={formData.visibility}
                        onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="public">Public</option>
                        <option value="team">Team Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column - Related Links */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <LinkIcon className="h-5 w-5 mr-2" />
                      Related Links
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowLinkForm(!showLinkForm)}
                      className="p-2 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Link Form */}
                  {showLinkForm && (
                    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Link title"
                          value={linkForm.title}
                          onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <input
                          type="url"
                          placeholder="URL (https://...)"
                          value={linkForm.url}
                          onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <select
                          value={linkForm.linkType}
                          onChange={(e) => setLinkForm(prev => ({ ...prev, linkType: e.target.value as 'internal' | 'external' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="external">External Link</option>
                          <option value="internal">Internal Link</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={linkForm.description}
                          onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowLinkForm(false);
                            setEditingLinkId(null);
                            resetLinkForm();
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddLink}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          {editingLinkId ? 'Update Link' : 'Add Link'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Links List */}
                  <div className="space-y-3">
                    {links.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 flex-grow">
                          {link.linkType === 'external' ? (
                            <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          ) : (
                            <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-grow min-w-0">
                            <a
                              href={link.url}
                              target={link.linkType === 'external' ? '_blank' : '_self'}
                              rel={link.linkType === 'external' ? 'noopener noreferrer' : undefined}
                              className="font-medium text-primary-600 hover:text-primary-700 transition-colors block truncate"
                              title={link.url}
                            >
                              {link.title}
                            </a>
                            {link.description && (
                              <p className="text-sm text-gray-500 truncate">{link.description}</p>
                            )}
                            <p className="text-xs text-gray-400 truncate">{link.url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditLink(link)}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Edit link"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(link.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {links.length === 0 && (
                      <p className="text-gray-500 text-center py-4 text-sm">No related links added yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Images & SEO */}
              <div className="space-y-6">
                {/* Image Upload */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <ImageIcon className="h-5 w-5 mr-2" />
                      Images
                    </h4>
                  </div>

                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragOver 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                    />
                    
                    {uploadingImage ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-2" />
                        <p className="text-sm text-gray-600">Uploading image...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          Drag & drop an image here, or{' '}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Images List */}
                  {images.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {images.map(image => (
                        <div key={image.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                          <img
                            src={getImageUrl(image)}
                            alt={image.altText || image.originalName}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-grow min-w-0">
                            <p className="font-medium text-gray-900 truncate">{image.originalName}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(image.fileSize)}</p>
                            <p className="text-xs text-gray-400">{image.mimeType}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(image.id, image.storagePath)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                            title="Remove image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SEO Settings */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    SEO Settings
                  </h4>

                  {/* SEO Title */}
                  <div className="mb-4">
                    <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.seoTitle ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="SEO-optimized title"
                      maxLength={60}
                    />
                    {errors.seoTitle && (
                      <p className="mt-1 text-sm text-red-600">{errors.seoTitle}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.seoTitle.length}/60 characters
                    </p>
                  </div>

                  {/* SEO Description */}
                  <div className="mb-4">
                    <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      SEO Description
                    </label>
                    <textarea
                      id="seoDescription"
                      value={formData.seoDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.seoDescription ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="SEO-optimized description"
                      rows={3}
                      maxLength={160}
                    />
                    {errors.seoDescription && (
                      <p className="mt-1 text-sm text-red-600">{errors.seoDescription}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.seoDescription.length}/160 characters
                    </p>
                  </div>

                  {/* Keywords */}
                  <div className="mb-4">
                    <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={handleKeywordKeyPress}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Add keyword"
                      />
                      <button
                        type="button"
                        onClick={addKeyword}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map(keyword => (
                        <span
                          key={keyword}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          <Hash className="h-3 w-3 mr-1" />
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1 text-primary-600 hover:text-primary-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {isEditMode && node && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2" />
                      Metadata
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Created: {new Date(node.createdAt).toLocaleString()}
                      </div>
                      {node.lastModifiedAt && (
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Modified: {new Date(node.lastModifiedAt).toLocaleString()}
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <FileText className="h-4 w-4 mr-2" />
                        Version: {node.version || 1}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Node' : 'Create Node'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NodeModal;