import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import type { NodeComment } from '../../types';
import { MessageSquare, Send } from 'lucide-react';

interface NodeCommentsProps {
  comments: NodeComment[];
  onAddComment: (content: string) => void;
}

const NodeComments: React.FC<NodeCommentsProps> = ({ comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const getDisplayName = (comment: NodeComment) => {
    if (!comment.user) return 'Unknown User';
    if (comment.user.firstName || comment.user.lastName) {
      return `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim();
    }
    return comment.user.email;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700 mb-6">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-medium">Comments</h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      <div className="space-y-4 mb-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <UserAvatar user={comment.user!} size="md" />
              <div>
                <div className="font-medium text-gray-900">
                  {getDisplayName(comment)}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-3 right-3 p-2 text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      )}
    </div>
  );
};

export default NodeComments;