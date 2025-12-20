'use client';

import React from 'react';

interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

interface UserAvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showEmail?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showName = true,
  showEmail = false,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return {
          avatar: 'w-6 h-6 text-xs',
          text: 'text-xs',
          container: 'space-x-1'
        };
      case 'sm':
        return {
          avatar: 'w-8 h-8 text-sm',
          text: 'text-sm',
          container: 'space-x-2'
        };
      case 'lg':
        return {
          avatar: 'w-12 h-12 text-lg',
          text: 'text-base',
          container: 'space-x-3'
        };
      case 'xl':
        return {
          avatar: 'w-16 h-16 text-xl',
          text: 'text-lg',
          container: 'space-x-4'
        };
      default: // md
        return {
          avatar: 'w-10 h-10 text-base',
          text: 'text-sm',
          container: 'space-x-2'
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex items-center ${sizeClasses.container} ${className}`}>
      {/* Avatar */}
      <div className={`relative ${sizeClasses.avatar} rounded-full overflow-hidden flex-shrink-0`}>
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className={`w-full h-full flex items-center justify-center text-white font-medium ${getAvatarColor(user.name)} ${sizeClasses.avatar}`}
          >
            {getInitials(user.name)}
          </div>
        )}
      </div>

      {/* Text Info */}
      {(showName || showEmail) && (
        <div className="min-w-0 flex-1">
          {showName && (
            <p className={`font-medium text-gray-900 truncate ${sizeClasses.text}`}>
              {user.name}
            </p>
          )}
          {showEmail && user.email && (
            <p className={`text-gray-500 truncate ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              {user.email}
            </p>
          )}
        </div>
      )}
    </div>
  );
};