'use client';

import React from 'react';
import { User } from '@/types/views';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showEmail?: boolean;
}

export default function UserAvatar({ 
  user, 
  size = 'md',
  showName = false,
  showEmail = false 
}: UserAvatarProps) {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 text-xs';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'xl':
        return 'w-16 h-16 text-xl';
      default:
        return 'w-8 h-8 text-sm';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (showName || showEmail) {
    return (
      <div className="flex items-center space-x-3">
        <div className={`${getSizeClasses(size)} ${getAvatarColor(user.name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className={`${getSizeClasses(size)} rounded-full object-cover`}
            />
          ) : (
            getInitials(user.name)
          )}
        </div>
        {(showName || showEmail) && (
          <div className="flex-1 min-w-0">
            {showName && (
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
            )}
            {showEmail && (
              <p className="text-sm text-gray-500 truncate">
                {user.email}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`${getSizeClasses(size)} ${getAvatarColor(user.name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      title={`${user.name} (${user.email})`}
    >
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={`${getSizeClasses(size)} rounded-full object-cover`}
        />
      ) : (
        getInitials(user.name)
      )}
    </div>
  );
}