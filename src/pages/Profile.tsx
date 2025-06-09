import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { getCompletedTrees, fetchAllUsers } from '../services/userService';
import { getAllUserProgress, getAllSkillNodes, supabase } from '../services/supabase';
import SkillBadge from '../components/skill-tree/SkillBadge';
import { User, CompletedTree, SkillNode, UserStats } from '../types';
import {
  Camera,
  Edit3,
  Save,
  X,
  Award,
  Target,
  Zap,
  Clock,
  TrendingUp,
  Calendar,
  Mail,
  User as UserIcon,
  Shield,
  Star,
  Trophy,
  Activity,
  BookOpen,
  CheckCircle,
  Upload,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [badges, setBadges] = useState<CompletedTree[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Profile picture preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfileData();
  }, [user, navigate]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user profile
      const users = await fetchAllUsers();
      const profile = users.find(u => u.id === user.id);
      setUserProfile(profile || null);
      
      if (profile) {
        setEditForm({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email
        });
      }

      // Load badges
      const userBadges = await getCompletedTrees(user.id);
      setBadges(userBadges);

      // Load stats
      const [progress, nodes] = await Promise.all([
        getAllUserProgress(user.id),
        getAllSkillNodes()
      ]);

      const totalSkills = nodes.length;
      const completedSkills = Object.values(progress).filter(Boolean).length;
      const inProgressSkills = nodes.filter(node => 
        progress[node.id] === false && node.progress && node.progress > 0
      ).length;

      const userStats: UserStats = {
        totalSkills,
        completedSkills,
        inProgressSkills,
        completionRate: totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0,
        totalBadges: userBadges.length,
        studyTime: completedSkills * 2, // Estimated 2 hours per skill
        streak: Math.floor(Math.random() * 30) + 1, // Mock streak data
        level: Math.floor(completedSkills / 5) + 1 // Level based on completed skills
      };

      setStats(userStats);
    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ image_url: imageUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setUserProfile(prev => prev ? { ...prev, imageUrl } : null);
      setPreviewUrl(imageUrl);
      setSuccess('Profile picture updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user || !userProfile?.imageUrl) return;

    try {
      // Extract filename from URL
      const url = new URL(userProfile.imageUrl);
      const fileName = url.pathname.split('/').pop();

      if (fileName) {
        // Delete from storage
        await supabase.storage
          .from('avatars')
          .remove([fileName]);
      }

      // Update database
      const { error } = await supabase
        .from('users')
        .update({ image_url: null })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUserProfile(prev => prev ? { ...prev, imageUrl: undefined } : null);
      setPreviewUrl(null);
      setSuccess('Profile picture removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error removing image:', error);
      setError('Failed to remove image. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editForm.firstName || null,
          last_name: editForm.lastName || null,
          email: editForm.email
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email
      } : null);

      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };

  const getDisplayName = () => {
    if (userProfile?.firstName || userProfile?.lastName) {
      return `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
    }
    return userProfile?.email || 'User';
  };

  const getInitials = () => {
    if (userProfile?.firstName || userProfile?.lastName) {
      const first = userProfile.firstName?.charAt(0) || '';
      const last = userProfile.lastName?.charAt(0) || '';
      return (first + last).toUpperCase();
    }
    return userProfile?.email.charAt(0).toUpperCase() || 'U';
  };

  const getLevelProgress = () => {
    if (!stats) return 0;
    const currentLevelSkills = (stats.level - 1) * 5;
    const nextLevelSkills = stats.level * 5;
    const progress = stats.completedSkills - currentLevelSkills;
    const total = nextLevelSkills - currentLevelSkills;
    return Math.min((progress / total) * 100, 100);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
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
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
              <X className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="h-32 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800"></div>
            <div className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
                {/* Profile Picture */}
                <div className="relative -mt-16 mb-4 sm:mb-0">
                  <div className="relative group">
                    {userProfile?.imageUrl || previewUrl ? (
                      <img
                        src={previewUrl || userProfile.imageUrl}
                        alt="Profile"
                        className="h-32 w-32 rounded-full border-4 border-white shadow-lg object-cover cursor-pointer"
                        onClick={() => setShowImageModal(true)}
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl">
                        {getInitials()}
                      </div>
                    )}
                    
                    {/* Upload overlay */}
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                          disabled={uploading}
                          title="Upload new picture"
                        >
                          {uploading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                          ) : (
                            <Camera className="h-5 w-5" />
                          )}
                        </button>
                        {(userProfile?.imageUrl || previewUrl) && (
                          <button
                            onClick={handleRemoveImage}
                            className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove picture"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {editing ? (
                        <div className="space-y-3">
                          <div className="flex space-x-3">
                            <input
                              type="text"
                              placeholder="First name"
                              value={editForm.firstName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              placeholder="Last name"
                              value={editForm.lastName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <input
                            type="email"
                            placeholder="Email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      ) : (
                        <>
                          <h1 className="text-3xl font-bold text-gray-900">{getDisplayName()}</h1>
                          <div className="flex items-center mt-2 space-x-4">
                            <div className="flex items-center text-gray-600">
                              <Mail className="h-4 w-4 mr-2" />
                              {userProfile?.email}
                            </div>
                            <div className="flex items-center">
                              <Shield className={`h-4 w-4 mr-2 ${
                                userProfile?.role === 'manager' ? 'text-purple-600' : 'text-blue-600'
                              }`} />
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                userProfile?.role === 'manager' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {userProfile?.role}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 sm:mt-0 flex space-x-3">
                      {editing ? (
                        <>
                          <button
                            onClick={handleSaveProfile}
                            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditing(false);
                              setEditForm({
                                firstName: userProfile?.firstName || '',
                                lastName: userProfile?.lastName || '',
                                email: userProfile?.email || ''
                              });
                            }}
                            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditing(true)}
                          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Level Progress */}
                  {stats && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Level {stats.level}</span>
                        <span className="text-gray-600">
                          {stats.completedSkills % 5}/5 skills to next level
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getLevelProgress()}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    Level {stats.level}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.completedSkills}
                </h3>
                <p className="text-gray-600">Skills Mastered</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.inProgressSkills}
                </h3>
                <p className="text-gray-600">In Progress</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    Earned
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.totalBadges}
                </h3>
                <p className="text-gray-600">Badges</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    Streak
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.streak}
                </h3>
                <p className="text-gray-600">Day Streak</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Achievements */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
                  <Trophy className="h-6 w-6 text-primary-600 mr-2" />
                  Achievements & Badges
                </h2>

                {badges.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {badges.map(badge => (
                      <div
                        key={`${badge.treeId}-${badge.skillTypeId}`}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <SkillBadge
                            skillType={badge.skillType!}
                            completedAt={badge.completedAt}
                            size="md"
                          />
                          <span className="text-xs text-gray-500">
                            {new Date(badge.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {badge.skillType?.description || 'Skill mastery achievement'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No badges yet
                    </h3>
                    <p className="text-gray-500">
                      Complete skill trees to earn your first badge!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Summary */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
                  Quick Stats
                </h3>
                
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-semibold text-gray-900">{stats.completionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Study Time</span>
                      <span className="font-semibold text-gray-900">{stats.studyTime}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Level</span>
                      <span className="font-semibold text-gray-900">Level {stats.level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Skills</span>
                      <span className="font-semibold text-gray-900">{stats.totalSkills}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 text-primary-600 mr-2" />
                  Recent Activity
                </h3>
                
                <div className="space-y-3">
                  {badges.slice(0, 3).map((badge, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-900">
                          Earned {badge.skillType?.name} badge
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(badge.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {badges.length === 0 && (
                    <div className="text-center py-6">
                      <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (userProfile?.imageUrl || previewUrl) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewUrl || userProfile.imageUrl}
              alt="Profile"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;