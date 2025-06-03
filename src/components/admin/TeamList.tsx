import React from 'react';
import { Team } from '../../types';
import { Building2, Edit, Eye, Trash2, Save, X } from 'lucide-react';

interface TeamListProps {
  teams: Team[];
  editingTeamId: string | null;
  showDeleteTeamConfirm: string | null;
  onUpdateTeam: (teamId: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onEditTeam: (teamId: string) => void;
  onCancelEdit: () => void;
  onShowDeleteConfirm: (teamId: string) => void;
  onHideDeleteConfirm: () => void;
  onViewTeam: (teamId: string) => void;
  onTeamChange: (teamId: string, field: 'name' | 'description', value: string) => void;
}

const TeamList: React.FC<TeamListProps> = ({
  teams,
  editingTeamId,
  showDeleteTeamConfirm,
  onUpdateTeam,
  onDeleteTeam,
  onEditTeam,
  onCancelEdit,
  onShowDeleteConfirm,
  onHideDeleteConfirm,
  onViewTeam,
  onTeamChange,
}) => {
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
    <div className="space-y-4">
      {teams.map(team => (
        <div
          key={team.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          {editingTeamId === team.id ? (
            <div className="space-y-4">
              <input
                type="text"
                value={team.name}
                onChange={(e) => onTeamChange(team.id, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Team name"
              />
              <textarea
                value={team.description || ''}
                onChange={(e) => onTeamChange(team.id, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Team description"
                rows={2}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => onUpdateTeam(team.id)}
                  className="flex items-center px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
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
                    onClick={() => onEditTeam(team.id)}
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
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default TeamList;