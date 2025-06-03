import { supabase } from './supabase';
import type { User, UserRole, Team, TeamMember, CompletedTree, SkillType } from '../types';

// Fetch current user from session
export const getCurrentSessionUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getSession();
  if (data?.session?.user) {
    return {
      id: data.session.user.id,
      email: data.session.user.email || '',
      role: (data.session.user.user_metadata?.role as UserRole) || 'user',
    };
  }
  return null;
};

// Fetch users by IDs
export const fetchUsersByIds = async (userIds: string[]): Promise<Map<string, User>> => {
  if (!userIds.length) return new Map();

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role')
    .in('id', userIds);

  if (error) {
    console.error('Error fetching users by IDs:', error);
    return new Map();
  }

  return new Map(data.map(user => [user.id, user as User]));
};

// Fetch all users from Supabase
export const fetchAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role')
    .order('email');
    
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data as User[];
};

// Get completed trees for a user
export const getCompletedTrees = async (userId: string): Promise<CompletedTree[]> => {
  const { data, error } = await supabase
    .from('completed_trees')
    .select(`
      *,
      skill_type:skill_types (*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching completed trees:', error);
    return [];
  }

  return data.map(item => ({
    userId: item.user_id,
    treeId: item.tree_id,
    skillTypeId: item.skill_type_id,
    completedAt: item.completed_at,
    skillType: item.skill_type as SkillType
  }));
};

// Check if a tree is already completed by a user
export const isTreeCompleted = async (userId: string, treeId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('completed_trees')
    .select('tree_id')
    .eq('user_id', userId)
    .eq('tree_id', treeId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error checking if tree is completed:', error);
    return false;
  }

  return !!data;
};

// Mark a tree as completed
export const markTreeCompleted = async (userId: string, treeId: string, skillTypeId: string): Promise<boolean> => {
  // First check if the tree is already completed
  const alreadyCompleted = await isTreeCompleted(userId, treeId);
  if (alreadyCompleted) {
    return false;
  }

  const { error } = await supabase
    .from('completed_trees')
    .insert({
      user_id: userId,
      tree_id: treeId,
      skill_type_id: skillTypeId
    });

  if (error) {
    console.error('Error marking tree as completed:', error);
    return false;
  }

  return true;
};

// Check if a tree is completable
export const isTreeCompletable = async (userId: string, treeId: string): Promise<boolean> => {
  // First check if the tree is already completed
  const alreadyCompleted = await isTreeCompleted(userId, treeId);
  if (alreadyCompleted) {
    return false;
  }

  const { data, error } = await supabase
    .rpc('is_tree_completable', {
      p_user_id: userId,
      p_tree_id: treeId
    });

  if (error) {
    console.error('Error checking if tree is completable:', error);
    return false;
  }

  return data;
};

// Fetch team members
export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  try {
    // First, fetch team members
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('team_id, user_id, joined_at')
      .eq('team_id', teamId);

    if (teamMembersError) throw teamMembersError;
    if (!teamMembers || teamMembers.length === 0) return [];

    // Get unique user IDs
    const userIds = [...new Set(teamMembers.map(member => member.user_id))];

    // Fetch user details for all team members
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .in('id', userIds);

    if (usersError) throw usersError;
    if (!users) return [];

    // Create a map of user details for quick lookup
    const userMap = new Map(users.map(user => [user.id, user]));

    // Combine team member data with user details
    return teamMembers.map(member => ({
      teamId: member.team_id,
      userId: member.user_id,
      joinedAt: member.joined_at,
      user: userMap.get(member.user_id) as User
    }));
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
};

// Add members to team
export const addTeamMembers = async (teamId: string, userIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from('team_members')
    .insert(
      userIds.map(userId => ({
        team_id: teamId,
        user_id: userId
      }))
    );

  if (error) {
    console.error('Error adding team members:', error);
    throw error;
  }
};

// Remove member from team
export const removeTeamMember = async (teamId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
};

// Get available users for team (users not already in the team)
export const getAvailableTeamUsers = async (teamId: string): Promise<User[]> => {
  // First get current team members
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId);

  const existingUserIds = teamMembers?.map(member => member.user_id) || [];

  // Then get all users except those already in the team
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role')
    .not('id', 'in', `(${existingUserIds.join(',')})`);

  if (error) {
    console.error('Error fetching available users:', error);
    return [];
  }

  return users as User[];
};

// Fetch users assigned to a specific tree
export const getTreeAssignedUsers = async (treeId: string): Promise<User[]> => {
  // First get the user_ids from user_skill_trees
  const { data: assignments, error: assignmentError } = await supabase
    .from('user_skill_trees')
    .select('user_id')
    .eq('tree_id', treeId);

  if (assignmentError) {
    console.error('Error fetching tree assignments:', assignmentError);
    return [];
  }

  if (!assignments || assignments.length === 0) {
    return [];
  }

  // Then fetch the user details for those IDs
  const userIds = assignments.map(assignment => assignment.user_id);
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .in('id', userIds);

  if (usersError) {
    console.error('Error fetching assigned users:', usersError);
    return [];
  }

  return users as User[];
};

// Update user role
export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);
    
  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Add new user
export const addUser = async (email: string, password: string, role: UserRole): Promise<void> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role
        }
      }
    });

    if (error) {
      console.error('Error in signUp:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user returned from signup');
    }
  } catch (error) {
    console.error('Error in addUser:', error);
    throw error;
  }
};