'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full text-center border border-gray-200">
        <div className="text-yellow-500 text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Błąd ładowania
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          Nie udało się załadować tej sekcji.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          Odśwież
        </button>
      </div>
    </div>
  );
}
