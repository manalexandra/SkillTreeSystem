import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSkillTreeStore } from '../stores/skillTreeStore';
import SkillTreeView from '../components/skill-tree/SkillTreeView';
import UserAvatar from '../components/common/UserAvatar';
import Navbar from '../components/layout/Navbar';
import { 
  GitBranchPlus, 
  TreeDeciduous,
  Target,
  ChevronRight,
  Award,
  Clock,
  CheckCircle,
  Zap,
  BookOpen
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { trees, fetchTrees, nodes, userProgress, completedTreeCount, fetchCompletedTreeCount, inProgressTrees, fetchInProgressTrees } = useSkillTreeStore();
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Fetch trees and completed tree count on mount
  useEffect(() => {
    if (user) {
      fetchTrees(user);
      fetchCompletedTreeCount(user.id);
      fetchInProgressTrees(user.id);
      // Trigger animation after component mounts
      setTimeout(() => setShowContent(true), 100);
    }
  }, [fetchTrees, fetchCompletedTreeCount, fetchInProgressTrees, user]);

  // Set first tree as selected by default
  useEffect(() => {
    if (trees.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id);
    }
  }, [trees, selectedTreeId]);

  // Calculate completion percentage for a tree
  // Calculate completion percentage for a tree using node progress (score 0-10)
  const calculateTreeCompletion = (treeId: string) => {
    const treeNodes = nodes.filter(node => node.treeId === treeId);
    if (!treeNodes.length) return 0;
    // Use userProgress mapping: node.id -> score (0-10)
    const totalScore = treeNodes.reduce((sum, node) => {
      const score = typeof userProgress[node.id] === 'number' ? userProgress[node.id] : 0;
      return sum + score;
    }, 0);
    const maxScore = treeNodes.length * 10;
    return Math.round((totalScore / maxScore) * 100);
  };

  // Get total completed skills across all trees
  const getTotalCompletedSkills = () => {
    return nodes.filter(node => node.completed).length;
  };

  // Get total skills in progress (started but not completed)
  const getSkillsInProgress = () => {
    return nodes.filter(node => node.progress && node.progress > 0 && !node.completed).length;
  };

  // Get the next recommended skill
  const getNextSkill = () => {
    return nodes.find(node => !node.completed && (!node.progress || node.progress < 100));
  };

  const getDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email.split('@')[0];
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 transition-all duration-500 transform ${
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {user && <UserAvatar user={user} size="lg" />}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {getDisplayName()}!
              </h1>
              <p className="text-gray-600">
                Continue your learning journey
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Skills Mastered */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`} style={{ transitionDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-success-600" />
              </div>
              <span className="text-sm font-medium text-success-600 bg-success-50 px-3 py-1 rounded-full">
                Mastered
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {completedTreeCount}
            </h3>
            <p className="text-gray-600">Skills Mastered</p>
          </div>

          {/* Skills in Progress */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {inProgressTrees.length}
            </h3>
            <p className="text-gray-600">Skills in Progress</p>
          </div>

          {/* Learning Paths */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`} style={{ transitionDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-secondary-100 p-3 rounded-lg">
                <GitBranchPlus className="h-6 w-6 text-secondary-600" />
              </div>
              <span className="text-sm font-medium text-secondary-600 bg-secondary-50 px-3 py-1 rounded-full">
                Paths
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {trees.length}
            </h3>
            <p className="text-gray-600">Learning Paths</p>
          </div>


        </div>

        {/* Next Up Section */}
        {getNextSkill() && (
          <div className={`mb-8 transition-all duration-500 transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`} style={{ transitionDelay: '500ms' }}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 text-primary-600 mr-2" />
                  Next Up
                </h2>
                <Link
                  to={`/node/${getNextSkill()?.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center"
                >
                  Start Learning
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  {getNextSkill()?.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {getNextSkill()?.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Skill Trees List */}
          <div className="lg:col-span-1">
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-500 transform ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '600ms' }}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GitBranchPlus className="h-5 w-5 text-primary-600 mr-2" />
                  Your Learning Paths
                </h2>
              </div>

              <div className="p-4">
                {trees.length === 0 ? (
                  <div className="text-center py-8">
                    <TreeDeciduous className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No paths available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      You haven't been assigned any learning paths yet
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
            }`} style={{ transitionDelay: '700ms' }}>
              {selectedTreeId ? (
                <SkillTreeView treeId={selectedTreeId} />
              ) : (
                <div className="text-center py-12">
                  <GitBranchPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Learning Path
                  </h3>
                  <p className="text-gray-600">
                    Choose a learning path from the sidebar to view your progress
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