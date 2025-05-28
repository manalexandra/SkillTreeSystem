import React, { useEffect, useState } from 'react';
import SkillNode from './SkillNode';
import { useSkillTreeStore } from '../../stores/skillTreeStore';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Loader2, GitBranchPlus } from 'lucide-react';
import type { SkillNode as SkillNodeType } from '../../types';

interface SkillTreeViewProps {
  treeId: string;
  isEditable?: boolean;
  onEditNode?: (node: SkillNodeType) => void;
}

const SkillTreeView: React.FC<SkillTreeViewProps> = ({
  treeId,
  isEditable = false,
  onEditNode,
}) => {
  const { user } = useAuth();
  const { 
    loading,
    error,
    currentTree,
    nodes,
    userProgress,
    fetchTreeData,
    buildTreeStructure,
    markNodeCompleted
  } = useSkillTreeStore();
  
  const [treeStructure, setTreeStructure] = useState<SkillNodeType[]>([]);
  
  useEffect(() => {
    if (user && treeId) {
      fetchTreeData(treeId, user.id);
    }
  }, [fetchTreeData, treeId, user]);
  
  useEffect(() => {
    if (!loading && !error) {
      const structure = buildTreeStructure();
      setTreeStructure(structure);
    }
  }, [buildTreeStructure, loading, error]);
  
  const handleToggleComplete = (nodeId: string, completed: boolean) => {
    if (user) {
      markNodeCompleted(user.id, nodeId, completed);
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!nodes.length) return 0;
    const completedNodes = Object.values(userProgress).filter(Boolean).length;
    return Math.round((completedNodes / nodes.length) * 100);
  };

  const progressPercentage = calculateProgress();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading skill tree...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-error-50 text-error-700 p-4 rounded-md">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>Failed to load skill tree: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!currentTree) {
    return (
      <div className="bg-warning-50 text-warning-700 p-4 rounded-md">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>Skill tree not found</p>
        </div>
      </div>
    );
  }
  
  if (treeStructure.length === 0) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 text-center">
        <p className="text-gray-500">This skill tree has no nodes yet.</p>
        {isEditable && (
          <p className="text-sm text-gray-400 mt-2">
            Start by adding the first skill node.
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div className="skill-tree-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-bold mb-2 sm:mb-0">{currentTree.name}</h2>
        
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-grow">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {progressPercentage}% Complete
            </span>
          </div>
        </div>
      </div>
      
      <div className="skill-nodes space-y-4">
        {treeStructure.map((node) => (
          <SkillNode
            key={node.id}
            node={node}
            onToggleComplete={handleToggleComplete}
            isEditable={isEditable}
            onEdit={onEditNode}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillTreeView;