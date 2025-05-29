import { supabase } from './supabase';
import type { User, UserRole, SkillTree } from '../types';

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

// Fetch all skill trees from Supabase
export const fetchAllSkillTrees = async (): Promise<SkillTree[]> => {
  const { data, error } = await supabase
    .from('skill_trees')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching skill trees:', error);
    return [];
  }
  
  return data as SkillTree[];
};

// Fetch skill trees assigned to a specific user
export const fetchUserSkillTrees = async (userId: string): Promise<SkillTree[]> => {
  const { data, error } = await supabase
    .from('skill_tree_assignments')
    .select(`
      tree_id,
      skill_trees (
        id,
        name,
        description,
        created_by,
        created_at
      )
    `)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching user skill trees:', error);
    return [];
  }
  
  return data.map(assignment => assignment.skill_trees) as SkillTree[];
};

// Assign a tree to multiple users
export const assignTreeToUsers = async (treeId: string, userIds: string[]): Promise<void> => {
  const assignments = userIds.map(userId => ({
    tree_id: treeId,
    user_id: userId
  }));
  
  const { error } = await supabase
    .from('skill_tree_assignments')
    .upsert(assignments);
    
  if (error) {
    console.error('Error assigning tree to users:', error);
    throw error;
  }
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