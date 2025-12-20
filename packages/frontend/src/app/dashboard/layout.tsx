'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequireAuth, useAuth } from '@/lib/auth/context';
import PhosphorIcon from '@/components/ui/PhosphorIcon';
import MobileBottomNavigation from '@/components/ui/MobileBottomNavigation';
import MobileMenu from '@/components/ui/MobileMenu';
import CommandPalette from '@/components/ui/CommandPalette';
import SwipeGestures from '@/components/ui/SwipeGestures';
import HeaderDateTime from '@/components/ui/HeaderDateTime';
import QuickActions from '@/components/ui/QuickActions';
import TodayStats from '@/components/ui/TodayStats';
import RAGChatModal from '@/components/rag/RAGChatModal';
import { streamsNavigation } from '@/config/streamsNavigation';
import { safeLocalStorage } from '@/lib/safeStorage';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [ragChatOpen, setRagChatOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();
  const { user, isLoading } = useRequireAuth();
  const { logout } = useAuth();

  // Load and save sidebar state from/to localStorage
  useEffect(() => {
    // Mark as hydrated
    setHydrated(true);

    // Load saved state using safe storage
    const saved = safeLocalStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      try {
        setSidebarCollapsed(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse sidebar state:', e);
      }
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (hydrated) {
      safeLocalStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed, hydrated]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Cmd+B or Ctrl+B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
      // Escape to close all modals
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setMobileMenuOpen(false);
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed]);

  // Swipe gestures for mobile
  const handleSwipeRight = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(true);
    }
  };

  const handleSwipeLeft = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Update navigation current state
  const updatedNavigation = streamsNavigation.map(item => ({
    ...item,
    current: pathname === item.href || (item.href !== '/dashboard' && pathname && item.href ? pathname.startsWith(item.href) : false)
  }));

  return (
    <SwipeGestures
      onSwipeRight={handleSwipeRight}
      onSwipeLeft={handleSwipeLeft}
      className="min-h-screen bg-gray-50"
    >
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 flex z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 flex flex-col w-64 z-50 md:hidden transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col min-h-0 bg-white shadow-lg">
          <div className="flex-1 overflow-y-auto">
            <nav className="px-2 py-4 space-y-1">
              {updatedNavigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div className="space-y-1">
                      <div className="flex items-center px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {typeof item.icon === 'string' ? (
                          <span className="mr-2">{item.icon}</span>
                        ) : (
                          <PhosphorIcon 
                            icon={item.icon} 
                            weight={item.iconWeight || 'regular'} 
                            size={16} 
                            className="mr-2" 
                          />
                        )}
                        {item.name}
                      </div>
                      {item.children.map((child) => {
                        const isExternal = (child as any).external;
                        const linkClassName = `group flex items-center pl-8 pr-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          pathname === child.href || pathname.startsWith(child.href + '/')
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`;
                        
                        const linkContent = (
                          <>
                            {typeof child.icon === 'string' ? (
                              <span className="mr-2 text-base">{child.icon}</span>
                            ) : (
                              <PhosphorIcon 
                                icon={child.icon} 
                                weight={(child as any).iconWeight || 'regular'} 
                                size={16} 
                                className="mr-2" 
                              />
                            )}
                            {child.name}
                          </>
                        );

                        if (isExternal) {
                          return (
                            <a
                              key={child.name}
                              href={child.href || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={linkClassName}
                              onClick={() => setSidebarOpen(false)}
                            >
                              {linkContent}
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={child.name}
                            href={child.href || '#'}
                            className={linkClassName}
                            onClick={() => setSidebarOpen(false)}
                          >
                            {linkContent}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.current
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {typeof item.icon === 'string' ? (
                        <span className="mr-3 text-lg">{item.icon}</span>
                      ) : (
                        <PhosphorIcon 
                          icon={item.icon} 
                          weight={item.iconWeight || 'regular'} 
                          size={18} 
                          className="mr-3" 
                        />
                      )}
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div 
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:w-16' : 'md:w-64'
        }`}
        suppressHydrationWarning>
        <div className="flex flex-col min-h-0 bg-white shadow-lg">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200 relative">
            {!sidebarCollapsed && (
              <Link href="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">STREAMS</span>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link href="/dashboard" className="flex items-center justify-center w-full">
                <span className="text-xl font-bold text-primary-600">S</span>
              </Link>
            )}
            {/* Collapse button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-1 shadow-sm hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-900"
              title={sidebarCollapsed ? "Rozwiń menu (⌘B)" : "Zwiń menu (⌘B)"}
            >
              <svg className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className={`flex-1 px-2 py-4 space-y-1 ${sidebarCollapsed ? 'px-1' : ''}`}>
              {updatedNavigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div className="space-y-1">
                      {!sidebarCollapsed && (
                        <div className="flex items-center px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {typeof item.icon === 'string' ? (
                            <span className="mr-2">{item.icon}</span>
                          ) : (
                            <PhosphorIcon 
                              icon={item.icon} 
                              weight={item.iconWeight || 'regular'} 
                              size={16} 
                              className="mr-2" 
                            />
                          )}
                          {item.name}
                        </div>
                      )}
                      {sidebarCollapsed && (
                        <div className="flex items-center justify-center py-2 border-b border-gray-200" title={item.name}>
                          {typeof item.icon === 'string' ? (
                            <span className="text-lg">{item.icon}</span>
                          ) : (
                            <PhosphorIcon 
                              icon={item.icon} 
                              weight={item.iconWeight || 'regular'} 
                              size={20} 
                              className="text-gray-500"
                            />
                          )}
                        </div>
                      )}
                      {!sidebarCollapsed && item.children.map((child) => {
                        const isExternal = (child as any).external;
                        const linkClassName = `group flex items-center pl-8 pr-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          pathname === child.href || pathname.startsWith(child.href + '/')
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`;
                        
                        const linkContent = (
                          <>
                            {typeof child.icon === 'string' ? (
                              <span className="mr-2 text-base">{child.icon}</span>
                            ) : (
                              <PhosphorIcon 
                                icon={child.icon} 
                                weight={(child as any).iconWeight || 'regular'} 
                                size={16} 
                                className="mr-2" 
                              />
                            )}
                            {child.name}
                          </>
                        );

                        if (isExternal) {
                          return (
                            <a
                              key={child.name}
                              href={child.href || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={linkClassName}
                            >
                              {linkContent}
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={child.name}
                            href={child.href || '#'}
                            className={linkClassName}
                          >
                            {linkContent}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-2 py-2'} text-sm font-medium rounded-md transition-colors ${
                        item.current
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      {typeof item.icon === 'string' ? (
                        <span className={`${sidebarCollapsed ? 'text-xl' : 'mr-3 text-lg'}`}>{item.icon}</span>
                      ) : (
                        <PhosphorIcon 
                          icon={item.icon} 
                          weight={item.iconWeight || 'regular'} 
                          size={sidebarCollapsed ? 20 : 18} 
                          className={sidebarCollapsed ? '' : 'mr-3'} 
                        />
                      )}
                      {!sidebarCollapsed && item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* User menu */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              {sidebarCollapsed ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.firstName?.charAt(0) || user.email.charAt(0)}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="clickable p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Wyloguj się"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.firstName?.charAt(0) || user.email.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="clickable ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Wyloguj się"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div 
        className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
        }`}
        suppressHydrationWarning>
        {/* Compact single-line header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-2 flex items-center justify-between">
            {/* Left: Menu controls + Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="clickable p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md md:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:block clickable p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title={sidebarCollapsed ? "Rozwiń menu (⌘B)" : "Zwiń menu (⌘B)"}
              >
                <svg className={`w-5 h-5 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {/* Quick Actions */}
              <div className="hidden sm:block border-l border-gray-200 pl-3">
                <QuickActions />
              </div>
            </div>

            {/* Center: Enhanced header with date/time */}
            <div className="hidden lg:flex flex-1 justify-center">
              <HeaderDateTime />
            </div>

            {/* Right: Today Stats + controls */}
            <div className="flex items-center space-x-3">
              {/* Today Stats */}
              <div className="hidden md:block">
                <TodayStats />
              </div>
              <div className="flex items-center space-x-2 border-l border-gray-200 pl-3">
                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="clickable p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  title="Otwórz paletę poleceń (⌘K)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  onClick={logout}
                  className="clickable p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  title="Wyloguj się"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-6">
          <div className="py-6">
            <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation onMenuOpen={() => setMobileMenuOpen(true)} />

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      {/* Desktop Command Palette Button - Fixed position */}
      <div className="hidden md:block">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="clickable fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 z-40"
          title="Otwórz paletę poleceń (⌘K)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* RAG Chat Button - Fixed position */}
      <button
        onClick={() => setRagChatOpen(true)}
        className="clickable fixed bottom-6 right-20 md:right-20 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 z-40"
        title="Otwórz RAG Chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* RAG Chat Modal */}
      <RAGChatModal isOpen={ragChatOpen} onClose={() => setRagChatOpen(false)} />
    </SwipeGestures>
  );
}