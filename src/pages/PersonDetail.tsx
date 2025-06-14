import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import UserAvatar from '../components/common/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { User, SkillNode, CompletedTree, SkillTree } from '../types';
import { fetchAllUsers, getTeamMembers, getCompletedTrees } from '../services/userService';
import { getAllUserProgress, getSkillTrees, getSkillNodes } from '../services/supabase';
import SkillBadge from '../components/skill-tree/SkillBadge';
import {
  ArrowLeft,
  Award,
  Clock,
  GitBranchPlus,
  Target,
  Calendar,
  Mail,
  User as UserIcon,
  Shield,
  Star,
  Trophy,
  Activity,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronRight,
  Users,
  Zap
} from 'lucide-react';

const PersonDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<CompletedTree[]>([]);
  const [userAssignedTrees, setUserAssignedTrees] = useState<SkillTree[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Load user details
        const users = await fetchAllUsers();
        const foundUser = users.find(u => u.id === userId);
        setUser(foundUser || null);

        // Load assigned trees for the user
        const assignedTrees = await getSkillTrees(userId);
        // Fetch all nodes from only assigned trees
        let assignedNodes: SkillNode[] = [];
        for (const tree of assignedTrees) {
          const treeNodes = await getSkillNodes(tree.id);
          assignedNodes = assignedNodes.concat(treeNodes);
        }
        const [userProgress, userBadges] = await Promise.all([
          getAllUserProgress(userId),
          getCompletedTrees(userId)
        ]);

        setNodes(assignedNodes);
        setProgress(userProgress);
        setBadges(userBadges);
        setUserAssignedTrees(assignedTrees);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const calculateStats = () => {
    const completedTreesArr = badges || [];
    const completedTrees = completedTreesArr.length;
    const assignedTrees = userAssignedTrees || [];
    const completedTreeIds = new Set(completedTreesArr.map(b => b.treeId));
    const inProgressTrees = assignedTrees.filter((tree: SkillTree) => !completedTreeIds.has(tree.id)).length;
    const completionRate = assignedTrees.length > 0
      ? Math.round((completedTrees / assignedTrees.length) * 100)
      : 0;
    // totalSkills is still nodes.length if you want to display it elsewhere
    return {
      totalSkills: nodes.length,
      completedTrees,
      inProgressTrees,
      completionRate
    };
  };



  const getDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">User Not Found</h2>
            <p className="text-gray-500 mb-4">
              The user you're looking for doesn't exist
            </p>
            <Link
              to="/people"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to People
            </Link>
          </div>
        </div>
      </>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          to="/people"
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to People
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <UserAvatar user={user} size="xl" />
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getDisplayName(user)}
                  </h1>
                  <div className="flex items-center mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === 'manager' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                    <span className="flex items-center text-gray-500 text-sm ml-4">
                      <Mail className="h-4 w-4 mr-1" />
                      {user.email}
                    </span>
                    <span className="flex items-center text-gray-500 text-sm ml-4">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Overall Progress</span>
              <span className="font-medium text-gray-900">{stats.completionRate}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges Section */}
        {badges.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <Trophy className="h-5 w-5 text-primary-600 mr-2" />
              Earned Badges
            </h2>
            <div className="flex flex-wrap gap-3">
              {badges.map(badge => (
                <SkillBadge
                  key={`${badge.treeId}-${badge.skillTypeId}`}
                  skillType={badge.skillType!}
                  completedAt={badge.completedAt}
                  size="lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Completed Trees */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.completedTrees}
            </h3>
            <p className="text-gray-600">Completed Trees</p>
          </div>

          {/* Trees in Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.inProgressTrees}
            </h3>
            <p className="text-gray-600">Trees in Progress</p>
          </div>

          {/* Total Skills */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.totalSkills}
            </h3>
            <p className="text-gray-600">Total Skills</p>
          </div>

          {/* Study Time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.completedTrees * 2}h
            </h3>
            <p className="text-gray-600">Study Time</p>
          </div>
        </div>

        {/* Skills List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <GitBranchPlus className="h-5 w-5 text-primary-600 mr-2" />
              Skills Progress
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {nodes.map(node => (
              <div key={node.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {progress[node.id] ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="ml-3 font-medium text-gray-900">
                      {node.title}
                    </span>
                  </div>
                  <Link
                    to={`/node/${node.id}`}
                    className="text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                {node.description && (
                  <p className="mt-1 text-sm text-gray-500 ml-8">
                    {node.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonDetail;