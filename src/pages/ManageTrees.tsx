import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSkillTreeStore } from '../stores/skillTreeStore';
import Navbar from '../components/layout/Navbar';
import SkillTreeView from '../components/skill-tree/SkillTreeView';
import SkillNodeForm from '../components/skill-tree/SkillNodeForm';
import CreateTreeForm from '../components/skill-tree/CreateTreeForm';
import { Plus, Edit, GitBranchPlus, TreeDeciduous, Search, ChevronRight, Users, CheckCircle } from 'lucide-react';
import type { SkillNode as SkillNodeType, User } from '../types';
import { getUserProgress } from '../services/supabase';
import { getTreeAssignedUsers } from '../services/userService';

interface UserProgress {
  user: User;
  completedNodes: number;
  totalNodes: number;
}

const ManageTrees: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { trees, nodes, fetchTrees } = useSkillTreeStore();
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [showCreateTree, setShowCreateTree] = useState(false);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [editNode, setEditNode] = useState<SkillNodeType | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const navigate = useNavigate();

  // Redirect if not authenticated or not a manager
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'manager')) {
      navigate('/dashboard');
    }
  }, [authLoading, user, navigate]);

  // Fetch trees on mount
  useEffect(() => {
    if (user && user.role === 'manager') {
      fetchTrees();
    }
  }, [fetchTrees, user]);

  // Set first tree as selected by default
  useEffect(() => {
    if (trees.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id);
    }
  }, [trees, selectedTreeId]);

  // Fetch assigned users and their progress when a tree is selected
  useEffect(() => {
    const loadUsersAndProgress = async () => {
      if (!selectedTreeId) return;
      
      setLoadingProgress(true);
      try {
        // Get assigned users for the selected tree
        const users = await getTreeAssignedUsers(selectedTreeId);
        setAssignedUsers(users);

        // Get progress for each assigned user
        const progressPromises = users.map(async (user) => {
          const progress = await getUserProgress(user.id, selectedTreeId);
          const completedNodes = Object.values(progress).filter(Boolean).length;
          const totalNodes = nodes.filter(n => n.treeId === selectedTreeId).length;
          
          return {
            user,
            completedNodes,
            totalNodes
          };
        });

        const allProgress = await Promise.all(progressPromises);
        setUserProgress(allProgress);
      } catch (error) {
        console.error('Error loading users and progress:', error);
      } finally {
        setLoadingProgress(false);
      }
    };

    loadUsersAndProgress();
  }, [selectedTreeId, nodes]);

  const handleCreateTreeSuccess = (treeId: string) => {
    setSelectedTreeId(treeId);
  };

  const handleEditNode = (node: SkillNodeType) => {
    setEditNode(node);
    setShowNodeForm(true);
  };

  const filteredTrees = trees.filter(tree =>
    tree.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <GitBranchPlus className="h-6 w-6 mr-2" />
                  Manage Skill Trees
                </h1>
                <p className="text-primary-100 mt-1">
                  Create and manage skill development paths for your team
                </p>
              </div>
              <button
                onClick={() => setShowCreateTree(true)}
                className="flex items-center px-4 py-2 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Tree
              </button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-start">
            {/* Sidebar with tree selection */}
            <div className="w-full lg:w-80 p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search trees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredTrees.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <TreeDeciduous className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">No trees found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {searchTerm ? 'Try a different search term' : 'Create your first skill tree'}
                    </p>
                  </div>
                ) : (
                  filteredTrees.map((tree) => (
                    <button
                      key={tree.id}
                      onClick={() => setSelectedTreeId(tree.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                        selectedTreeId === tree.id
                          ? 'bg-primary-50 border-2 border-primary-500'
                          : 'bg-white border border-gray-200 hover:border-primary-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <GitBranchPlus className={`h-5 w-5 ${
                            selectedTreeId === tree.id ? 'text-primary-600' : 'text-gray-500'
                          }`} />
                          <span className={`ml-3 font-medium ${
                            selectedTreeId === tree.id ? 'text-primary-900' : 'text-gray-700'
                          }`}>
                            {tree.name}
                          </span>
                        </div>
                        <ChevronRight className={`h-4 w-4 ${
                          selectedTreeId === tree.id ? 'text-primary-500' : 'text-gray-400'
                        }`} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {/* Main content area */}
            <div className="flex-grow p-6">
              {selectedTreeId ? (
                <div className="space-y-8">
                  {/* Tree Structure Section */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Tree Structure</h3>
                      <button
                        onClick={() => {
                          setEditNode(undefined);
                          setShowNodeForm(true);
                        }}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Node
                      </button>
                    </div>
                    
                    <SkillTreeView 
                      treeId={selectedTreeId} 
                      isEditable={true}
                      onEditNode={handleEditNode}
                    />
                  </div>

                  {/* User Progress Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary-600" />
                      Assigned Users & Progress
                    </h3>

                    {loadingProgress ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading user progress...</p>
                      </div>
                    ) : userProgress.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {userProgress.map(({ user, completedNodes, totalNodes }) => (
                          <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-3">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                                {user.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">
                                  {completedNodes}/{totalNodes} nodes
                                </span>
                              </div>
                              
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${(completedNodes / totalNodes) * 100}%` }}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                  {Math.round((completedNodes / totalNodes) * 100)}% Complete
                                </span>
                                {completedNodes === totalNodes && (
                                  <span className="flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No users assigned</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Assign users to this skill tree to track their progress
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                  <GitBranchPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Skill Tree Selected</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {trees.length > 0
                      ? 'Select a skill tree from the sidebar to view and edit its structure'
                      : 'Create your first skill tree to start building learning paths for your team'}
                  </p>
                  {trees.length === 0 && (
                    <button
                      onClick={() => setShowCreateTree(true)}
                      className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Tree
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Forms */}
      {showCreateTree && (
        <CreateTreeForm 
          onClose={() => setShowCreateTree(false)} 
          onSuccess={handleCreateTreeSuccess}
        />
      )}
      
      {showNodeForm && selectedTreeId && (
        <SkillNodeForm 
          treeId={selectedTreeId} 
          node={editNode}
          onClose={() => {
            setShowNodeForm(false);
            setEditNode(undefined);
          }}
          isEdit={!!editNode}
        />
      )}
    </div>
  );
};

export default ManageTrees;