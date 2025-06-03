import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSkillTreeStore } from "../stores/skillTreeStore";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import NodeDescriptionEditor from "../components/node/NodeDescriptionEditor";
import NodeComments from "../components/node/NodeComments";
import NodeProgress from "../components/node/NodeProgress";
import type { SkillNode, NodeComment } from "../types";
import { ArrowLeft, GitBranchPlus, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "../services/supabase";

const NodeDetail: React.FC = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { nodes, markNodeCompleted, userProgress, fetchTreeData } = useSkillTreeStore();
  const [node, setNode] = useState<SkillNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<NodeComment[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user || !nodeId) return;
    
    const loadNodeData = async () => {
      setLoading(true);
      try {
        // First get the node details
        const { data: nodeData, error: nodeError } = await supabase
          .from('skill_nodes')
          .select(`
            *,
            skill_trees (
              id,
              name
            )
          `)
          .eq('id', nodeId)
          .single();

        if (nodeError) throw nodeError;
        if (!nodeData) throw new Error('Node not found');

        // Fetch the tree data to ensure we have all context
        await fetchTreeData(nodeData.tree_id, user.id);

        // Get node progress
        const { data: progressData } = await supabase
          .from('node_progress')
          .select('score')
          .eq('node_id', nodeId)
          .eq('user_id', user.id)
          .single();

        // Get comments
        const { data: commentsData } = await supabase
          .from('node_comments')
          .select(`
            *,
            users (
              id,
              email,
              role
            )
          `)
          .eq('node_id', nodeId)
          .order('created_at', { ascending: false });

        setNode({
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
        });

        setProgress(progressData?.score || 0);
        setComments(commentsData?.map(comment => ({
          id: comment.id,
          nodeId: comment.node_id,
          userId: comment.user_id,
          content: comment.content,
          createdAt: comment.created_at,
          user: comment.users
        })) || []);

      } catch (err) {
        console.error('Error loading node:', err);
        setError('Failed to load node data');
      } finally {
        setLoading(false);
      }
    };

    loadNodeData();
  }, [nodeId, user, fetchTreeData, userProgress]);

  const handleUpdateDescription = async (html: string) => {
    if (!node) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('skill_nodes')
        .update({
          description_html: html
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

  const handleAddComment = async (content: string) => {
    if (!node || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('node_comments')
        .insert({
          node_id: node.id,
          user_id: user.id,
          content
        })
        .select(`
          *,
          users (
            id,
            email,
            role
          )
        `)
        .single();

      if (error) throw error;
      
      setComments(prev => [{
        id: data.id,
        nodeId: data.node_id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at,
        user: data.users
      }, ...prev]);
    } catch (err) {
      setError("Failed to add comment");
      console.error(err);
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
      
      // If score is 10, mark as completed
      if (score === 10) {
        await markNodeCompleted(user.id, node.id, true);
      }
    } catch (err) {
      setError("Failed to update progress");
      console.error(err);
    }
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Link
                    to="/dashboard"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <GitBranchPlus className="h-6 w-6 text-primary-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{node.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Created {new Date(node.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className={`h-4 w-4 mr-1 ${
                      isCompleted ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    {isCompleted ? 'Completed' : 'Not completed'}
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="bg-error-50 text-error-700 px-4 py-2 rounded-lg text-sm flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <NodeDescriptionEditor
                  content={node.descriptionHtml || node.description}
                  onChange={handleUpdateDescription}
                  readOnly={!user || user.role !== 'manager'}
                />
                {saving && (
                  <p className="text-sm text-gray-500 mt-2">Saving changes...</p>
                )}
              </div>

              {/* Comments */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <NodeComments
                  comments={comments}
                  onAddComment={handleAddComment}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Progress */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <NodeProgress
                  progress={progress}
                  onUpdateProgress={handleUpdateProgress}
                  readOnly={!user}
                />
              </div>

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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NodeDetail;