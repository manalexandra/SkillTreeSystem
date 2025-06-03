import React from 'react';
import { Trophy } from 'lucide-react';
import type { SkillType } from '../../types';

interface SkillBadgeProps {
  skillType: SkillType;
  completedAt: string;
  size?: 'sm' | 'md' | 'lg';
}

const SkillBadge: React.FC<SkillBadgeProps> = ({ skillType, completedAt, size = 'md' }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          border: 'border-blue-200'
        };
      case 'soft_skill':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: 'text-green-600',
          border: 'border-green-200'
        };
      case 'leadership':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: 'text-purple-600',
          border: 'border-purple-200'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          border: 'border-gray-200'
        };
    }
  };

  const sizeClasses = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 'h-3 w-3',
    },
    md: {
      badge: 'px-3 py-1.5 text-sm',
      icon: 'h-4 w-4',
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
    },
  };

  const colors = getTypeColor(skillType.type);

  return (
    <div 
      className={`
        inline-flex items-center gap-2 rounded-full border ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size].badge}
      `}
      title={`Completed on ${new Date(completedAt).toLocaleDateString()}`}
    >
      <Trophy className={`${sizeClasses[size].icon} ${colors.icon}`} />
      <span className="font-medium">{skillType.name}</span>
    </div>
  );
};

export default SkillBadge;