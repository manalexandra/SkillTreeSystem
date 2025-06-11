import React, { useState } from 'react';
import NodeModal from './NodeModal';
import type { SkillNode, SkillTree } from '../../types';

interface SkillNodeFormProps {
  treeId: string;
  node?: SkillNode;
  onClose: () => void;
  isEdit?: boolean;
  parentNode?: SkillNode;
  trees: SkillTree[];
  onNodeSaved?: (node: SkillNode) => void;
}

const SkillNodeForm: React.FC<SkillNodeFormProps> = ({ 
  treeId, 
  node, 
  onClose,
  isEdit = false,
  parentNode,
  trees,
  onNodeSaved
}) => {
  const handleSave = (savedNode: SkillNode) => {
    if (onNodeSaved) {
      onNodeSaved(savedNode);
    }
    onClose();
  };

  return (
    <NodeModal
      isOpen={true}
      onClose={onClose}
      onSave={handleSave}
      node={isEdit ? node : null}
      treeId={treeId}
      parentNode={parentNode}
      trees={trees}
    />
  );
};

export default SkillNodeForm;