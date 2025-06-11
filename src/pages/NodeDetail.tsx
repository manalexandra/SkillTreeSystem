import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSkillTreeStore } from "../stores/skillTreeStore";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import NodeDescriptionEditor from "../components/node/NodeDescriptionEditor";
import NodeProgress from "../components/node/NodeProgress";
import NodeComments from "../components/node/NodeComments";
import type { SkillNode, NodeComment, User } from "../types";
import { 
  ArrowLeft, 
  GitBranchPlus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  ChevronRight,
  Trophy,
  Target,
  XCircle,
  Star,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Share2,
  Printer,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  History,
  Settings,
  User as UserIcon,
  Calendar,
  Globe,
  Lock,
  FileText,
  Hash,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  Download
} from "lucide-react";
import { supabase } from "../services/supabase";

interface NodeMetadata {
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  author?: string;
  publishedAt?: string;
  lastModified?: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'team';
  version: number;
}

interface RelatedLink {
  id: string;
  title: string;
  url: string;
  type: 'internal' | 'external';
  description?: string;
}

// UUID validation function
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const NodeDetail: React.FC = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { nodes, markNodeCompleted, userProgress } = useSkillTreeStore();
  const [node, setNode] = useState<SkillNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<NodeComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Admin-specific state
  const [metadata, setMetadata] = useState<NodeMetadata>({
    status: 'published',
    visibility: 'public',
    version: 1
  });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([]);
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'external' as 'internal' | 'external', description: '' });
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const isManager = user?.role === 'manager';

  useEffect(() => {
    if (!user || !nodeId) return;
    
    // Validate UUID format before making any database calls
    if (!isValidUUID(nodeId)) {
      setLoading(false);
      setNode(null);
      setError('Invalid node ID format');
      return;
    }
    
    const loadNodeData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get node details
        const { data: nodeData, error: nodeError } = await supabase
          .from('skill_nodes')
          .select('*')
          .eq('id', nodeId)
          .single();

        if (nodeError) throw nodeError;
        if (!nodeData) throw new Error('Node not found');

        // Get node progress
        const { data: progressData } = await supabase
          .from('node_progress')
          .select('score')
          .eq('node_id', nodeId)
          .eq('user_id', user.id)
          .maybeSingle();

        const nodeWithProgress = {
          id: nodeData.id,
          treeId: nodeData.tree_id,
          parentId: nodeData.parent_id,
          title: nodeData.title,
          description: nodeData.description,
          descriptionHtml: nodeData.description_html,
          orderIndex: nodeData.order_index,
          createdAt: nodeData.created_at,
          progress: progressData?.score || 0,
          completed: userProgress[nodeId] || false
        };

        setNode(nodeWithProgress);
        setProgress(progressData?.score || 0);

        // Load metadata (mock for now - would come from a metadata table)
        setMetadata({
          seoTitle: nodeData.title,
          seoDescription: nodeData.description?.substring(0, 160),
          keywords: ['skill', 'learning', 'development'],
          author: 'System',
          publishedAt: nodeData.created_at,
          lastModified: nodeData.created_at,
          status: 'published',
          visibility: 'public',
          version: 1
        });

        // Load tags (mock data)
        setTags(['skill', 'learning', 'development']);

        // Load related links (mock data)
        setRelatedLinks([
          {
            id: '1',
            title: 'Related Documentation',
            url: 'https://example.com/docs',
            type: 'external',
            description: 'Additional learning resources'
          }
        ]);

        // Load comments if user has access
        if (isManager || nodeWithProgress.completed) {
          loadComments();
        }
      } catch (err) {
        console.error('Error loading node:', err);
        setError('Failed to load node data');
      } finally {
        setLoading(false);
      }
    };

    loadNodeData();
  }, [nodeId, user, userProgress, isManager]);

  const loadComments = async () => {
    if (!nodeId) return;
    
    setLoadingComments(true);
    try {
      // First get the comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('node_comments')
        .select('*')
        .eq('node_id', nodeId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Then get the user details for each comment
      const commentsWithUsers = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', comment.user_id)
            .single();

          if (userError) {
            console.warn('Could not load user data for comment:', comment.id);
            return {
              ...comment,
              user: {
                id: comment.user_id,
                email: 'Unknown User',
                first_name: 'Unknown',
                last_name: 'User'
              }
            };
          }

          return {
            ...comment,
            user: userData
          };
        })
      );

      setComments(commentsWithUsers);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (content: string) => {
    if (!user || !nodeId) return;

    try {
      const { data, error } = await supabase
        .from('node_comments')
        .insert({
          node_id: nodeId,
          user_id: user.id,
          content
        })
        .select('*')
        .single();

      if (error) throw error;

      // Get the user data for the new comment
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const commentWithUser = {
        ...data,
        user: userData || {
          id: user.id,
          email: user.email,
          first_name: user.first_name || 'Unknown',
          last_name: user.last_name || 'User'
        }
      };

      setComments(prev => [...prev, commentWithUser]);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const handleUpdateDescription = async (html: string) => {
    if (!node || !isManager) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('skill_nodes')
        .update({
          description_html: html,
          title: node.title
        })
        .eq('id', node.id);

      if (error) throw error;
      
      setNode(prev => prev ? { ...prev, descriptionHtml: html } : null);
    } catch (err) {
      setError("Failed to update description");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async (score: number) => {
    if (!node || !user) return;
    
    try {
      const { error } = await supabase
        .from('node_progress')
        .upsert({
          node_id: node.id,
          user_id: user.id,
          score
        });

      if (error) throw error;
      
      setProgress(score);
      
      if (score === 10) {
        setShowCompletionModal(true);
      }
    } catch (err) {
      setError("Failed to update progress");
      console.error(err);
    }
  };

  const handleMarkAsComplete = async () => {
    if (!node || !user) return;
    
    try {
      await markNodeCompleted(user.id, node.id, true);
      setShowCompletionModal(false);
    } catch (err) {
      setError("Failed to mark skill as complete");
      console.error(err);
    }
  };

  const handleSaveMetadata = async () => {
    if (!node || !isManager) return;

    setSaving(true);
    try {
      // In a real implementation, this would save to a metadata table
      console.log('Saving metadata:', metadata);
      // Mock save
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError("Failed to save metadata");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleAddLink = () => {
    if (newLink.title.trim() && newLink.url.trim()) {
      const link: RelatedLink = {
        id: Date.now().toString(),
        title: newLink.title.trim(),
        url: newLink.url.trim(),
        type: newLink.type,
        description: newLink.description.trim() || undefined
      };
      setRelatedLinks(prev => [...prev, link]);
      setNewLink({ title: '', url: '', type: 'external', description: '' });
      setShowLinkForm(false);
    }
  };

  const handleRemoveLink = (linkId: string) => {
    setRelatedLinks(prev => prev.filter(link => link.id !== linkId));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('node-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('node-images')
        .getPublicUrl(fileName);

      // Insert image URL into editor at cursor position
      const imageUrl = urlData.publicUrl;
      console.log('Image uploaded:', imageUrl);
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: node?.title,
          text: node?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading skill details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!node) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-error-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Skill Not Found</h2>
            <p className="text-gray-600 mb-4">
              The skill you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  const isCompleted = userProgress[node.id] === true;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link to="/dashboard" className="hover:text-primary-600">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/roadmap" className="hover:text-primary-600">Roadmap</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">{node.title}</span>
          </nav>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <Link
                      to="/dashboard"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <GitBranchPlus className="h-6 w-6 text-primary-600" />
                  </div>
                  
                  {isEditing && isManager ? (
                    <input
                      type="text"
                      value={node.title}
                      onChange={(e) => setNode(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="text-2xl font-bold text-gray-900 mb-2 w-full border-b border-gray-300 focus:border-primary-500 outline-none"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{node.title}</h1>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Created {new Date(node.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      Progress: {progress}/10
                    </div>
                    {metadata.author && (
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {metadata.author}
                      </div>
                    )}
                    {metadata.lastModified && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Updated {new Date(metadata.lastModified).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Action Buttons */}
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    title="Share"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    title="Print"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                  {isManager && (
                    <>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2 transition-colors ${
                          isEditing ? 'text-primary-600' : 'text-gray-400 hover:text-primary-600'
                        }`}
                        title={isEditing ? "Exit Edit Mode" : "Edit"}
                      >
                        {isEditing ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => setShowVersionHistory(!showVersionHistory)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Version History"
                      >
                        <History className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                  {error && (
                    <div className="bg-error-50 text-error-700 px-4 py-2 rounded-lg text-sm flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                      {isEditing && isManager && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-primary-600 hover:text-primary-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditing && isManager && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add tag..."
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddTag}
                        className="p-1 text-primary-600 hover:text-primary-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className={`p-4 ${
              isCompleted 
                ? 'bg-green-50 border-t border-green-100' 
                : progress === 10 
                  ? 'bg-yellow-50 border-t border-yellow-100'
                  : 'bg-gray-50 border-t border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {isCompleted ? (
                    <>
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-green-700">Completed!</div>
                        <div className="text-sm text-green-600">
                          You've mastered this skill
                        </div>
                      </div>
                    </>
                  ) : progress === 10 ? (
                    <>
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-yellow-700">Ready to Complete!</div>
                        <div className="text-sm text-yellow-600">
                          You've reached maximum progress
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Star className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-blue-700">In Progress</div>
                        <div className="text-sm text-blue-600">
                          Keep going! {10 - progress} more points to complete
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {progress === 10 && !isCompleted && (
                  <button
                    onClick={() => setShowCompletionModal(true)}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Trophy className="h-5 w-5 mr-2" />
                    Complete Skill
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                  {isManager && isEditing && (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors cursor-pointer"
                        title="Upload Image"
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </label>
                    </div>
                  )}
                </div>
                <NodeDescriptionEditor
                  content={node.descriptionHtml || node.description}
                  onChange={handleUpdateDescription}
                  readOnly={!isManager || !isEditing}
                />
                {saving && (
                  <p className="text-sm text-gray-500 mt-2">Saving changes...</p>
                )}
              </div>

              {/* Related Links */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Related Links</h3>
                  {isManager && isEditing && (
                    <button
                      onClick={() => setShowLinkForm(!showLinkForm)}
                      className="p-2 text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {showLinkForm && isManager && isEditing && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Link title"
                        value={newLink.title}
                        onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={newLink.url}
                        onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <select
                        value={newLink.type}
                        onChange={(e) => setNewLink(prev => ({ ...prev, type: e.target.value as 'internal' | 'external' }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="external">External Link</option>
                        <option value="internal">Internal Link</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newLink.description}
                        onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => setShowLinkForm(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddLink}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Add Link
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {relatedLinks.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {link.type === 'external' ? (
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        ) : (
                          <LinkIcon className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <a
                            href={link.url}
                            target={link.type === 'external' ? '_blank' : '_self'}
                            rel={link.type === 'external' ? 'noopener noreferrer' : undefined}
                            className="font-medium text-primary-600 hover:text-primary-700"
                          >
                            {link.title}
                          </a>
                          {link.description && (
                            <p className="text-sm text-gray-500">{link.description}</p>
                          )}
                        </div>
                      </div>
                      {isManager && isEditing && (
                        <button
                          onClick={() => handleRemoveLink(link.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {relatedLinks.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No related links available</p>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              {(isManager || isCompleted) && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-600" />
                    </div>
                  ) : (
                    <NodeComments
                      comments={comments}
                      onAddComment={handleAddComment}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <NodeProgress
                  progress={progress}
                  onUpdateProgress={handleUpdateProgress}
                  readOnly={!user || isCompleted}
                />
              </div>

              {/* Admin Metadata Panel */}
              {isManager && isEditing && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={metadata.status}
                        onChange={(e) => setMetadata(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Visibility
                      </label>
                      <select
                        value={metadata.visibility}
                        onChange={(e) => setMetadata(prev => ({ ...prev, visibility: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="public">Public</option>
                        <option value="team">Team Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SEO Title
                      </label>
                      <input
                        type="text"
                        value={metadata.seoTitle || ''}
                        onChange={(e) => setMetadata(prev => ({ ...prev, seoTitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SEO Description
                      </label>
                      <textarea
                        value={metadata.seoDescription || ''}
                        onChange={(e) => setMetadata(prev => ({ ...prev, seoDescription: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={handleSaveMetadata}
                      disabled={saving}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Related skills */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Skills</h3>
                {nodes.filter(n => n.parentId === node.id).length > 0 ? (
                  <ul className="space-y-2">
                    {nodes
                      .filter(n => n.parentId === node.id)
                      .map((child) => (
                        <li key={child.id}>
                          <Link
                            to={`/node/${child.id}`}
                            className="flex items-center p-2 hover:bg-gray-50 rounded-lg group"
                          >
                            <span className="flex-grow text-gray-700 group-hover:text-primary-600">
                              {child.title}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500" />
                          </Link>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No related skills found</p>
                )}
              </div>

              {/* Version History */}
              {isManager && showVersionHistory && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Version History
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Version 1.0</span>
                        <span className="text-sm text-gray-500">Current</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Initial version</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(node.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 transform transition-all duration-200 scale-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ready to Complete!
              </h3>
              <p className="text-gray-600 mb-8">
                Congratulations! You've mastered this skill and are ready to mark it as complete. 
                This will be reflected in your progress tracking.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Not Yet
                </button>
                <button
                  onClick={handleMarkAsComplete}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 flex items-center shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white !important;
          }
          .bg-gray-50 {
            background: white !important;
          }
          .shadow-sm, .shadow-xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default NodeDetail;