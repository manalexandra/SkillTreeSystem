export type UserRole = 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface SkillTree {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  assignedUserId?: string; // User to whom this tree is assigned
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