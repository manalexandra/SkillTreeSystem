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