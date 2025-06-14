import { createClient } from '@supabase/supabase-js';
import type { User, SkillTree, SkillNode, UserProgress } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Update assigned users for a tree
export const updateTreeUsers = async (
  treeId: string,
  userIds: string[],
  assignedBy: string
): Promise<void> => {
  // Remove all current assignments for this tree
  await supabase
    .from('user_skill_trees')
    .delete()
    .eq('tree_id', treeId);

  // Insert new assignments
  if (userIds.length > 0) {
    const inserts = userIds.map(userId => ({
      user_id: userId,
      tree_id: treeId,
      assigned_by: assignedBy,
    }));
    await supabase.from('user_skill_trees').insert(inserts);
  }
};

// Fetch the number of completed trees for a user
export const getCompletedTreeCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('completed_trees')
    .select('tree_id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching completed tree count:', error);
    return 0;
  }
  return count || 0;
};

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
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('signInWithPassword timeout')), 5000)
  );
  try {
    const result = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      timeout,
    ]);
    return result;
  } catch (err) {
    console.error('[supabase.ts] signInWithPassword error:', err);
    throw err;
  }
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
export const createSkillTree = async (
  name: string, 
  createdBy: string,
  assignedUsers: string[] = []
): Promise<SkillTree | null> => {
  // Start a transaction
  const { data: tree, error: treeError } = await supabase
    .from('skill_trees')
    .insert([{ name, created_by: createdBy }])
    .select()
    .single();
  
  if (treeError || !tree) {
    console.error('Error creating skill tree:', treeError);
    return null;
  }

  // Assign users if any
  if (assignedUsers.length > 0) {
    const assignments = assignedUsers.map(userId => ({
      user_id: userId,
      tree_id: tree.id,
      assigned_by: createdBy
    }));

    const { error: assignError } = await supabase
      .from('user_skill_trees')
      .insert(assignments);

    if (assignError) {
      console.error('Error assigning users:', assignError);
      // Note: Tree is still created even if assignments fail
    }
  }
  
  return {
    id: tree.id,
    name: tree.name,
    createdBy: tree.created_by,
    createdAt: tree.created_at,
  };
};

export const getSkillTrees = async (userId?: string): Promise<SkillTree[]> => {
  let query = supabase
    .from('skill_trees')
    .select(`
      *,
      user_skill_trees!inner (
        user_id,
        assigned_at,
        assigned_by
      )
    `);

  if (userId) {
    query = query.eq('user_skill_trees.user_id', userId);
  }

  const { data, error } = await query;
  
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

export const getAllSkillNodes = async (): Promise<SkillNode[]> => {
  const { data, error } = await supabase
    .from('skill_nodes')
    .select('*')
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching all skill nodes:', error);
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
export const getUserNodeScores = async (userId: string, treeId: string): Promise<Record<string, number>> => {
  // Fetch all scores for this user
  const { data, error } = await supabase
    .from('node_progress')
    .select('node_id, score')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching node scores:', error);
    return {};
  }

  // Optionally, filter to only nodes in this tree if needed
  const scores: Record<string, number> = {};
  for (const row of data) {
    scores[row.node_id] = row.score ?? 0;
  }
  return scores;
};
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
    completedAt: data.completed_at
  };
};

export const getAllUserProgress = async (userId: string): Promise<Record<string, boolean>> => {
  const { data: progress, error } = await supabase
    .from('user_node_progress')
    .select('node_id, completed')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user progress:', error);
    return {};
  }

  // Convert to Record<string, boolean>
  const progressMap: Record<string, boolean> = {};
  progress.forEach(p => {
    progressMap[p.node_id] = p.completed;
  });

  return progressMap;
};

export const getUserProgress = async (userId: string, treeId: string): Promise<Record<string, boolean>> => {
  // First get all nodes for the tree
  const { data: nodes, error: nodesError } = await supabase
    .from('skill_nodes')
    .select('id')
    .eq('tree_id', treeId);

  if (nodesError) {
    console.error('Error fetching nodes for progress:', nodesError);
    return {};
  }

  // Then get progress for these nodes
  const { data: progress, error: progressError } = await supabase
    .from('user_node_progress')
    .select('node_id, completed')
    .eq('user_id', userId)
    .in('node_id', nodes.map(node => node.id));

  if (progressError) {
    console.error('Error fetching user progress:', progressError);
    return {};
  }

  // Convert to Record<string, boolean>
  const progressMap: Record<string, boolean> = {};
  progress.forEach(p => {
    progressMap[p.node_id] = p.completed;
  });

  // Initialize uncompleted nodes as false
  nodes.forEach(node => {
    if (!(node.id in progressMap)) {
      progressMap[node.id] = false;
    }
  });

  return progressMap;
};