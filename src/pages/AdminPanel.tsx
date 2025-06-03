import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { fetchAllUsers, updateUserRole, deleteUser, addUser } from '../services/userService';
import { getSkillTrees, supabase } from '../services/supabase';
import { User, UserRole, Team } from '../types';
import { Users, UserPlus, Trash2, Edit, Save, X, AlertTriangle, Search, Shield, GitBranchPlus, CheckCircle, Building2, Plus } from 'lucide-react';

type TabType = 'users' | 'teams';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
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
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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

  // Fetch all teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setTeams(data);
      } catch (err) {
        console.error('Error loading teams:', err);
        setError('Failed to load teams');
      }
    };

    if (user && user.role === 'manager') {
      loadTeams();
    }
  }, [user]);

  // Fetch user trees for all users
  useEffect(() => {
    if (activeTab === 'users' && users.length > 0) {
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

  // Filter teams based on search term
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Handle creating a new team
  const handleCreateTeam = async () => {
    if (!newTeamName) {
      setError('Team name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: newTeamName,
          description: newTeamDescription,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add team members
      if (selectedTeamMembers.length > 0) {
        const { error: membersError } = await supabase
          .from('team_members')
          .insert(
            selectedTeamMembers.map(userId => ({
              team_id: data.id,
              user_id: userId
            }))
          );

        if (membersError) throw membersError;
      }

      // Update local state
      setTeams([...teams, data]);
      
      // Reset form
      setNewTeamName('');
      setNewTeamDescription('');
      setSelectedTeamMembers([]);
      setShowCreateTeam(false);
      
      setSuccessMessage('Team created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error creating team:', err);
      setError('Failed to create team');
    }
  };

  // Handle updating a team
  const handleUpdateTeam = async (teamId: string) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      const { error } = await supabase
        .from('teams')
        .update({
          name: team.name,
          description: team.description
        })
        .eq('id', teamId);

      if (error) throw error;

      setEditingTeamId(null);
      setSuccessMessage('Team updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating team:', err);
      setError('Failed to update team');
    }
  };

  // Handle deleting a team
  const handleDeleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      // Update local state
      setTeams(teams.filter(t => t.id !== teamId));
      setShowDeleteTeamConfirm(null);
      
      setSuccessMessage('Team deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('Failed to delete team');
    }
  };

  // Handle removing a team member
  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', selectedTeam.id)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setTeamMembers(teamMembers.filter(member => member.userId !== userId));
      
      setSuccessMessage('Team member removed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error removing team member:', err);
      setError('Failed to remove team member');
    }
  };

  // Handle adding new team members
  const handleAddMembers = async () => {
    if (!selectedTeam || selectedUsers.length === 0) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .insert(
          selectedUsers.map(userId => ({
            team_id: selectedTeam.id,
            user_id: userId,
            joined_at: new Date().toISOString()
          }))
        );

      if (error) throw error;

      // Refresh team members
      const { data: newMembers } = await supabase
        .from('team_members')
        .select('*, user:users(*)')
        .eq('team_id', selectedTeam.id);

      setTeamMembers(newMembers || []);
      setSelectedUsers([]);
      setShowAddMembers(false);
      
      setSuccessMessage('Team members added successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error adding team members:', err);
      setError('Failed to add team members');
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
                <p className="text-gray-600">Loading...</p>
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
                    Admin Panel
                  </h1>
                  <p className="mt-1 text-primary-100">
                    Manage users, teams, and system settings
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('teams')}
                  className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm ${
                    activeTab === 'teams'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="h-5 w-5 mr-2" />
                  Teams
                </button>
              </nav>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => activeTab === 'users' ? setAddingUser(true) : setShowCreateTeam(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add New {activeTab === 'users' ? 'User' : 'Team'}
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

              {/* Content */}
              {activeTab === 'users' ? (
                /* Users list */
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
              ) : (
                /* Teams list */
                <div className="space-y-4">
                  {filteredTeams.map(team => (
                    <div
                      key={team.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      {editingTeamId === team.id ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={team.name}
                            onChange={(e) => setTeams(teams.map(t =>
                              t.id === team.id ? { ...t, name: e.target.value } : t
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Team name"
                          />
                          <textarea
                            value={team.description || ''}
                            onChange={(e) => setTeams(teams.map(t =>
                              t.id === team.id ? { ...t, description: e.target.value } : t
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Team description"
                            rows={2}
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateTeam(team.id)}
                              className="flex items-center px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTeamId(null)}
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
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                              {team.description && (
                                <p className="text-gray-500 mt-1">{team.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setEditingTeamId(team.id)}
                                className="text-gray-400 hover:text-primary-600 transition-colors"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setShowDeleteTeamConfirm(team.id)}
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
                                  onClick={() => handleDeleteTeam(team.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setShowDeleteTeamConfirm(null)}
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

                  {filteredTeams.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No teams found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchTerm ? 'Try a different search term' : 'Create your first team to get started'}
                      </p>
                    </div>
                  )}
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

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Building2 className="h-6 w-6 mr-2" />
                  Create New Team
                </h3>
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTeam(); }}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
                      Team Name
                    </label>
                    <input
                      type="text"
                      id="teamName"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter team name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      id="teamDescription"
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter team description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Members
                    </label>
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {users.map(u => (
                        <label
                          key={u.id}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTeamMembers.includes(u.id)}
                            onChange={(e) => {
                              setSelectedTeamMembers(prev =>
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
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Users className="h-6 w-6 mr-2" />
                  Team Members
                </h3>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Current Members</h4>
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Members
                  </button>
                </div>

                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                          {member.user?.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">{member.user?.email}</div>
                          <div className="text-sm text-gray-500">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}

                  {teamMembers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No members in this team yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembers && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <UserPlus className="h-6 w-6 mr-2" />
                  Add Team Members
                </h3>
                <button
                  onClick={() => setShowAddMembers(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {users
                  .filter(u => !teamMembers.some(m => m.userId === u.id))
                  .filter(u =>
                    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.role.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(user => (
                    <label
                      key={user.id}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
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
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddMembers(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={selectedUsers.length === 0}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Selected Members
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel;