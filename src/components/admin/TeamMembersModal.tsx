import React from 'react';
import { TeamMember, Team } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { X, Users } from 'lucide-react';

interface TeamMembersModalProps {
  team: Team;
  members: TeamMember[];
  loading: boolean;
  onClose: () => void;
}

const TeamMembersModal: React.FC<TeamMembersModalProps> = ({
  team,
  members,
  loading,
  onClose,
}) => {
  const getDisplayName = (member: TeamMember) => {
    if (!member.user) return 'Unknown User';
    if (member.user.firstName || member.user.lastName) {
      return `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim();
    }
    return member.user.email;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Users className="h-6 w-6 mr-2" />
              {team.name} - Team Members
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading team members...</p>
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-4">
              {members.map(member => (
                <div key={member.userId} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <UserAvatar user={member.user!} size="lg" />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{getDisplayName(member)}</div>
                      <div className="text-sm text-gray-500">{member.user?.email}</div>
                      <div className="text-sm text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.user?.role === 'manager' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {member.user?.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No members in this team yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMembersModal;