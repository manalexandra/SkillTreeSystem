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
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      team_id,
      user_id,
      joined_at,
      users:user_id (
        id,
        email,
        role
      )
    `)
    .eq('team_id', teamId);

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  return data.map(member => ({
    teamId: member.team_id,
    userId: member.user_id,
    joinedAt: member.joined_at,
    user: member.users as User
  }));
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
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role }
    }
  });
  
  if (signUpError) {
    console.error('Error creating user:', signUpError);
    throw signUpError;
  }
  
  if (data.user) {
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        role
      });
      
    if (userError) {
      console.error('Error adding user to users table:', userError);
      throw userError;
    }
  }
};