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
  contentHtml?: string;
  contentJson?: any;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  status?: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'private' | 'team';
  version?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  orderIndex: number;
  createdAt: string;
  children?: SkillNode[];
  completed?: boolean;
  progress?: number;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt?: string;
}

export type UserRole = 'user' | 'manager' | 'admin';

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
  completedTrees: number;
  inProgressSkills: number;
  completionRate: number;
  totalBadges: number;
  studyTime: number;
  streak: number;
  level: number;
}

// Rich text editor types
export interface NodeContent {
  id: string;
  nodeId: string;
  contentHtml: string;
  contentJson?: any;
  contentText?: string;
  version: number;
  createdBy: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface NodeMetadata {
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'team';
  version: number;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface NodeTag {
  id: string;
  nodeId: string;
  tag: string;
  createdBy: string;
  createdAt: string;
}

export interface NodeLink {
  id: string;
  nodeId: string;
  title: string;
  url: string;
  description?: string;
  linkType: 'internal' | 'external';
  orderIndex: number;
  createdBy: string;
  createdAt: string;
}

export interface NodeImage {
  id: string;
  nodeId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  altText?: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
}