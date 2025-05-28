import React, { useEffect, useState } from 'react';
import type { SkillNode } from '../../types';
import { useSkillTreeStore } from '../../stores/skillTreeStore';
import { X } from 'lucide-react';

interface SkillNodeFormProps {
  treeId: string;
  node?: SkillNode;
  onClose: () => void;
  isEdit?: boolean;
}

const SkillNodeForm: React.FC<SkillNodeFormProps> = ({ 
  treeId, 
  node, 
  onClose,
  isEdit = false
}) => {
  const { nodes, addNode, updateNode } = useSkillTreeStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [orderIndex, setOrderIndex] = useState(0);
  
  useEffect(() => {
    if (node && isEdit) {
      setTitle(node.title);
      setDescription(node.description);
      setParentId(node.parentId);
      setOrderIndex(node.orderIndex);
    }
  }, [node, isEdit]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit && node) {
      await updateNode({
        id: node.id,
        title,
        description,
        parentId,
        orderIndex,
      });
    } else {
      await addNode({
        treeId,
        title,
        description,
        parentId,
        orderIndex,
      });
    }
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">
            {isEdit ? 'Edit Skill Node' : 'Add New Skill Node'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
              Parent Node (optional)
            </label>
            <select
              id="parentId"
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">No Parent (Root Node)</option>
              {nodes
                .filter(n => n.id !== node?.id) // Prevent setting itself as parent
                .map(n => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))
              }
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="orderIndex" className="block text-sm font-medium text-gray-700 mb-1">
              Order Index
            </label>
            <input
              type="number"
              id="orderIndex"
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              min={0}
            />
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first in the list
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isEdit ? 'Update' : 'Create'} Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SkillNodeForm;