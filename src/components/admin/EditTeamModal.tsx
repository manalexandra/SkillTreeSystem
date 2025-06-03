import React, { useState, useEffect } from 'react';
import { Team, User } from '../../types';
import { X, Save, Users } from 'lucide-react';
import Select, { MultiValue } from 'react-select';
import { getTeamMembers } from '../../services/userService';

interface EditTeamModalProps {
  team: Team;
  users: User[];
  onClose: () => void;
  onSave: (team: Team, selectedUsers: string[]) => void;
}

interface UserOption {
  value: string;
  label: string;
  email: string;
  role: string;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({
  team,
  users,
  onClose,
  onSave,
}) => {
  const [editedTeam, setEditedTeam] = useState<Team>(team);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert users to options format
  const userOptions: UserOption[] = users.map(user => ({
    value: user.id,
    label: user.email,
    email: user.email,
    role: user.role
  }));

  // Fetch current team members when modal opens
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (team.id) {
        try {
          const members = await getTeamMembers(team.id);
          setSelectedUsers(members.map(member => member.userId));
        } catch (error) {
          console.error('Error loading team members:', error);
        }
      }
      setLoading(false);
    };

    loadTeamMembers();
  }, [team.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedTeam, selectedUsers);
  };

  const handleUserChange = (newValue: MultiValue<UserOption>) => {
    setSelectedUsers(newValue.map(option => option.value));
  };

  // Custom styles for react-select
  const customStyles = {
    control: (base: any) => ({
      ...base,
      borderColor: '#E5E7EB',
      '&:hover': {
        borderColor: '#E5E7EB'
      },
      boxShadow: 'none',
      '&:focus-within': {
        borderColor: '#3B82F6',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.25)'
      }
    }),
    option: (base: any, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#3B82F6' 
        : state.isFocused 
          ? '#F3F4F6' 
          : undefined,
      '&:active': {
        backgroundColor: state.isSelected ? '#2563EB' : '#E5E7EB'
      }
    })
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
              {team.id ? 'Edit Team' : 'Create Team'}
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
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Team Name
              </label>
              <input
                type="text"
                id="name"
                value={editedTeam.name}
                onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={editedTeam.description || ''}
                onChange={(e) => setEditedTeam({ ...editedTeam, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members
                </div>
              </label>

              <Select
                isMulti
                options={userOptions}
                value={userOptions.filter(option => selectedUsers.includes(option.value))}
                onChange={handleUserChange}
                styles={customStyles}
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
                placeholder="Select team members..."
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
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal;