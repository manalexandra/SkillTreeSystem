import React from 'react';
import { User, UserRole } from '../../types';
import { GitBranchPlus, Trash2, Edit, Save, X, AlertTriangle } from 'lucide-react';

interface UserTableProps {
  users: User[];
  userTrees: Record<string, any[]>;
  editingUserId: string | null;
  editRole: UserRole;
  showDeleteConfirm: string | null;
  currentUserId?: string;
  onEditRole: (userId: string, role: UserRole) => void;
  onStartEditing: (user: User) => void;
  onCancelEditing: () => void;
  onDeleteUser: (userId: string) => void;
  onShowDeleteConfirm: (userId: string) => void;
  onHideDeleteConfirm: () => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  userTrees,
  editingUserId,
  editRole,
  showDeleteConfirm,
  currentUserId,
  onEditRole,
  onStartEditing,
  onCancelEditing,
  onDeleteUser,
  onShowDeleteConfirm,
  onHideDeleteConfirm,
}) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trees
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((userItem) => (
              <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      {userItem.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{userItem.email}</div>
                      <div className="text-sm text-gray-500">{userItem.id.substring(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUserId === userItem.id ? (
                    <select
                      value={editRole}
                      onChange={(e) => onEditRole(userItem.id, e.target.value as UserRole)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userItem.role === 'manager' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userItem.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <GitBranchPlus className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">
                      {userTrees[userItem.id]?.length || 0} trees
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {showDeleteConfirm === userItem.id ? (
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-red-600 text-xs flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Confirm delete?
                      </span>
                      <button
                        onClick={() => onDeleteUser(userItem.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Yes
                      </button>
                      <button
                        onClick={onHideDeleteConfirm}
                        className="text-gray-600 hover:text-gray-900 font-medium"
                      >
                        No
                      </button>
                    </div>
                  ) : editingUserId === userItem.id ? (
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEditRole(userItem.id, editRole)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={onCancelEditing}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end space-x-2">
                      {currentUserId && userItem.id !== currentUserId && (
                        <button
                          onClick={() => onShowDeleteConfirm(userItem.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => onStartEditing(userItem)}
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;