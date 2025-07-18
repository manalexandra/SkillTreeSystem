import { create } from 'zustand';
import { 
  getSkillTrees, 
  getSkillNodes, 
  getUserProgress, 
  getCompletedTreeCount,
  getUserNodeScores,
  createSkillTree,
  createSkillNode,
  updateSkillNode,
  deleteSkillNode,
  updateUserProgress,
  getInProgressSkillTrees,
  supabase
} from '../services/supabase';
import type { SkillTree, SkillNode } from '../types';

interface CreateTreeData {
  name: string;
  description?: string;
  createdBy: string;
  assignedUsers?: string[];
  teamId?: string;
}

interface SkillTreeState {
  trees: SkillTree[];
  currentTree: SkillTree | null;
  nodes: SkillNode[];
  nodeMap: Record<string, SkillNode>;
  userProgress: Record<string, number>;
  inProgressTrees: SkillTree[]; // <-- New state
  loading: boolean;
  error: string | null;

  // Skill mastered
  completedTreeCount: number;
  fetchCompletedTreeCount: (userId: string) => Promise<void>;
  
  // Actions
  fetchTrees: (user: { id: string; role: string } | null) => Promise<void>;
  fetchTreeData: (treeId: string, userId: string) => Promise<void>;
  fetchInProgressTrees: (userId: string) => Promise<void>; // <-- New action
  createNewTree: (data: CreateTreeData) => Promise<SkillTree | null>;
  updateTree: (tree: SkillTree) => Promise<void>;
  deleteTree: (treeId: string) => Promise<void>;
  addNode: (node: Omit<SkillNode, 'id' | 'createdAt'>) => Promise<SkillNode | null>;
  updateNode: (node: Partial<SkillNode> & { id: string }) => Promise<SkillNode | null>;
  removeNode: (nodeId: string) => Promise<boolean>;
  markNodeCompleted: (userId: string, nodeId: string, completed: boolean) => Promise<void>;
  
  // Helpers
  getNodeChildren: (parentId: string | null) => SkillNode[];
  buildTreeStructure: () => SkillNode[];
}

export const useSkillTreeStore = create<SkillTreeState>((set, get) => ({
  trees: [],
  currentTree: null,
  nodes: [],
  nodeMap: {},
  userProgress: {},
  inProgressTrees: [], // <-- New state
  loading: false,
  error: null,
  completedTreeCount: 0,
  
  fetchCompletedTreeCount: async (userId) => {
    set({ loading: true, error: null });
    try {
      const count = await getCompletedTreeCount(userId);
      set({ completedTreeCount: count, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch completed tree count', loading: false });
      console.error(error);
    }
  },

  fetchTrees: async (user) => {
    set({ loading: true, error: null });
    try {
      let trees;
      if (user && user.role === 'manager') {
        trees = await getSkillTrees(); // admin: all trees
      } else if (user) {
        trees = await getSkillTrees(user.id); // regular: assigned trees
      } else {
        trees = [];
      }
      set({ trees, loading: false });
    } catch (error) {
      set({ 
        error: 'Failed to fetch skill trees', 
        loading: false 
      });
      console.error(error);
    }
  },
  
  fetchTreeData: async (treeId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      const trees = get().trees;
      const currentTree = trees.find(t => t.id === treeId) || null;
      
      // If we don't have the tree in memory yet, refresh trees
      if (!currentTree) {
        const updatedTrees = await getSkillTrees();
        set({ trees: updatedTrees });
        const foundTree = updatedTrees.find(t => t.id === treeId) || null;
        set({ currentTree: foundTree });
      } else {
        set({ currentTree });
      }
      
      // Get nodes for this tree
      const nodes = await getSkillNodes(treeId);
      
      // Create a map for quick node lookup
      const nodeMap: Record<string, SkillNode> = {};
      nodes.forEach(node => {
        nodeMap[node.id] = node;
      });
      
      // Get user progress (score per node)
      const progress = await getUserNodeScores(userId, treeId);
      
      set({ 
        nodes, 
        nodeMap, 
        userProgress: progress, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: 'Failed to fetch tree data', 
        loading: false 
      });
      console.error(error);
    }
  },
  
  createNewTree: async (data: CreateTreeData) => {
    set({ loading: true, error: null });
    try {
      const newTree = await createSkillTree(
        data.name,
        data.createdBy,
        data.assignedUsers
      );
      
      if (newTree) {
        set((state) => ({
          trees: [...state.trees, newTree],
          loading: false
        }));
      }
      return newTree;
    } catch (error) {
      set({
        error: 'Failed to create skill tree',
        loading: false
      });
      console.error(error);
      return null;
    }
  },

  updateTree: async (tree: SkillTree) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('skill_trees')
        .update({
          name: tree.name,
          description: tree.description
        })
        .eq('id', tree.id);

      if (error) throw error;

      set(state => ({
        trees: state.trees.map(t => t.id === tree.id ? tree : t),
        currentTree: state.currentTree?.id === tree.id ? tree : state.currentTree,
        loading: false
      }));
    } catch (error) {
      set({
        error: 'Failed to update skill tree',
        loading: false
      });
      console.error(error);
      throw error;
    }
  },

  deleteTree: async (treeId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('skill_trees')
        .delete()
        .eq('id', treeId);

      if (error) throw error;

      set(state => ({
        trees: state.trees.filter(t => t.id !== treeId),
        currentTree: state.currentTree?.id === treeId ? null : state.currentTree,
        loading: false
      }));
    } catch (error) {
      set({
        error: 'Failed to delete skill tree',
        loading: false
      });
      console.error(error);
      throw error;
    }
  },
  
  addNode: async (node) => {
    set({ loading: true, error: null });
    try {
      const newNode = await createSkillNode(node);
      if (newNode) {
        set(state => {
          const updatedNodes = [...state.nodes, newNode];
          const updatedNodeMap = { ...state.nodeMap };
          updatedNodeMap[newNode.id] = newNode;
          
          return {
            nodes: updatedNodes,
            nodeMap: updatedNodeMap,
            loading: false
          };
        });
      }
      return newNode;
    } catch (error) {
      set({ 
        error: 'Failed to add node', 
        loading: false 
      });
      console.error(error);
      return null;
    }
  },
  
  updateNode: async (node) => {
    set({ loading: true, error: null });
    try {
      const updatedNode = await updateSkillNode(node);
      if (updatedNode) {
        set(state => {
          const updatedNodes = state.nodes.map(n => 
            n.id === updatedNode.id ? updatedNode : n
          );
          const updatedNodeMap = { ...state.nodeMap };
          updatedNodeMap[updatedNode.id] = updatedNode;
          
          return {
            nodes: updatedNodes,
            nodeMap: updatedNodeMap,
            loading: false
          };
        });
      }
      return updatedNode;
    } catch (error) {
      set({ 
        error: 'Failed to update node', 
        loading: false 
      });
      console.error(error);
      return null;
    }
  },
  
  removeNode: async (nodeId: string) => {
    set({ loading: true, error: null });
    try {
      const success = await deleteSkillNode(nodeId);
      if (success) {
        set(state => {
          const updatedNodes = state.nodes.filter(n => n.id !== nodeId);
          const updatedNodeMap = { ...state.nodeMap };
          delete updatedNodeMap[nodeId];
          
          return {
            nodes: updatedNodes,
            nodeMap: updatedNodeMap,
            loading: false
          };
        });
      }
      return success;
    } catch (error) {
      set({ 
        error: 'Failed to remove node', 
        loading: false 
      });
      console.error(error);
      return false;
    }
  },

  // Fetch in-progress trees for a user
  fetchInProgressTrees: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const trees = await getInProgressSkillTrees(userId);
      set({ inProgressTrees: trees, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch in-progress trees', loading: false });
      console.error(error);
    }
  },
  
  markNodeCompleted: async (userId: string, nodeId: string, completed: boolean) => {
    set({ loading: true, error: null });
    try {
      await updateUserProgress(userId, nodeId, completed);
      
      set(state => {
        const updatedProgress = { ...state.userProgress };
        updatedProgress[nodeId] = completed;
        
        return {
          userProgress: updatedProgress,
          loading: false
        };
      });
    } catch (error) {
      set({ 
        error: 'Failed to update progress', 
        loading: false 
      });
      console.error(error);
    }
  },
  
  getNodeChildren: (parentId) => {
    return get().nodes.filter(node => node.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  },
  
  buildTreeStructure: () => {
    const rootNodes = get().getNodeChildren(null);
    
    // Recursive function to build tree
    const buildTree = (nodes: SkillNode[]): SkillNode[] => {
      return nodes.map(node => {
        const children = get().getNodeChildren(node.id);
        return {
          ...node,
          children: buildTree(children),
          completed: get().userProgress[node.id] || false,
        };
      });
    };
    
    return buildTree(rootNodes);
  }
}));