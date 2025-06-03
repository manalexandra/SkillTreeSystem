import React, { useState } from 'react';
import { Team, User } from '../../types';
import { Building2, Edit, Eye, Trash2, Save, X } from 'lucide-react';
import EditTeamModal from './EditTeamModal';

interface TeamListProps {
  teams: Team[];
  users: User[];
  showDeleteTeamConfirm: string | null;
  onDeleteTeam: (teamId: string) => void;
  onShowDeleteConfirm: (teamId: string) => void;
  onHideDeleteConfirm: () => void;
  onViewTeam: (teamId: string) => void;
  onUpdateTeam: (team: Team, selectedUsers: string[]) => void;
}

const TeamList: React.FC<TeamListProps> = ({
  teams,
  users,
  showDeleteTeamConfirm,
  onDeleteTeam,
  onShowDeleteConfirm,
  onHideDeleteConfirm,
  onViewTeam,
  onUpdateTeam,
}) => {
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No teams found</p>
        <p className="text-sm text-gray-400 mt-1">
          Create your first team to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {teams.map(team => (
          <div
            key={team.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                  <button
                    onClick={() => onViewTeam(team.id)}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                    title="View team members"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
                {team.description && (
                  <p className="text-gray-500 mt-1">{team.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingTeam(team)}
                  className="text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onShowDeleteConfirm(team.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {showDeleteTeamConfirm === team.id && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-700 text-sm mb-3">
                  Are you sure you want to delete this team? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onDeleteTeam(team.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={onHideDeleteConfirm}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          users={users}
          onClose={() => setEditingTeam(null)}
          onSave={(team, selectedUsers) => {
            onUpdateTeam(team, selectedUsers);
            setEditingTeam(null);
          }}
        />
      )}
    </>
  );
};

export default TeamList;