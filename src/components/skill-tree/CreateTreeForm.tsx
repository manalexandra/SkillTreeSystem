import React, { useState, useEffect } from 'react';
import { useSkillTreeStore } from '../../stores/skillTreeStore';
import { useAuth } from '../../context/AuthContext';
import { fetchAllUsers } from '../../services/userService';
import { X } from 'lucide-react';
import type { User } from '../../types';

interface CreateTreeFormProps {
  onClose: () => void;
  onSuccess?: (treeId: string) => void;
}

const CreateTreeForm: React.FC<CreateTreeFormProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const { createNewTree, loading } = useSkillTreeStore();
  const { user } = useAuth();

  useEffect(() => {
    const loadUsers = async () => {
      const data = await fetchAllUsers();
      setUsers(data);
    };
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const newTree = await createNewTree(name, user.id, assignedUserId || undefined);
    if (newTree && onSuccess) {
      onSuccess(newTree.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">Create New Skill Tree</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Skill Tree Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. Frontend Development Skills"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="assignedUser" className="block text-sm font-medium text-gray-700 mb-1">
              Assign to User
            </label>
            <select
              id="assignedUser"
              value={assignedUserId}
              onChange={e => setAssignedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select user...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create Tree'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTreeForm;