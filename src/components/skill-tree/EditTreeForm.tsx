import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllUsers, getTeamMembers } from '../../services/userService';
import { X, Users, Search, Building2 } from 'lucide-react';
import type { User, Team, SkillTree, SkillType } from '../../types';
import { supabase } from '../../services/supabase';
import Select, { MultiValue } from 'react-select';

interface EditTreeFormProps {
  tree: SkillTree;
  onClose: () => void;
  onSave: (tree: SkillTree, selectedUsers: string[]) => void;
}

interface UserOption {
  value: string;
  label: string;
  email: string;
  role: string;
}

const EditTreeForm: React.FC<EditTreeFormProps> = ({
  tree,
  onClose,
  onSave,
}) => {
  const [selectedSkillType, setSelectedSkillType] = useState<string>('');
  const [description, setDescription] = useState(tree.description || '');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(tree.teamId || null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [skillTypes, setSkillTypes] = useState<SkillType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert users to options format
  const userOptions: UserOption[] = users.map(user => ({
    value: user.id,
    label: user.email,
    email: user.email,
    role: user.role
  }));

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, teamsData, skillTypesData, members] = await Promise.all([
          fetchAllUsers(),
          supabase.from('teams').select('*').order('name'),
          supabase.from('skill_types').select('*').order('name'),
          getTeamMembers(tree.id)
        ]);

        setUsers(usersData);
        
        if (teamsData.error) throw teamsData.error;
        setTeams(teamsData.data || []);
        
        if (skillTypesData.error) throw skillTypesData.error;
        setSkillTypes(skillTypesData.data || []);

        // Find the skill type that matches the tree name
        const matchingSkillType = skillTypesData.data?.find(type => type.name === tree.name);
        if (matchingSkillType) {
          setSelectedSkillType(matchingSkillType.id);
        }

        setSelectedUsers(members.map(member => member.userId));
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tree.id, tree.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedType = skillTypes.find(type => type.id === selectedSkillType);
    if (!selectedType) {
      setError('Please select a skill type');
      return;
    }

    onSave(
      {
        ...tree,
        name: selectedType.name,
        description,
        teamId: selectedTeam
      },
      selectedUsers
    );
  };

  const handleUserChange = (newValue: MultiValue<UserOption>) => {
    setSelectedUsers(newValue.map(option => option.value));
  };

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
          <div className="p-6">
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              Edit Tree
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="skillType" className="block text-sm font-medium text-gray-700 mb-1">
                Skill Type
              </label>
              <select
                id="skillType"
                value={selectedSkillType}
                onChange={(e) => setSelectedSkillType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Assign to Team (Optional)
                </div>
              </label>
              <select
                value={selectedTeam || ''}
                onChange={(e) => setSelectedTeam(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assign Additional Users
                </div>
              </label>

              <Select
                isMulti
                options={userOptions}
                value={userOptions.filter(option => selectedUsers.includes(option.value))}
                onChange={handleUserChange}
                formatOptionLabel={({ email, role }) => (
                  <div className="flex justify-between items-center">
                    <span>{email}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      role === 'manager' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {role}
                    </span>
                  </div>
                )}
                placeholder="Select users..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedSkillType}
              className={`px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors ${
                !selectedSkillType ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTreeForm;