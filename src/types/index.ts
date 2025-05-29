export type UserRole = 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface SkillTree {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface SkillTreeAssignment {
  treeId: string;
  userId: string;
  assignedAt: string;
}

export interface SkillNode {
  id: string;
  treeId: string;
  parentId: string | null;
  title: string;
  description: string;
  orderIndex: number;
  createdAt: string;
  children?: SkillNode[];
  completed?: boolean;
  completedAt?: string;
}

export interface UserProgress {
  userId: string;
  nodeId: string;
  completed: boolean;
  completedAt: string | null;
}