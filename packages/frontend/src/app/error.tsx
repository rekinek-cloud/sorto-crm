'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          Wystąpił błąd
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          {error.message || 'Coś poszło nie tak. Spróbuj ponownie.'}
        </p>
        <div className="space-x-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Spróbuj ponownie
          </button>
          <button
            onClick={() => window.location.href = '/crm/dashboard'}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            Wróć do Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
