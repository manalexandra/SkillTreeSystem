export type UserRole = 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  joinedAt: string;
  user?: User;
}

export interface SkillType {
  id: string;
  name: string;
  description?: string;
  level: number;
  createdBy: string;
  createdAt: string;
}

export interface SkillTree {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  teamId?: string;
}

export interface SkillTreeAssignment {
  treeId: string;
  userId: string;
  assignedAt: string;
  assignedBy: string;
}

export interface SkillNode {
  id: string;
  treeId: string;
  parentId: string | null;
  title: string;
  description: string;
  descriptionHtml?: string;
  orderIndex: number;
  createdAt: string;
  children?: SkillNode[];
  progress?: number;
  completed?: boolean;
  completedAt?: string;
}

export interface NodeProgress {
  userId: string;
  nodeId: string;
  score: number;
  updatedAt: string;
}

export interface NodeComment {
  id: string;
  nodeId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'tree_assigned' | 'node_comment';
  content: string;
  read: boolean;
  createdAt: string;
  relatedTreeId?: string;
  relatedNodeId?: string;
}

export interface UserProgress {
  userId: string;
  nodeId: string;
  completed: boolean;
  completedAt: string | null;
}