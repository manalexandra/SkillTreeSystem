import React, { useEffect, useState } from 'react';
import { useSkillTreeStore } from '../../stores/skillTreeStore';
import { useAuth } from '../../context/AuthContext';
import { fetchAllUsers, getTeamMembers } from '../../services/userService';
import { X, Users, Search, Building2 } from 'lucide-react';
import type { User, Team, SkillType } from '../../types';
import { supabase } from '../../services/supabase';

interface CreateTreeFormProps {
  onClose: () => void;
  onSuccess?: (treeId: string) => void;
}

const CreateTreeForm: React.FC<CreateTreeFormProps> = ({ onClose, onSuccess }) => {
  const [selectedSkillType, setSelectedSkillType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [skillTypes, setSkillTypes] = useState<SkillType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createNewTree } = useSkillTreeStore();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, teamsData, skillTypesData] = await Promise.all([
          fetchAllUsers(),
          supabase.from('teams').select('*').order('name'),
          supabase.from('skill_types').select('*').order('name')
        ]);

        setUsers(usersData);
        
        if (teamsData.error) throw teamsData.error;
        setTeams(teamsData.data || []);
        
        if (skillTypesData.error) throw skillTypesData.error;
        setSkillTypes(skillTypesData.data || []);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load required data');
      }
    };

    loadData();
  }, []);

  // When a team is selected, automatically select all its members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (selectedTeam) {
        try {
          const members = await getTeamMembers(selectedTeam);
          const memberIds = members.map(member => member.userId);
          setSelectedUsers(memberIds);
        } catch (error) {
          console.error('Error loading team members:', error);
        }
      } else {
        setSelectedUsers([]);
      }
    };

    loadTeamMembers();
  }, [selectedTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSkillType) return;
    
    const selectedType = skillTypes.find(type => type.id === selectedSkillType);
    if (!selectedType) {
      setError('Please select a skill type');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const newTree = await createNewTree({
        name: selectedType.name,
        description,
        createdBy: user.id,
        assignedUsers: selectedUsers,
        teamId: selectedTeam
      });
      
      if (newTree && onSuccess) {
        onSuccess(newTree.id);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tree');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'soft_skill':
        return 'bg-green-100 text-green-800';
      case 'leadership':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="skillType" className="block text-sm font-medium text-gray-700 mb-1">
              Skill Type
            </label>
            <select
              id="skillType"
              value={selectedSkillType}
              onChange={(e) => setSelectedSkillType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select a skill type</option>
              {skillTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                  {' '}
                  ({type.type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')})
                </option>
              ))}
            </select>
            {selectedSkillType && (
              <div className="mt-2">
                <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                  getTypeColor(skillTypes.find(t => t.id === selectedSkillType)?.type || '')
                }`}>
                  {skillTypes.find(t => t.id === selectedSkillType)?.type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Describe the purpose and goals of this skill tree"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Assign to Team (Optional)
              </div>
            </label>
            <select
              value={selectedTeam || ''}
              onChange={(e) => setSelectedTeam(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">No team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              If selected, all team members will be automatically assigned to this tree
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assign Additional Users
              </div>
            </label>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <label
                    key={u.id}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={(e) => {
                        setSelectedUsers(prev =>
                          e.target.checked
                            ? [...prev, u.id]
                            : prev.filter(id => id !== u.id)
                        );
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-700">{u.email}</div>
                      <div className="text-xs text-gray-500">{u.role}</div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No users found
                </div>
              )}
            </div>
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
              disabled={loading || !selectedSkillType}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                loading || !selectedSkillType ? 'opacity-70 cursor-not-allowed' : ''
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