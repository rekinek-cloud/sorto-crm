'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { flashNewsApi, FlashNewsItem } from '@/lib/api/flashNews';
import { safeLocalStorage } from '@/lib/safeStorage';

export default function FlashNews() {
  const [newsItems, setNewsItems] = useState<FlashNewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [readItems, setReadItems] = useState<string[]>([]);

  // Mock data for development - to be replaced with API call
  const mockNews: FlashNewsItem[] = [
    {
      id: '1',
      content: '🚀 Nowa wersja STREAMS dostępna! Sprawdź zaktualizowane funkcje.',
      type: 'info',
      priority: 'medium',
      source: 'ai_rule',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      content: '⚡ System AI wykrył 3 pilne zadania wymagające uwagi.',
      type: 'warning',
      priority: 'high',
      source: 'automation',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      content: '📊 Weekly Review za 2 dni - przygotuj podsumowanie projektów.',
      type: 'info',
      priority: 'medium',
      source: 'automation',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      content: '✅ Wszystkie zadania na dziś zostały ukończone! Gratulacje!',
      type: 'success',
      priority: 'low',
      source: 'ai_rule',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];

  // Load read items from localStorage on mount
  useEffect(() => {
    const savedReadItems = safeLocalStorage.getItem('flashNewsReadItems');
    const parsedReadItems = savedReadItems ? JSON.parse(savedReadItems) : [];
    setReadItems(parsedReadItems);
  }, []);

  // Load flash news when readItems are initialized
  useEffect(() => {
    loadFlashNews();
  }, []);

  // Auto-rotate news every 5 seconds
  useEffect(() => {
    if (newsItems.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [newsItems.length]);

  const loadFlashNews = async () => {
    try {
      setIsLoading(true);
      const savedReadItems = safeLocalStorage.getItem('flashNewsReadItems');
      const currentReadItems = savedReadItems ? JSON.parse(savedReadItems) : [];

      const data = await flashNewsApi.getFlashNews();
      // Filter out read items
      const unreadItems = (data.items || []).filter(item => !currentReadItems.includes(item.id));
      setNewsItems(unreadItems);
      setCurrentIndex(0); // Reset to first item
    } catch (error: any) {
      console.error('Failed to load flash news:', error);
      // Fallback to mock data on error - also filter read items
      const savedReadItems = safeLocalStorage.getItem('flashNewsReadItems');
      const currentReadItems = savedReadItems ? JSON.parse(savedReadItems) : [];
      const unreadMockNews = mockNews.filter(item => !currentReadItems.includes(item.id));
      setNewsItems(unreadMockNews);
      if (unreadMockNews.length > 0) {
        toast.error('Nie udało się załadować aktualności - używam danych testowych');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeStyles = (type: FlashNewsItem['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'warning':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: FlashNewsItem['priority']) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '📢';
    }
  };

  const markAsRead = (itemId: string) => {
    const newReadItems = [...readItems, itemId];
    setReadItems(newReadItems);
    safeLocalStorage.setItem('flashNewsReadItems', JSON.stringify(newReadItems));
    
    // Remove the read item from the list
    const updatedItems = newsItems.filter(item => item.id !== itemId);
    setNewsItems(updatedItems);
    
    // Adjust current index if necessary
    if (updatedItems.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= updatedItems.length) {
      setCurrentIndex(0);
    }
  };

  if (!isVisible || newsItems.length === 0) {
    return null;
  }

  const currentNews = newsItems[currentIndex];

  return (
    <div className="flex items-center">
      {isVisible ? (
        <div className="flex items-center space-x-2 text-sm">
          {/* Compact news content */}
          <span className="text-xs">{getPriorityIcon(currentNews.priority)}</span>
          <span className="text-gray-600 truncate max-w-md">{currentNews.content}</span>
          
          {/* Subtle controls */}
          {newsItems.length > 1 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + newsItems.length) % newsItems.length)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                title="Poprzednia"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-gray-400">{currentIndex + 1}/{newsItems.length}</span>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % newsItems.length)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                title="Następna"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Mark as read button */}
          <button
            onClick={() => markAsRead(currentNews.id)}
            className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            title="Oznacz jako przeczytane"
          >
            Przeczytano
          </button>
          
          {/* Refresh button */}
          <button
            onClick={loadFlashNews}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Odśwież"
          >
            <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
            title="Ukryj"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsVisible(true)}
          className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs rounded transition-colors"
          title="Pokaż aktualności"
        >
          📢 {newsItems.length}
        </button>
      )}
    </div>
  );
}