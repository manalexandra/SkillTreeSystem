import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSkillTreeStore } from "../stores/skillTreeStore";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import NodeDescriptionEditor from "../components/node/NodeDescriptionEditor";
import NodeProgress from "../components/node/NodeProgress";
import type { SkillNode } from "../types";
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
  XCircle
} from "lucide-react";
import { supabase } from "../services/supabase";

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

  useEffect(() => {
    if (!user || !nodeId) return;
    
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
      } catch (err) {
        console.error('Error loading node:', err);
        setError('Failed to load node data');
      } finally {
        setLoading(false);
      }
    };

    loadNodeData();
  }, [nodeId, user, userProgress]);

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
      
      // If score is 10, show completion modal
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
          <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-6 pb-8">
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
                      <Target className="h-4 w-4 mr-1" />
                      Progress: {progress}/10
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

            {/* Status Bar */}
            <div className={`px-6 py-3 flex items-center justify-between ${
              isCompleted ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center">
                {isCompleted ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="font-medium text-green-700">Completed</span>
                  </>
                ) : progress === 10 ? (
                  <>
                    <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="font-medium text-yellow-700">Ready to complete!</span>
                  </>
                ) : (
                  <>
                    <Target className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium text-blue-700">In Progress</span>
                  </>
                )}
              </div>
              
              {progress === 10 && !isCompleted && (
                <button
                  onClick={() => setShowCompletionModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Mark as Complete
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
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
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Progress */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <NodeProgress
                  progress={progress}
                  onUpdateProgress={handleUpdateProgress}
                  readOnly={!user || isCompleted}
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

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ready to Complete!
              </h3>
              <p className="text-gray-600 mb-6">
                You've reached the maximum progress for this skill. Would you like to mark it as complete?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Not Yet
                </button>
                <button
                  onClick={handleMarkAsComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NodeDetail;