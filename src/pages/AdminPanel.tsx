import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { fetchAllUsers, updateUserRole, deleteUser, addUser, fetchUserSkillTrees } from '../services/userService';
import { User, UserRole } from '../types';
import { Users, UserPlus, Trash2, Edit, Save, X, AlertTriangle } from 'lucide-react';

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
          allTrees[u.id] = await fetchUserSkillTrees(u.id);
        }
        setUserTrees(allTrees);
        setUserTreesLoading(false);
      };
      fetchAllUserTrees();
    }
  }, [activeTab, users]);

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
      
      // Use mock implementation for demo
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
        <div className="min-h-screen bg-gray-50 pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Users className="h-6 w-6 mr-2" />
                  User Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Add, edit, or remove users from the system
                </p>
              </div>
            </div>
          </div>

          {/* Notification messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
              <button 
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setError(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{successMessage}</span>
              <button 
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setSuccessMessage(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Add user form */}
          <div className="bg-white shadow-sm rounded-lg mb-8 overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-primary-500" />
                Add New User
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {addUserError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {addUserError}
                  <button 
                    className="float-right"
                    onClick={() => setAddUserError(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <div className="mt-1">
                    <select
                      id="role"
                      name="role"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddUser}
                    disabled={addingUser}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {addingUser ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Users list */}
          <div className="bg-white shadow-sm overflow-hidden rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Users ({users.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userItem) => (
                    <tr key={userItem.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {userItem.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingUserId === userItem.id ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="user">User</option>
                            <option value="manager">Manager</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userItem.role === 'manager' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {userItem.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-xs font-mono">{userItem.id.substring(0, 8)}...</span>
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
                              className="text-red-600 hover:text-red-900"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-900"
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
                            {/* Don't allow deleting yourself */}
                            {user && userItem.id !== user.id && (
                              <button
                                onClick={() => setShowDeleteConfirm(userItem.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => startEditing(userItem)}
                              className="text-indigo-600 hover:text-indigo-900"
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
            
            {users.length === 0 && (
              <div className="px-6 py-4 text-center text-sm text-gray-500">
                No users found
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
