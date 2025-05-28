import { supabase } from './supabase';
import type { User, UserRole } from '../types';

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

// For the Admin Panel demo, we'll use a mock approach since we don't have admin privileges
// In a real app, you would use Supabase admin functions or a backend server


import type { SkillTree } from '../types';

// Fetch all users from Supabase (real implementation)
export const fetchAllUsers = async (): Promise<User[]> => {
  // You must have a 'users' table in your Supabase DB for this to work
  const { data, error } = await supabase.from('users').select('id, email, role');
  if (error) {
    throw new Error(error.message);
  }
  return data as User[];
};

// Fetch all skill trees from Supabaseexport const fetchAllSkillTrees = async (): Promise<SkillTree[]> => {
  const { data, error } = await supabase.from('skill_trees').select('*');
  if (error) {
    throw new Error(error.message);
  }
  return data as SkillTree[];
};

// Fetch skill trees assigned to a specific user from Supabase
export const fetchUserSkillTrees = async (userId: string): Promise<SkillTree[]> => {
  const { data, error } = await supabase.from('skill_trees').select('*').eq('assignedUserId', userId);
  if (error) {
    throw new Error(error.message);
  }
  return data as SkillTree[];
};

// Assign a tree to a user in Supabase
export const assignTreeToUser = async (treeId: string, userId: string): Promise<void> => {
  const { error } = await supabase.from('skill_trees').update({ assignedUserId: userId }).eq('id', treeId);
  if (error) {
    throw new Error(error.message);
  }
};

// Update user role in Supabase
export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const { error } = await supabase.from('users').update({ role }).eq('id', userId);
  if (error) {
    throw new Error(error.message);
  }
};

// Delete user from Supabase
export const deleteUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) {
    throw new Error(error.message);
  }
};

// Add new user to Supabase
export const addUser = async (email: string, password: string, role: UserRole): Promise<void> => {
  // This requires Supabase admin privileges or an API route
  // Example: use Supabase Auth API to sign up user, then update role in 'users' table
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  // Optionally, add to 'users' table with role
  if (data.user) {
    await supabase.from('users').insert({ id: data.user.id, email, role });
  }
};

