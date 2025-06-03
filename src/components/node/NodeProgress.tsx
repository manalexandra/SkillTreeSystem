import React from 'react';
import { Circle } from 'lucide-react';

interface NodeProgressProps {
  progress: number;
  onUpdateProgress: (score: number) => void;
  readOnly?: boolean;
}

const NodeProgress: React.FC<NodeProgressProps> = ({
  progress,
  onUpdateProgress,
  readOnly = false,
}) => {
  const getProgressColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-gray-300';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm text-gray-500">{progress}/10</span>
      </div>
      
      <div className="flex items-center gap-1">
        {[...Array(10)].map((_, i) => (
          <button
            key={i}
            onClick={() => !readOnly && onUpdateProgress(i + 1)}
            disabled={readOnly}
            className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <Circle
              className={`h-4 w-4 ${
                i < progress ? getProgressColor(progress) : 'text-gray-200'
              } ${!readOnly && 'hover:text-primary-500'}`}
              fill={i < progress ? 'currentColor' : 'none'}
            />
          </button>
        ))}
      </div>
      
      {!readOnly && (
        <p className="text-xs text-gray-500 mt-1">
          Click to set your progress level
        </p>
      )}
    </div>
  );
};

export default NodeProgress;