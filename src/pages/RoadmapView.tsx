import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { useSkillTreeStore } from '../stores/skillTreeStore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight, 
  GitBranchPlus, 
  CheckCircle, 
  Circle, 
  Award, 
  Map, 
  Loader2,
  Trophy,
  X
} from 'lucide-react';
import { getAllSkillNodes, getAllUserProgress, supabase } from '../services/supabase';
import { isTreeCompletable, markTreeCompleted } from '../services/userService';
import type { SkillNode, SkillType } from '../types';

interface TreeNode {
  id: string;
  title: string;
  description: string;
  treeId: string;
  parentId: string | null;
  orderIndex: number;
  children: TreeNode[];
  isCompleted?: boolean;
}

const RoadmapView: React.FC = () => {
  const { trees } = useSkillTreeStore();
  const { user } = useAuth();
  const [expandedTreeIds, setExpandedTreeIds] = useState<string[]>([]);
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [allNodes, setAllNodes] = useState<SkillNode[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [completableTreeId, setCompletableTreeId] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedSkillType, setSelectedSkillType] = useState<SkillType | null>(null);
  const [skillTypes, setSkillTypes] = useState<SkillType[]>([]);
  const [completingTree, setCompletingTree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sortedTrees = [...trees].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  useEffect(() => {
    if (sortedTrees.length > 0 && expandedTreeIds.length === 0) {
      setExpandedTreeIds([sortedTrees[0].id]);
      setActiveTreeId(sortedTrees[0].id);
    }
    
    setTimeout(() => {
      setAnimateIn(true);
    }, 100);
  }, [sortedTrees]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const nodes = await getAllSkillNodes();
        setAllNodes(nodes);

        if (user) {
          const progress = await getAllUserProgress(user.id);
          setUserProgress(progress);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const checkCompletableTree = async () => {
      if (!user || !activeTreeId) return;

      try {
        const { data: types, error: typesError } = await supabase
          .from('skill_types')
          .select('*');

        if (typesError) throw typesError;
        setSkillTypes(types);

        const completable = await isTreeCompletable(user.id, activeTreeId);
        if (completable) {
          setCompletableTreeId(activeTreeId);
          
          const tree = trees.find(t => t.id === activeTreeId);
          if (tree) {
            const matchingType = types.find(type => type.name === tree.name);
            setSelectedSkillType(matchingType || null);
          }
        } else {
          setCompletableTreeId(null);
          setSelectedSkillType(null);
        }
      } catch (err) {
        console.error('Error checking completable tree:', err);
      }
    };

    checkCompletableTree();
  }, [user, activeTreeId, trees]);

  const handleToggleTree = (treeId: string) => {
    setExpandedTreeIds((ids) =>
      ids.includes(treeId) ? ids.filter((id) => id !== treeId) : [...ids, treeId]
    );
    setActiveTreeId(treeId);
  };
  
  const isNodeCompleted = (nodeId: string): boolean => {
    return Boolean(user && userProgress[nodeId]);
  };

  const buildNodeTree = (treeId: string, parentId: string | null = null): TreeNode[] => {
    return allNodes
      .filter((n) => n.treeId === treeId && n.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((node) => ({
        ...node,
        children: buildNodeTree(treeId, node.id),
        isCompleted: isNodeCompleted(node.id)
      }));
  };

  const calculateTreeProgress = (treeId: string): { completed: number; total: number } => {
    const treeNodes = allNodes.filter(node => node.treeId === treeId);
    const total = treeNodes.length;
    const completed = treeNodes.filter(node => isNodeCompleted(node.id)).length;
    return { completed, total };
  };

  const handleCompleteTree = async () => {
    if (!user || !completableTreeId || !selectedSkillType) return;
    
    setCompletingTree(true);
    setError(null);
    
    try {
      await markTreeCompleted(user.id, completableTreeId, selectedSkillType.id);
      setShowCompletionModal(false);
      
      await fetchTrees();
    } catch (err) {
      setError('Failed to complete tree. Please try again.');
    } finally {
      setCompletingTree(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your learning journey...</p>
          </div>
        </div>
      </>
    );
  }

  const renderNode = (node: TreeNode, isLast = false, pathIndex = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const completionStatus = node.isCompleted ? 'completed' : 'pending';
    
    return (
      <div key={node.id} className="relative">
        <div className={`node-connector ${isLast ? 'last' : ''}`}>
          <div className="absolute left-4 top-6 w-6 h-[calc(100%-12px)] border-l-2 border-dashed border-primary-200">
            {isLast && <div className="absolute left-0 bottom-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg border-dashed border-primary-200"></div>}
          </div>
        </div>
        
        <div 
          className={`flex items-center mb-4 relative z-10 transition-all duration-300 transform ${
            animateIn ? 'translate-x-0 opacity-100' : 'translate-x-[-20px] opacity-0'
          }`} 
          style={{ transitionDelay: `${pathIndex * 100}ms` }}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            completionStatus === 'completed' ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'
          } mr-3`}>
            {completionStatus === 'completed' ? 
              <CheckCircle className="h-5 w-5" /> : 
              <Circle className="h-5 w-5" />}
          </div>
          
          <Link
            to={`/node/${node.id}`}
            className={`px-4 py-3 rounded-lg ${
              completionStatus === 'completed' 
                ? 'bg-green-50 hover:bg-green-100' 
                : 'bg-white hover:bg-gray-50'
            } shadow-sm hover:shadow transition-all duration-200 flex-grow flex items-center group`}
          >
            <div className="flex-grow">
              <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                {node.title}
              </h3>
              {node.description && (
                <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                  {node.description}
                </p>
              )}
            </div>
            {hasChildren && (
              <div className="ml-auto">
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </div>
            )}
          </Link>
        </div>
        
        {hasChildren && (
          <div className="ml-10 pl-2">
            {node.children.map((child, i) => 
              renderNode(child, i === node.children.length - 1, pathIndex + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="pt-8 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white rounded-full shadow-md">
                  <Map className="h-10 w-10 text-primary-600" />
                </div>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Your Learning Journey
              </h1>
              <p className="mt-4 text-xl text-gray-500 mb-4">
                Track your progress and visualize your skill development path
              </p>
            </div>
            
            <div className="relative overflow-x-auto pb-16 mb-8 scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
              <div className="absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 z-0"></div>
              
              <div className="relative flex px-8 mt-4 pt-4 pb-4">
                {sortedTrees.map((tree, index) => {
                  const isActive = activeTreeId === tree.id;
                  const isExpanded = expandedTreeIds.includes(tree.id);
                  const progress = calculateTreeProgress(tree.id);
                  const progressPercent = progress.total > 0 
                    ? Math.round((progress.completed / progress.total) * 100) 
                    : 0;
                  
                  return (
                    <div key={tree.id} className="relative flex flex-col items-center mr-20 last:mr-0">
                      <button
                        onClick={() => handleToggleTree(tree.id)}
                        className={`relative z-10 flex-shrink-0 rounded-xl px-5 py-4 ${
                          isActive 
                            ? 'bg-white border-2 border-primary-500 shadow-lg' 
                            : 'bg-white border border-gray-200 shadow-md hover:shadow-lg'
                        } transition-all duration-200 flex flex-col items-center w-64`}
                      >
                        <div className="flex items-center mb-3">
                          <GitBranchPlus className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'} mr-2`} />
                          <span className={`font-medium ${isActive ? 'text-primary-700' : 'text-gray-700'}`}>
                            {tree.name}
                          </span>
                          {isExpanded 
                            ? <ChevronDown className="ml-2 h-4 w-4 text-gray-400" /> 
                            : <ChevronRight className="ml-2 h-4 w-4 text-gray-400" />}
                        </div>
                        
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                          <div 
                            className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Award className="h-4 w-4 mr-1 text-primary-500" />
                          {progress.completed}/{progress.total} completed
                        </div>
                      </button>
                      
                      <div className="absolute top-16 h-4 w-1 bg-primary-200"></div>
                      
                      <div className="absolute -bottom-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">
                        {index + 1}
                      </div>
                      
                      {index < sortedTrees.length - 1 && (
                        <div className="absolute top-20 -right-16 flex items-center">
                          <div className="h-1 w-10 bg-primary-300"></div>
                          <div className="text-primary-400 transform rotate-90 ml-1">▲</div>
                        </div>
                      )}
                      
                      <div className="absolute -top-6 text-xs text-gray-500">
                        Created: {new Date(tree.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 relative overflow-hidden">
              {activeTreeId ? (
                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {trees.find(t => t.id === activeTreeId)?.name}
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">
                          {calculateTreeProgress(activeTreeId).completed} skills mastered
                        </span>
                      </div>
                      
                      {completableTreeId === activeTreeId && (
                        <button
                          onClick={() => setShowCompletionModal(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                          <Trophy className="h-5 w-5" />
                          Complete Tree
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="roadmap-container">
                    {expandedTreeIds.includes(activeTreeId) && (
                      <div className="pl-2">
                        {(() => {
                          const treeNodes = buildNodeTree(activeTreeId);
                          return treeNodes.length > 0 ? (
                            <div className="space-y-2">
                              {treeNodes.map((node, i) => 
                                renderNode(node, i === treeNodes.length - 1, i)
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <GitBranchPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                              <div className="text-gray-400 italic mb-2">No nodes in this skill tree</div>
                              <p className="text-sm text-gray-500">
                                This tree is empty. If you're a manager, you can add nodes in the Manage Trees section.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <GitBranchPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-gray-400 mb-4">Select a skill tree to view its roadmap</div>
                  <p className="text-sm text-gray-500">
                    Click on one of the trees above to see your personalized learning path
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCompletionModal && selectedSkillType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Congratulations!
              </h3>
              <p className="text-gray-600 mb-6">
                You've mastered all skills in this tree! Complete it to earn your badge in{' '}
                <span className="font-medium">{selectedSkillType.name}</span>.
              </p>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center"
                  disabled={completingTree}
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleCompleteTree}
                  disabled={completingTree}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
                >
                  {completingTree ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5 mr-2" />
                      Complete Tree
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default RoadmapView;