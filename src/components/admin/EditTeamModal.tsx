import React, { useState, useEffect } from 'react';
import { Team, User } from '../../types';
import { X, Save, Users, Search } from 'lucide-react';

interface EditTeamModalProps {
  team: Team;
  users: User[];
  onClose: () => void;
  onSave: (team: Team, selectedUsers: string[]) => void;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({
  team,
  users,
  onClose,
  onSave,
}) => {
  const [editedTeam, setEditedTeam] = useState<Team>(team);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedTeam, selectedUsers);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Edit Team</h3>
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

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {filteredUsers.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        setSelectedUsers(prev =>
                          e.target.checked
                            ? [...prev, user.id]
                            : prev.filter(id => id !== user.id)
                        );
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.role}</div>
                    </div>
                  </label>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No users found
                  </div>
                )}
              </div>
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