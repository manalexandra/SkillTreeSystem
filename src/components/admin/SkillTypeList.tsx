import React from 'react';
import { Edit, Trash2, BookOpen, Star } from 'lucide-react';
import type { SkillType } from '../../types';

interface SkillTypeListProps {
  skillTypes: SkillType[];
  onEdit: (skillType: SkillType) => void;
  onDelete: (id: string) => void;
}

const SkillTypeList: React.FC<SkillTypeListProps> = ({
  skillTypes,
  onEdit,
  onDelete,
}) => {
  if (skillTypes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No skill types found</p>
        <p className="text-sm text-gray-400 mt-1">
          Create your first skill type to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white rounded-lg border border-gray-200">
      <ul className="divide-y divide-gray-200">
        {skillTypes.map((skillType) => (
          <li key={skillType.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900">{skillType.name}</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {Array.from({ length: skillType.level }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                {skillType.description && (
                  <p className="mt-1 text-gray-500">{skillType.description}</p>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  Created {new Date(skillType.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(skillType)}
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  title="Edit skill type"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(skillType.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete skill type"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SkillTypeList;