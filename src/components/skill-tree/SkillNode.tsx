import React from 'react';
import type { SkillNode as SkillNodeType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Check, AlertCircle, ChevronRight } from 'lucide-react';

interface SkillNodeProps {
  node: SkillNodeType;
  onToggleComplete: (nodeId: string, completed: boolean) => void;
  isEditable?: boolean;
  onEdit?: (node: SkillNodeType) => void;
  level?: number;
}

const SkillNode: React.FC<SkillNodeProps> = ({
  node,
  onToggleComplete,
  isEditable = false,
  onEdit,
  level = 0,
}) => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isCompleted = node.completed || false;
  
  // Calculate if node is completable
  // A node is completable if all its prerequisites (parent and siblings) are completed
  const isCompletable = true; // Simplified for MVP - in a real app, we'd check parent completion
  
  const handleToggleComplete = () => {
    if (!isEditable && isCompletable) {
      onToggleComplete(node.id, !isCompleted);
    }
  };
  
  const handleEdit = () => {
    if (isEditable && onEdit) {
      onEdit(node);
    }
  };

  const renderNodeStatus = () => {
    if (isCompleted) {
      return (
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
          <div className="bg-success-500 text-white rounded-full p-1">
            <Check className="h-4 w-4" />
          </div>
        </div>
      );
    }
    
    if (!isCompletable && !isManager) {
      return (
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
          <div className="bg-gray-300 text-white rounded-full p-1">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Calculate indentation based on level
  const indentStyle = {
    marginLeft: `${level * 1}rem`,
  };

  return (
    <div className="mb-4 transition-all duration-200 transform hover:translate-x-1">
      <div 
        className={`relative p-4 border rounded-lg shadow-sm transition-all duration-200 ${
          isEditable 
            ? 'border-dashed border-gray-400 cursor-pointer hover:bg-gray-50'
            : isCompleted
            ? 'bg-success-50 border-success-200 hover:bg-success-100'
            : !isCompletable && !isManager
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
            : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
        }`}
        style={indentStyle}
        onClick={isEditable ? handleEdit : handleToggleComplete}
      >
        {renderNodeStatus()}
        
        <div className="flex items-start">
          <div className="flex-grow">
            <h3 className="font-medium text-gray-800">{node.title}</h3>
            
            {node.description && (
              <p className="mt-1 text-sm text-gray-600">{node.description}</p>
            )}
          </div>
          
          {node.children && node.children.length > 0 && (
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
          )}
        </div>
      </div>
      
      {/* Render children */}
      {node.children && node.children.length > 0 && (
        <div className="ml-4 pl-4 border-l border-gray-200 mt-2">
          {node.children.map((child) => (
            <SkillNode
              key={child.id}
              node={child}
              onToggleComplete={onToggleComplete}
              isEditable={isEditable}
              onEdit={onEdit}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillNode;