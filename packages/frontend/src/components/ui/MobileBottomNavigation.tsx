'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { mobileNavigation } from '@/config/streamsNavigation';
import { DotsThree } from 'phosphor-react';

interface MobileBottomNavigationProps {
  onMenuOpen: () => void;
}

export default function MobileBottomNavigation({ onMenuOpen }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const [sourceCount, setSourceCount] = useState(0);

  // Mock badge counts - replace with real data
  useEffect(() => {
    setSourceCount(12);
  }, []);

  const getBadgeCount = (href?: string) => {
    if (href === '/dashboard/source') return sourceCount;
    return 0;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Bottom Navigation */}
      <nav className="bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {mobileNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && item.href !== '#' && pathname?.startsWith(item.href || ''));
            const badgeCount = getBadgeCount(item.href);
            const isMenu = item.href === '#';

            if (isMenu) {
              return (
                <button
                  key={item.name}
                  onClick={onMenuOpen}
                  className="flex flex-col items-center justify-center space-y-1 text-xs group transition-colors duration-200"
                >
                  <div className="relative flex items-center justify-center w-7 h-7">
                    <DotsThree
                      size={24}
                      weight="bold"
                      className="text-gray-500 group-active:text-primary-600 group-active:scale-90 transition-all duration-150"
                    />
                  </div>
                  <span className="text-gray-500 group-active:text-primary-600 font-medium">
                    {item.name}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href || '#'}
                className={`flex flex-col items-center justify-center space-y-1 text-xs group transition-colors duration-200 ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`}
              >
                <div className="relative flex items-center justify-center w-7 h-7">
                  <Icon
                    size={24}
                    weight={isActive ? 'fill' : (item.iconWeight || 'duotone')}
                    className={`group-active:scale-90 transition-all duration-150 ${
                      isActive ? 'text-primary-600 scale-110' : 'text-gray-500'
                    }`}
                  />
                  {badgeCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </div>
                  )}
                </div>
                <span className={`font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
