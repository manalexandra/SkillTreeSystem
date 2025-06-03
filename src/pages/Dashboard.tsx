import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSkillTreeStore } from '../stores/skillTreeStore';
import SkillTreeView from '../components/skill-tree/SkillTreeView';
import Navbar from '../components/layout/Navbar';
import { 
  GitBranchPlus, 
  TreeDeciduous, 
  Award, 
  Users, 
  Target, 
  ChevronRight,
  BarChart,
  Clock,
  CheckCircle
} from 'lucide-react';

import { fetchUserCount, fetchSkillTreeCount } from '../services/dashboardService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { trees, fetchTrees, nodes } = useSkillTreeStore();
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Dashboard metrics state
  const [userCount, setUserCount] = useState<number | null>(null);
  const [treeCount, setTreeCount] = useState<number | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Animation states
  const [showContent, setShowContent] = useState(false);

  // Fetch dashboard metrics
  useEffect(() => {
    let mounted = true;
    setMetricsLoading(true);
    Promise.all([fetchUserCount(), fetchSkillTreeCount()])
      .then(([users, trees]) => {
        if (mounted) {
          setUserCount(users);
          setTreeCount(trees);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) {
          setMetricsLoading(false);
          // Trigger animation after data loads
          setTimeout(() => setShowContent(true), 100);
        }
      });
    return () => { mounted = false; };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Fetch trees on mount
  useEffect(() => {
    if (user) {
      fetchTrees();
    }
  }, [fetchTrees, user]);

  // Set first tree as selected by default
  useEffect(() => {
    if (trees.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id);
    }
  }, [trees, selectedTreeId]);

  // Calculate completion percentage for a tree
  const calculateTreeCompletion = (treeId: string) => {
    const treeNodes = nodes.filter(node => node.treeId === treeId);
    if (!treeNodes.length) return 0;
    const completedNodes = treeNodes.filter(node => node.completed).length;
    return Math.round((completedNodes / treeNodes.length) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 transition-all duration-500 transform ${
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email}!
          </h1>
          <p className="text-gray-600">
            Track your progress and continue your learning journey
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Trees */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`} style={{ transitionDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <GitBranchPlus className="h-6 w-6 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {metricsLoading ? '-' : treeCount}
            </h3>
            <p className="text-gray-600">Active Skill Trees</p>
          </div>

          {/* Total Users */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-secondary-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-secondary-600" />
              </div>
              <span className="text-sm font-medium text-secondary-600 bg-secondary-50 px-3 py-1 rounded-full">
                Community
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {metricsLoading ? '-' : userCount}
            </h3>
            <p className="text-gray-600">Total Users</p>
          </div>

          {/* Completed Skills */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`} style={{ transitionDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <span className="text-sm font-medium text-success-600 bg-success-50 px-3 py-1 rounded-full">
                Progress
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {nodes.filter(n => n.completed).length}
            </h3>
            <p className="text-gray-600">Completed Skills</p>
          </div>

          {/* Time Tracking */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`} style={{ transitionDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-accent-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-accent-600" />
              </div>
              <span className="text-sm font-medium text-accent-600 bg-accent-50 px-3 py-1 rounded-full">
                Time
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {trees.length * 2}h
            </h3>
            <p className="text-gray-600">Learning Time</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Skill Trees List */}
          <div className="lg:col-span-1">
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-500 transform ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '500ms' }}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GitBranchPlus className="h-5 w-5 text-primary-600 mr-2" />
                  Your Skill Trees
                </h2>
              </div>

              <div className="p-4">
                {trees.length === 0 ? (
                  <div className="text-center py-8">
                    <TreeDeciduous className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No trees available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {user?.role === 'manager' 
                        ? 'Create your first skill tree!'
                        : 'No skill trees assigned yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trees.map((tree) => (
                      <button
                        key={tree.id}
                        onClick={() => setSelectedTreeId(tree.id)}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                          selectedTreeId === tree.id
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-medium ${
                            selectedTreeId === tree.id ? 'text-primary-900' : 'text-gray-900'
                          }`}>
                            {tree.name}
                          </h3>
                          <ChevronRight className={`h-4 w-4 ${
                            selectedTreeId === tree.id ? 'text-primary-500' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <Target className="h-4 w-4 mr-1" />
                            <span>{nodes.filter(n => n.treeId === tree.id).length} skills</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${calculateTreeCompletion(tree.id)}%` }}
                              />
                            </div>
                            <span className="text-gray-600">
                              {calculateTreeCompletion(tree.id)}%
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Tree View */}
          <div className="lg:col-span-2">
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 transform ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '600ms' }}>
              {selectedTreeId ? (
                <SkillTreeView treeId={selectedTreeId} />
              ) : (
                <div className="text-center py-12">
                  <GitBranchPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Skill Tree Selected
                  </h3>
                  <p className="text-gray-600">
                    {trees.length > 0
                      ? 'Select a skill tree from the sidebar to view details'
                      : 'No skill trees available yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;