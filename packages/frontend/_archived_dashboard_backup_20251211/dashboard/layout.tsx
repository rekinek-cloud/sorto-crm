'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRequireAuth, useAuth } from '@/lib/auth/context';
import MobileBottomNavigation from '@/components/ui/MobileBottomNavigation';
import MobileMenu from '@/components/ui/MobileMenu';
import CommandPalette from '@/components/ui/CommandPalette';
import SwipeGestures from '@/components/ui/SwipeGestures';
import { streamsNavigation, urlRedirects, NavItem } from '@/config/streamsNavigation';
import { MagnifyingGlass, SignOut, List, Waves } from 'phosphor-react';
import { HelpProvider } from '@/contexts/help/HelpContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useRequireAuth();
  const { logout } = useAuth();

  // URL Redirects - obsługa starych URL (GTD/SMART)
  useEffect(() => {
    if (pathname && urlRedirects[pathname]) {
      router.replace(urlRedirects[pathname]);
    }
  }, [pathname, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
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
  }, []);

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

  // Toggle section expansion
  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  // Check if nav item is active
  const isItemActive = (item: NavItem): boolean => {
    if (!pathname) return false;
    if (item.href === '/crm/dashboard') {
      return pathname === item.href;
    }
    if (item.href) {
      return pathname === item.href || pathname.startsWith(item.href + '/');
    }
    if (item.children) {
      return item.children.some(child =>
        child.href && (pathname === child.href || pathname.startsWith(child.href + '/'))
      );
    }
    return false;
  };

  // Auto-expand sections with active children
  useEffect(() => {
    streamsNavigation.forEach(item => {
      if (item.children && isItemActive(item)) {
        setExpandedSections(prev => new Set(prev).add(item.name));
      }
    });
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Waves size={48} weight="duotone" className="text-primary-600 animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Render navigation item
  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const isExpanded = expandedSections.has(item.name);

    if (item.children) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleSection(item.name)}
            className={`w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center">
              <Icon
                size={20}
                weight={item.iconWeight || 'duotone'}
                className={`mr-3 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}`}
              />
              {item.name}
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const childActive = child.href && pathname &&
                  (pathname === child.href || pathname.startsWith(child.href + '/'));
                return (
                  <Link
                    key={child.name}
                    href={child.href || '#'}
                    className={`group flex items-center pl-4 pr-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      childActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                  >
                    <ChildIcon
                      size={16}
                      weight={child.iconWeight || 'duotone'}
                      className={`mr-2 flex-shrink-0 ${childActive ? 'text-primary-600' : 'text-gray-400'}`}
                    />
                    {child.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href || '#'}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        onClick={isMobile ? () => setSidebarOpen(false) : undefined}
      >
        <Icon
          size={20}
          weight={item.iconWeight || 'duotone'}
          className={`mr-3 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}`}
        />
        {item.name}
        {item.badge && (
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {item.badge === 'count' ? '...' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <HelpProvider>
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 flex flex-col w-72 z-50 md:hidden transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col min-h-0 bg-white shadow-xl rounded-r-2xl">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-100">
            <Link href="/crm/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <Waves size={28} weight="duotone" className="text-primary-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                STREAMS
              </span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="px-3 py-4 space-y-1">
              {streamsNavigation.map((item) => renderNavItem(item, true))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col min-h-0 bg-white shadow-lg border-r border-gray-100">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-100">
            <Link href="/crm/dashboard" className="flex items-center gap-2">
              <Waves size={28} weight="duotone" className="text-primary-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                STREAMS
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-3 py-4 space-y-1">
              {streamsNavigation.map((item) => renderNavItem(item, false))}
            </nav>

            {/* User menu */}
            <div className="flex-shrink-0 border-t border-gray-100 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm font-semibold">
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
                  className="clickable ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Wyloguj"
                >
                  <SignOut size={18} weight="duotone" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar for mobile */}
        <div className="md:hidden bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="clickable p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <List size={24} weight="bold" />
            </button>
            <Link href="/crm/dashboard" className="flex items-center gap-2">
              <Waves size={24} weight="duotone" className="text-primary-600" />
              <span className="text-lg font-bold text-primary-600">STREAMS</span>
            </Link>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="clickable p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Szukaj (⌘K)"
              >
                <MagnifyingGlass size={20} weight="bold" />
              </button>
              <button
                onClick={logout}
                className="clickable p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Wyloguj"
              >
                <SignOut size={20} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-6">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
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
          className="clickable fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white p-3.5 rounded-2xl shadow-lg shadow-primary-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 z-40"
          title="Szukaj (⌘K)"
        >
          <MagnifyingGlass size={22} weight="bold" />
        </button>
      </div>
    </SwipeGestures>
    </HelpProvider>
  );
}
