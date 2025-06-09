import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import UserAvatar from '../components/common/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { fetchAllUsers, getTeamMembers, getCompletedTrees } from '../services/userService';
import { getAllUserProgress, supabase } from '../services/supabase';
import { User, Team, CompletedTree, SkillType } from '../types';
import SkillBadge from '../components/skill-tree/SkillBadge';
import { 
  Search, 
  Users, 
  Building2, 
  Filter,
  ChevronRight,
  Award,
  Clock,
  GitBranchPlus,
  CheckCircle,
  Trophy
} from 'lucide-react';

const PeopleOverview: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, string[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');
  const [userProgress, setUserProgress] = useState<Record<string, Record<string, boolean>>>({});
  const [userBadges, setUserBadges] = useState<Record<string, CompletedTree[]>>({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [skillTypes, setSkillTypes] = useState<SkillType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load users
        const allUsers = await fetchAllUsers();
        setUsers(allUsers);

        // Load teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name');
        
        if (teamsError) throw teamsError;
        setTeams(teamsData || []);

        // Load skill types
        const { data: skillTypesData, error: skillTypesError } = await supabase
          .from('skill_types')
          .select('*')
          .order('name');

        if (skillTypesError) throw skillTypesError;
        setSkillTypes(skillTypesData || []);

        // Load team members for each team
        const membersMap: Record<string, string[]> = {};
        for (const team of teamsData || []) {
          const members = await getTeamMembers(team.id);
          membersMap[team.id] = members.map(m => m.userId);
        }
        setTeamMembers(membersMap);

        // Load progress and badges for each user
        const progressMap: Record<string, Record<string, boolean>> = {};
        const badgesMap: Record<string, CompletedTree[]> = {};
        
        for (const user of allUsers) {
          const [progress, badges] = await Promise.all([
            getAllUserProgress(user.id),
            getCompletedTrees(user.id)
          ]);
          progressMap[user.id] = progress;
          badgesMap[user.id] = badges;
        }
        
        setUserProgress(progressMap);
        setUserBadges(badgesMap);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateUserStats = (userId: string) => {
    const progress = userProgress[userId] || {};
    const totalSkills = Object.keys(progress).length;
    const completedSkills = Object.values(progress).filter(Boolean).length;
    const completionRate = totalSkills > 0 
      ? Math.round((completedSkills / totalSkills) * 100) 
      : 0;

    return {
      totalSkills,
      completedSkills,
      completionRate
    };
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedTeam !== 'all') count++;
    if (selectedBadge !== 'all') count++;
    return count;
  };

  const getDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  const filteredUsers = users.filter(user => {
    const displayName = getDisplayName(user);
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === 'all' || 
      (teamMembers[selectedTeam] && teamMembers[selectedTeam].includes(user.id));
    const matchesBadge = selectedBadge === 'all' ||
      userBadges[user.id]?.some(badge => badge.skillTypeId === selectedBadge);
    return matchesSearch && matchesTeam && matchesBadge;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-7 w-7 mr-3 text-primary-600" />
                People Overview
              </h1>
              <p className="mt-1 text-gray-500">
                Track and manage team members' progress
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center px-4 py-2 text-gray-700 rounded-lg transition-colors ${
                    showFilters 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                  {getActiveFiltersCount() > 0 && (
                    <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        Team
                      </div>
                    </label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">All Teams</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1" />
                        Earned Badge
                      </div>
                    </label>
                    <select
                      value={selectedBadge}
                      onChange={(e) => setSelectedBadge(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">All Badges</option>
                      {skillTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => {
            const stats = calculateUserStats(user.id);
            const userTeams = teams.filter(team => 
              teamMembers[team.id]?.includes(user.id)
            );
            const badges = userBadges[user.id] || [];

            return (
              <Link
                key={user.id}
                to={`/people/${user.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <UserAvatar user={user} size="lg" />
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        {getDisplayName(user)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'manager' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                        {userTeams.length > 0 && (
                          <span className="flex items-center text-xs text-gray-500">
                            <Building2 className="h-3 w-3 mr-1" />
                            {userTeams[0].name}
                            {userTeams.length > 1 && ` +${userTeams.length - 1}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {badges.slice(0, 3).map(badge => (
                      <SkillBadge
                        key={`${badge.treeId}-${badge.skillTypeId}`}
                        skillType={badge.skillType!}
                        completedAt={badge.completedAt}
                        size="sm"
                      />
                    ))}
                    {badges.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                        +{badges.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">Overall Progress</span>
                      <span className="font-medium text-gray-900">{stats.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.completedSkills}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Completed
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.totalSkills - stats.completedSkills}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        In Progress
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.totalSkills}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Total Skills
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No people found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading people...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeopleOverview;