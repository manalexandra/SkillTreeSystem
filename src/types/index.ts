export type SkillTypeCategory = 'technical' | 'soft_skill' | 'leadership';

export interface SkillType {
  id: string;
  name: string;
  description?: string;
  type: SkillTypeCategory;
  createdBy: string;
  createdAt: string;
}

export interface CompletedTree {
  userId: string;
  treeId: string;
  skillTypeId: string;
  completedAt: string;
  skillType?: SkillType;
}

export interface SkillTree {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  teamId?: string;
  isCompleted?: boolean;
  skillTypeId?: string;
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
  completed?: boolean;
  progress?: number;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'manager';
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt?: string;
}

export type UserRole = 'user' | 'manager';

export interface UserProgress {
  userId: string;
  nodeId: string;
  completed: boolean;
  completedAt?: string;
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

export interface NodeComment {
  id: string;
  nodeId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: User;
}

export interface UserStats {
  totalSkills: number;
  completedSkills: number;
  inProgressSkills: number;
  completionRate: number;
  totalBadges: number;
  studyTime: number;
  streak: number;
  level: number;
}