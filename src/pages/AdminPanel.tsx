import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { fetchAllUsers, updateUserRole, deleteUser, addUser, getTeamMembers } from '../services/userService';
import { getSkillTrees, supabase } from '../services/supabase';
import { User, UserRole, Team, SkillType } from '../types';
import { UserPlus, AlertTriangle, Search, Shield, X, CheckCircle, Building2, Plus, BookOpen } from 'lucide-react';
import UserTable from '../components/admin/UserTable';
import TeamList from '../components/admin/TeamList';
import TeamMembersModal from '../components/admin/TeamMembersModal';
import EditTeamModal from '../components/admin/EditTeamModal';
import SkillTypeModal from '../components/admin/SkillTypeModal';
import SkillTypeList from '../components/admin/SkillTypeList';

type TabType = 'users' | 'teams' | 'skills';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [skillTypes, setSkillTypes] = useState<SkillType[]>([]);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState<string | null>(null);
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);
  const [viewTeamMembers, setViewTeamMembers] = useState<any[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [editingSkillType, setEditingSkillType] = useState<SkillType | null>(null);
  const [savingSkillType, setSavingSkillType] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'manager') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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

  useEffect(() => {
    const loadSkillTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('skill_types')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setSkillTypes(data || []);
      } catch (err) {
        console.error('Error loading skill types:', err);
        setError('Failed to load skill types');
      }
    };

    if (user && user.role === 'manager') {
      loadSkillTypes();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'users' && users.length > 0) {
      const fetchAllUserTrees = async () => {
        const allTrees: Record<string, any[]> = {};
        for (const u of users) {
          allTrees[u.id] = await getSkillTrees(u.id);
        }
        setUserTrees(allTrees);
      };
      fetchAllUserTrees();
    }
  }, [activeTab, users]);

  useEffect(() => {
    if (viewingTeamId) {
      loadTeamMembers(viewingTeamId);
    }
  }, [viewingTeamId]);

  const loadTeamMembers = async (teamId: string) => {
    setLoadingTeamMembers(true);
    try {
      const members = await getTeamMembers(teamId);
      setViewTeamMembers(members);
    } catch (err) {
      console.error('Error loading team members:', err);
      setError('Failed to load team members');
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateRole = async (userId: string) => {
    if (!editRole) return;
    
    try {
      await updateUserRole(userId, editRole);
      
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

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      
      setUsers(users.filter(u => u.id !== userId));
      
      setSuccessMessage('User deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
    
    setShowDeleteConfirm(null);
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      setAddUserError('Email and password are required');
      return;
    }
    
    try {
      setAddingUser(true);
      
      await addUser(newUserEmail, newUserPassword, newUserRole);
      
      const updatedUsers = await fetchAllUsers();
      setUsers(updatedUsers);
      
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

  const handleUpdateTeam = async (team: Team, selectedUsers: string[]) => {
    try {
      const { error: teamError } = await supabase
        .from('teams')
        .update({
          name: team.name,
          description: team.description
        })
        .eq('id', team.id);

      if (teamError) throw teamError;

      if (selectedUsers.length > 0) {
        const { error: deleteError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', team.id);

        if (deleteError) throw deleteError;

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(
            selectedUsers.map(userId => ({
              team_id: team.id,
              user_id: userId
            }))
          );

        if (membersError) throw membersError;
      }

      setTeams(teams.map(t => t.id === team.id ? team : t));
      setSuccessMessage('Team updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating team:', err);
      setError('Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      setTeams(teams.filter(t => t.id !== teamId));
      setShowDeleteTeamConfirm(null);
      
      setSuccessMessage('Team deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('Failed to delete team');
    }
  };

  const handleTeamChange = (teamId: string, field: 'name' | 'description', value: string) => {
    setTeams(teams.map(t =>
      t.id === teamId ? { ...t, [field]: value } : t
    ));
  };

  const handleSaveSkillType = async (skillType: Partial<SkillType>) => {
    if (!user) return;
    
    setSavingSkillType(true);
    try {
      if (skillType.id) {
        const { data, error } = await supabase
          .from('skill_types')
          .update({
            name: skillType.name,
            description: skillType.description,
            level: skillType.level
          })
          .eq('id', skillType.id)
          .select()
          .single();

        if (error) throw error;
        
        setSkillTypes(prev => 
          prev.map(st => st.id === data.id ? data : st)
        );
      } else {
        const { data, error } = await supabase
          .from('skill_types')
          .insert({
            name: skillType.name,
            description: skillType.description,
            level: skillType.level,
            created_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        
        setSkillTypes(prev => [...prev, data]);
      }

      setEditingSkillType(null);
      setSuccessMessage(`Skill type ${skillType.id ? 'updated' : 'created'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving skill type:', err);
      setError(`Failed to ${skillType.id ? 'update' : 'create'} skill type`);
    } finally {
      setSavingSkillType(false);
    }
  };

  const handleDeleteSkillType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('skill_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSkillTypes(prev => prev.filter(st => st.id !== id));
      setSuccessMessage('Skill type deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting skill type:', err);
      setError('Failed to delete skill type');
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
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
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
                  <UserPlus className="h-5 w-5 mr-2" />
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
                <button
                  onClick={() => setActiveTab('skills')}
                  className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm ${
                    activeTab === 'skills'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Skills
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
                  onClick={() => {
                    if (activeTab === 'users') setAddingUser(true);
                    else if (activeTab === 'teams') setEditingTeamId('');
                    else if (activeTab === 'skills') setEditingSkillType({} as SkillType);
                  }}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add New {activeTab === 'users' ? 'User' : activeTab === 'teams' ? 'Team' : 'Skill Type'}
                </button>
              </div>

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

              {activeTab === 'users' && (
                <UserTable
                  users={filteredUsers}
                  userTrees={userTrees}
                  editingUserId={editingUserId}
                  editRole={editRole}
                  showDeleteConfirm={showDeleteConfirm}
                  currentUserId={user?.id}
                  onEditRole={handleUpdateRole}
                  onStartEditing={startEditing}
                  onCancelEditing={cancelEditing}
                  onDeleteUser={handleDeleteUser}
                  onShowDeleteConfirm={setShowDeleteConfirm}
                  onHideDeleteConfirm={() => setShowDeleteConfirm(null)}
                />
              )}

              {activeTab === 'teams' && (
                <TeamList
                  teams={filteredTeams}
                  users={users}
                  showDeleteTeamConfirm={showDeleteTeamConfirm}
                  onDeleteTeam={handleDeleteTeam}
                  onShowDeleteConfirm={setShowDeleteTeamConfirm}
                  onHideDeleteConfirm={() => setShowDeleteTeamConfirm(null)}
                  onViewTeam={setViewingTeamId}
                  onUpdateTeam={handleUpdateTeam}
                />
              )}

              {activeTab === 'skills' && (
                <SkillTypeList
                  skillTypes={skillTypes.filter(st =>
                    st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    st.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  )}
                  onEdit={setEditingSkillType}
                  onDelete={handleDeleteSkillType}
                />
              )}
            </div>
          </div>
        </div>
      </div>

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
                      className="w-full px-3  py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

      {editingTeamId === '' && (
        <EditTeamModal
          team={{ id: '', name: '', description: '', createdBy: user?.id || '', createdAt: new Date().toISOString() }}
          users={users}
          onClose={() => setEditingTeamId(null)}
          onSave={async (team, selectedUsers) => {
            try {
              const { data, error } = await supabase
                .from('teams')
                .insert({
                  name: team.name,
                  description: team.description,
                  created_by: user?.id
                })
                .select()
                .single();

              if (error) throw error;

              if (selectedUsers.length > 0) {
                const { error: membersError } = await supabase
                  .from('team_members')
                  .insert(
                    selectedUsers.map(userId => ({
                      team_id: data.id,
                      user_id: userId
                    }))
                  );

                if (membersError) throw membersError;
              }

              setTeams([...teams, data]);
              setEditingTeamId(null);
              setSuccessMessage('Team created successfully');
              setTimeout(() => setSuccessMessage(null), 3000);
            } catch (err) {
              console.error('Error creating team:', err);
              setError('Failed to create team');
            }
          }}
        />
      )}

      {viewingTeamId && (
        <TeamMembersModal
          team={teams.find(t => t.id === viewingTeamId)!}
          members={viewTeamMembers}
          loading={loadingTeamMembers}
          onClose={() => setViewingTeamId(null)}
        />
      )}

      {editingSkillType !== null && (
        <SkillTypeModal
          skillType={editingSkillType.id ? editingSkillType : undefined}
          onClose={() => setEditingSkillType(null)}
          onSave={handleSaveSkillType}
          isLoading={savingSkillType}
        />
      )}
    </>
  );
};

export default AdminPanel;