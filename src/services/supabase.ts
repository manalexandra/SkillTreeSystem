import { createClient } from '@supabase/supabase-js';
import type { User, SkillTree, SkillNode, UserProgress } from '../types';

// Initialize Supabase client
// Replace these with your actual Supabase URL and anon key
const supabaseUrl = "https://jdipoqxnmhfyiqycglnt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaXBvcXhubWhmeWlxeWNnbG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzc0MjEsImV4cCI6MjA2Mzk1MzQyMX0.HdDT9aT_FEmsYhZsluLtCn-Cm4qLOJEWm2t1KgZQy2M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signUp = async (email: string, password: string, role: 'manager' | 'user' = 'user') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      },
    },
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  if (data && data.user) {
    return {
      id: data.user.id,
      email: data.user.email || '',
      role: (data.user.user_metadata.role as 'manager' | 'user') || 'user',
    };
  }
  return null;
};

// Skill Tree functions
export const createSkillTree = async (name: string, userId: string): Promise<SkillTree | null> => {
  const { data, error } = await supabase
    .from('skill_trees')
    .insert([{ name, created_by: userId }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating skill tree:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
};

export const getSkillTrees = async (): Promise<SkillTree[]> => {
  const { data, error } = await supabase
    .from('skill_trees')
    .select('*');
  
  if (error) {
    console.error('Error fetching skill trees:', error);
    return [];
  }
  
  return data.map((tree) => ({
    id: tree.id,
    name: tree.name,
    createdBy: tree.created_by,
    createdAt: tree.created_at,
  }));
};

export const getSkillTree = async (treeId: string): Promise<SkillTree | null> => {
  const { data, error } = await supabase
    .from('skill_trees')
    .select('*')
    .eq('id', treeId)
    .single();
  
  if (error) {
    console.error('Error fetching skill tree:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
};

// Skill Node functions
export const createSkillNode = async (
  node: Omit<SkillNode, 'id' | 'createdAt'>
): Promise<SkillNode | null> => {
  const { data, error } = await supabase
    .from('skill_nodes')
    .insert([{
      tree_id: node.treeId,
      parent_id: node.parentId,
      title: node.title,
      description: node.description,
      order_index: node.orderIndex,
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating skill node:', error);
    return null;
  }
  
  return {
    id: data.id,
    treeId: data.tree_id,
    parentId: data.parent_id,
    title: data.title,
    description: data.description,
    orderIndex: data.order_index,
    createdAt: data.created_at,
  };
};

export const getSkillNodes = async (treeId: string): Promise<SkillNode[]> => {
  const { data, error } = await supabase
    .from('skill_nodes')
    .select('*')
    .eq('tree_id', treeId);
  
  if (error) {
    console.error('Error fetching skill nodes:', error);
    return [];
  }
  
  return data.map((node) => ({
    id: node.id,
    treeId: node.tree_id,
    parentId: node.parent_id,
    title: node.title,
    description: node.description,
    orderIndex: node.order_index,
    createdAt: node.created_at,
  }));
};

export const updateSkillNode = async (
  node: Partial<SkillNode> & { id: string }
): Promise<SkillNode | null> => {
  const updateData: Partial<SkillNode> = {};
  
  if (node.title) updateData.title = node.title;
  if (node.description) updateData.description = node.description;
  if (node.parentId !== undefined) updateData.parentId = node.parentId;
  if (node.orderIndex !== undefined) updateData.orderIndex = node.orderIndex;
  
  const { data, error } = await supabase
    .from('skill_nodes')
    .update(updateData)
    .eq('id', node.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating skill node:', error);
    return null;
  }
  
  return {
    id: data.id,
    treeId: data.tree_id,
    parentId: data.parent_id,
    title: data.title,
    description: data.description,
    orderIndex: data.order_index,
    createdAt: data.created_at,
  };
};

export const deleteSkillNode = async (nodeId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('skill_nodes')
    .delete()
    .eq('id', nodeId);
  
  if (error) {
    console.error('Error deleting skill node:', error);
    return false;
  }
  
  return true;
};

// User Progress functions
export const updateUserProgress = async (
  userId: string,
  nodeId: string,
  completed: boolean
): Promise<UserProgress | null> => {
  const now = completed ? new Date().toISOString() : null;
  
  const { data, error } = await supabase
    .from('user_node_progress')
    .upsert(
      { 
        user_id: userId,
        node_id: nodeId,
        completed,
        completed_at: now,
      },
      { onConflict: 'user_id,node_id' }
    )
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user progress:', error);
    return null;
  }
  
  return {
    userId: data.user_id,
    nodeId: data.node_id,
    completed: data.completed,
    completedAt: data.completed_at,
  };
};

export const getUserProgress = async (userId: string, treeId: string): Promise<Record<string, boolean>> => {
  // Step 1: Get the node IDs for the tree
  const { data: nodeData, error: nodeError } = await supabase
    .from('skill_nodes')
    .select('id')
    .eq('tree_id', treeId);

  if (nodeError) {
    console.error('Error fetching skill nodes:', nodeError);
    return {};
  }

  const nodeIds = nodeData?.map((node) => node.id) || [];

  // Step 2: Get the user progress for those node IDs
  const { data, error } = await supabase
    .from('user_node_progress')
    .select('node_id, completed')
    .eq('user_id', userId)
    .in('node_id', nodeIds);

  if (error) {
    console.error('Error fetching user progress:', error);
    return {};
  }

  const progressMap: Record<string, boolean> = {};
  data.forEach((item) => {
    progressMap[item.node_id] = item.completed;
  });

  return progressMap;
};