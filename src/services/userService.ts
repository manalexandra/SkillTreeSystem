import { supabase } from './supabase';
import type { User, UserRole, Team, TeamMember } from '../types';

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

// Add new user - using the working registration code
export const addUser = async (email: string, password: string, role: UserRole): Promise<void> => {
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role
      }
    }
  });

  if (signUpError) {
    console.error('Error in signUp:', signUpError);
    throw signUpError;
  }

  if (!data.user) {
    throw new Error('No user returned from signup');
  }
};