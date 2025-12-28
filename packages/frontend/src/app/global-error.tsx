'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="pl">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Coś poszło nie tak
            </h2>
            <p className="text-gray-600 mb-6">
              Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
