import React from 'react';
import { User } from '../../types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '',
  showTooltip = false 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
    xl: 'h-12 w-12 text-lg'
  };

  const getInitials = () => {
    if (user.firstName || user.lastName) {
      const first = user.firstName?.charAt(0) || '';
      const last = user.lastName?.charAt(0) || '';
      return (first + last).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  const avatar = user.imageUrl ? (
    <img
      src={user.imageUrl}
      alt={getDisplayName()}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
    />
  ) : (
    <div className={`${sizeClasses[size]} rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium ${className}`}>
      {getInitials()}
    </div>
  );

  if (showTooltip) {
    return (
      <div className="relative group">
        {avatar}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {getDisplayName()}
        </div>
      </div>
    );
  }

  return avatar;
};

export default UserAvatar;