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

const NodeDetail: React.FC = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { nodes, markNodeCompleted, userProgress } = useSkillTreeStore();
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
        // Find the node in all trees
        const foundNode = nodes.find((n) => n.id === nodeId);
        if (foundNode) {
          setNode(foundNode);
          setProgress(foundNode.progress || 0);
          
          // Load comments (mock data for now)
          setComments([
            {
              id: "1",
              nodeId: foundNode.id,
              userId: "user1",
              content: "Great progress on this skill!",
              createdAt: new Date().toISOString(),
              user: {
                id: "user1",
                email: "user@example.com",
                role: "user"
              }
            }
          ]);
        }
      } catch (err) {
        setError("Failed to load node data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadNodeData();
  }, [nodeId, nodes, user]);

  const handleUpdateDescription = async (html: string) => {
    if (!node) return;
    
    setSaving(true);
    try {
      // Update node description
      setNode({ ...node, descriptionHtml: html });
      // TODO: Save to backend
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
      const newComment: NodeComment = {
        id: Math.random().toString(),
        nodeId: node.id,
        userId: user.id,
        content,
        createdAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      };
      
      setComments([newComment, ...comments]);
      // TODO: Save to backend
    } catch (err) {
      setError("Failed to add comment");
      console.error(err);
    }
  };

  const handleUpdateProgress = async (score: number) => {
    if (!node || !user) return;
    
    try {
      setProgress(score);
      // TODO: Save to backend
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
                {node.children && node.children.length > 0 ? (
                  <ul className="space-y-2">
                    {node.children.map((child) => (
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