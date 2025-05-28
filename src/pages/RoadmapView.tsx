import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { useSkillTreeStore } from '../stores/skillTreeStore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, GitBranchPlus, CheckCircle, Circle, Award, Map } from 'lucide-react';

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
  const { trees, nodes, completedNodesByUser } = useSkillTreeStore();
  const { user } = useAuth();
  const [expandedTreeIds, setExpandedTreeIds] = useState<string[]>([]);
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  
  // Sort trees by createdAt (oldest to newest)
  const sortedTrees = [...trees].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  useEffect(() => {
    // Auto-expand the first tree when page loads
    if (sortedTrees.length > 0 && expandedTreeIds.length === 0) {
      setExpandedTreeIds([sortedTrees[0].id]);
      setActiveTreeId(sortedTrees[0].id);
    }
    
    // Trigger animation after component mounts
    setTimeout(() => {
      setAnimateIn(true);
    }, 100);
  }, [sortedTrees]);

  const handleToggleTree = (treeId: string) => {
    setExpandedTreeIds((ids) =>
      ids.includes(treeId) ? ids.filter((id) => id !== treeId) : [...ids, treeId]
    );
    setActiveTreeId(treeId);
  };

  // Get user's completed nodes
  const userCompletedNodes = user ? completedNodesByUser[user.id] || {} : {};
  
  // Helper to check if a node is completed
  const isNodeCompleted = (nodeId: string): boolean => {
    return Boolean(user && userCompletedNodes[nodeId]);
  };

  // Helper to build a tree structure from flat nodes with completion info
  const buildNodeTree = (treeId: string, parentId: string | null = null): TreeNode[] => {
    return nodes
      .filter((n) => n.treeId === treeId && n.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((node) => ({
        ...node,
        children: buildNodeTree(treeId, node.id),
        isCompleted: isNodeCompleted(node.id)
      }));
  };

  // Calculate progress for a tree
  const calculateTreeProgress = (treeId: string): { completed: number; total: number } => {
    const treeNodes = nodes.filter(node => node.treeId === treeId);
    const total = treeNodes.length;
    const completed = treeNodes.filter(node => isNodeCompleted(node.id)).length;
    return { completed, total };
  };

  // Recursive render for nodes with a more visually appealing style
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
        
        <div className={`flex items-center mb-4 relative z-10 transition-all duration-300 transform ${animateIn ? 'translate-x-0 opacity-100' : 'translate-x-[-20px] opacity-0'}`} 
             style={{ transitionDelay: `${pathIndex * 100}ms` }}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completionStatus === 'completed' ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'} mr-3`}>
            {completionStatus === 'completed' ? 
              <CheckCircle className="h-5 w-5" /> : 
              <Circle className="h-5 w-5" />}
          </div>
          
          <Link
            to={`/node/${node.id}`}
            className={`px-4 py-2 rounded-lg ${completionStatus === 'completed' ? 'bg-green-50 hover:bg-green-100' : 'bg-white hover:bg-gray-50'} shadow hover:shadow-md transition-all duration-200 flex-grow flex items-center`}
          >
            <div>
              <h3 className="font-medium text-gray-900">{node.title}</h3>
              {node.description && (
                <p className="text-sm text-gray-500 line-clamp-1">{node.description}</p>
              )}
            </div>
            {hasChildren && (
              <div className="ml-auto">
                <ChevronRight className="h-4 w-4 text-gray-400" />
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
                <Map className="h-10 w-10 text-primary-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Your Learning Roadmap
              </h1>
              <p className="mt-4 text-xl text-gray-500">
                Visualize your skill progression journey from start to finish
              </p>
            </div>
            
            {/* Timeline header with trees and connecting lines */}
            <div className="relative overflow-x-auto pb-16 mb-8 scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
              {/* Horizontal line connecting all trees */}
              <div className="absolute top-20 left-0 right-0 h-1 bg-primary-200 z-0"></div>
              
              <div className="relative flex px-8 pt-4 pb-4">
                {sortedTrees.map((tree, index) => {
                  const isActive = activeTreeId === tree.id;
                  const isExpanded = expandedTreeIds.includes(tree.id);
                  const progress = calculateTreeProgress(tree.id);
                  const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
                  const isFirstTree = index === 0;
                  const isLastTree = index === sortedTrees.length - 1;
                  
                  return (
                    <div key={tree.id} className="relative flex flex-col items-center mr-20 last:mr-0">
                      {/* Tree node */}
                      <button
                        onClick={() => handleToggleTree(tree.id)}
                        className={`relative z-10 flex-shrink-0 rounded-lg px-5 py-3 ${isActive ? 'bg-primary-50 border-2 border-primary-500' : 'bg-white border border-gray-200'} transition-all duration-200 flex flex-col items-center shadow-sm hover:shadow w-60`}
                      >
                        <div className="flex items-center mb-2">
                          <GitBranchPlus className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'} mr-2`} />
                          <span className={`font-medium ${isActive ? 'text-primary-700' : 'text-gray-700'}`}>{tree.name}</span>
                          {isExpanded ? <ChevronDown className="ml-2 h-4 w-4 text-gray-400" /> : <ChevronRight className="ml-2 h-4 w-4 text-gray-400" />}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                          <div 
                            className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {progress.completed}/{progress.total} completed
                        </div>
                      </button>
                      
                      {/* Vertical connector line */}
                      <div className="absolute top-16 h-4 w-1 bg-primary-200"></div>
                      
                      {/* Tree sequence number */}
                      <div className="absolute -bottom-10 bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      
                      {/* Arrow pointing to next tree */}
                      {!isLastTree && (
                        <div className="absolute top-20 -right-16 flex items-center">
                          <div className="h-1 w-10 bg-primary-400"></div>
                          <div className="text-primary-500 transform rotate-90 ml-1">▲</div>
                        </div>
                      )}
                      
                      {/* Creation date */}
                      <div className="absolute -top-6 text-xs text-gray-500">
                        Created: {new Date(tree.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Main roadmap content */}
            <div className="bg-white rounded-xl shadow-sm p-8 transition-all duration-300 relative overflow-hidden">
              {activeTreeId ? (
                <div className="relative">
                  <div className="flex items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {trees.find(t => t.id === activeTreeId)?.name}
                    </h2>
                    <div className="ml-auto flex items-center">
                      <Award className="h-5 w-5 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-gray-600">
                        {calculateTreeProgress(activeTreeId).completed} skills mastered
                      </span>
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
                              <div className="text-gray-400 italic mb-2">No nodes in this skill tree</div>
                              <p className="text-sm text-gray-500">This tree is empty. If you're a manager, you can add nodes in the Manage Trees section.</p>
                            </div>
                          );
                        })()} 
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-gray-400 mb-4">Select a skill tree to view its roadmap</div>
                  <p className="text-sm text-gray-500">Click on one of the trees above to see your personalized learning path</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add some custom CSS for the connections between nodes */}
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
