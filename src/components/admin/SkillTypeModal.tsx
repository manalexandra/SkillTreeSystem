import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { SkillType, SkillTypeCategory } from '../../types';

interface SkillTypeModalProps {
  skillType?: SkillType;
  onClose: () => void;
  onSave: (skillType: Partial<SkillType>) => void;
  isLoading?: boolean;
}

const SKILL_TYPE_CATEGORIES: SkillTypeCategory[] = ['technical', 'soft_skill', 'leadership'];

export default function SkillTypeModal({
  skillType,
  onClose,
  onSave,
  isLoading = false,
}: SkillTypeModalProps) {
  const [name, setName] = useState(skillType?.name || '');
  const [description, setDescription] = useState(skillType?.description || '');
  const [type, setType] = useState<SkillTypeCategory>(skillType?.type || 'technical');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: skillType?.id,
      name,
      description,
      type,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              {skillType ? 'Edit Skill Type' : 'Add Skill Type'}
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as SkillTypeCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {SKILL_TYPE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}