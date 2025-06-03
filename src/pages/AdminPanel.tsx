import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { fetchAllUsers, updateUserRole, deleteUser, addUser } from '../services/userService';
import { getSkillTrees } from '../services/supabase';
import { User, UserRole } from '../types';
import { Users, UserPlus, Trash2, Edit, Save, X, AlertTriangle, Search, Shield, GitBranchPlus, CheckCircle, XCircle } from 'lucide-react';

type TabType = 'users' | 'userTrees';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [userTrees, setUserTrees] = useState<Record<string, any[]>>({});
  const [userTreesLoading, setUserTreesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if current user is admin/manager
  useEffect(() => {
    if (user && user.role !== 'manager') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch all users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await fetchAllUsers();
        setUsers(data);
      } catch (err) {
        setError('Failed to load users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'manager') {
      loadUsers();
    }
  }, [user]);

  // Fetch user trees for all users
  useEffect(() => {
    if (activeTab === 'userTrees' && users.length > 0) {
      setUserTreesLoading(true);
      const fetchAllUserTrees = async () => {
        const allTrees: Record<string, any[]> = {};
        for (const u of users) {
          allTrees[u.id] = await getSkillTrees(u.id);
        }
        setUserTrees(allTrees);
        setUserTreesLoading(false);
      };
      fetchAllUserTrees();
    }
  }, [activeTab, users]);

  // Filter users based on search term
  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle user role update
  const handleUpdateRole = async (userId: string) => {
    if (!editRole) return;
    
    try {
      await updateUserRole(userId, editRole);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: editRole } : u
      ));
      
      setSuccessMessage('User role updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update user role');
      console.error(err);
    }
    
    setEditingUserId(null);
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      
      // Update local state
      setUsers(users.filter(u => u.id !== userId));
      
      setSuccessMessage('User deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
    
    setShowDeleteConfirm(null);
  };

  // Handle adding a new user
  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      setAddUserError('Email and password are required');
      return;
    }
    
    try {
      setAddingUser(true);
      
      await addUser(newUserEmail, newUserPassword, newUserRole);
      
      // Refresh the user list
      const updatedUsers = await fetchAllUsers();
      setUsers(updatedUsers);
      
      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      
      setSuccessMessage('User added successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setAddUserError('Failed to add user');
      console.error(err);
    } finally {
      setAddingUser(false);
    }
  };

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading user data...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8">
            <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center">
                    <Shield className="h-6 w-6 mr-2" />
                    User Management
                  </h1>
                  <p className="mt-1 text-primary-100">
                    Manage users and their roles in the system
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/10 rounded-lg px-4 py-2 text-white">
                    <span className="text-sm">Total Users:</span>
                    <span className="ml-2 font-semibold">{users.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by email or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setAddingUser(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Add New User
                </button>
              </div>

              {/* Notification messages */}
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="flex-grow">{error}</span>
                  <button 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setError(null)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="flex-grow">{successMessage}</span>
                  <button 
                    className="text-green-500 hover:text-green-700"
                    onClick={() => setSuccessMessage(null)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Users list */}
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
                      {filteredUsers.map((userItem) => (
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
                                onChange={(e) => setEditRole(e.target.value as UserRole)}
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
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="text-gray-600 hover:text-gray-900 font-medium"
                                >
                                  No
                                </button>
                              </div>
                            ) : editingUserId === userItem.id ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleUpdateRole(userItem.id)}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  <Save className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end space-x-2">
                                {user && userItem.id !== user.id && (
                                  <button
                                    onClick={() => setShowDeleteConfirm(userItem.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => startEditing(userItem)}
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

                  {filteredUsers.length === 0 && (
                    <div className="px-6 py-8 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No users found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchTerm ? 'Try a different search term' : 'Add users to get started'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add User Modal */}
          {addingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <UserPlus className="h-6 w-6 mr-2" />
                      Add New User
                    </h3>
                    <button
                      onClick={() => setAddingUser(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {addUserError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {addUserError}
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="user@example.com"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          id="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="••••••••"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <select
                          id="role"
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="user">User</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setAddingUser(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Add User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;