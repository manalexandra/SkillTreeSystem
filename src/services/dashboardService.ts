import { supabase } from './supabase';

// Fetch total users (from custom users table)
export const fetchUserCount = async (): Promise<number> => {
  const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
  if (error) {
    throw new Error(error.message);
  }
  return count || 0;
};

// Fetch total skill trees
export const fetchSkillTreeCount = async (): Promise<number> => {
  const { count, error } = await supabase.from('skill_trees').select('*', { count: 'exact', head: true });
  if (error) {
    throw new Error(error.message);
  }
  return count || 0;
};
