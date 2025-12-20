'use client';

import React, { useState, useEffect } from 'react';

export default function HeaderDateTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('pl-PL', options);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getGreeting = () => {
    if (!currentTime) return "🌅 Ładowanie...";
    const hour = currentTime.getHours();
    if (hour < 6) return "🌙 Dobranoc";
    if (hour < 12) return "🌅 Dzień dobry";
    if (hour < 18) return "☀️ Dzień dobry";
    if (hour < 22) return "🌆 Dobry wieczór";
    return "🌙 Dobranoc";
  };

  // Nie renderuj nic dynamicznego podczas SSR, aby uniknąć błędów hydration
  if (!mounted || !currentTime) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">🌅 Ładowanie...</span>
          <span className="text-xl font-bold text-primary-600">Sorto-CRM</span>
        </div>
        <div className="h-4 w-px bg-gray-300"></div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">--</span>
          <span className="font-mono font-semibold text-primary-600">--:--:--</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Logo with greeting */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">{getGreeting()}</span>
        <span className="text-xl font-bold text-primary-600">Sorto-CRM</span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-gray-300"></div>

      {/* Compact date and time */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-600">{formatDate(currentTime)}</span>
        <span className="font-mono font-semibold text-primary-600">{formatTime(currentTime)}</span>
      </div>
    </div>
  );
}