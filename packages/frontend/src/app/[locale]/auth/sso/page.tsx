'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import apiClient from '@/lib/api/client';

export default function SsoPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const locale = pathname.split('/')[1] || 'pl';

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('Brak tokena SSO');
      return;
    }

    handleSsoLogin(token);
  }, [searchParams]);

  async function handleSsoLogin(token: string) {
    try {
      const response = await apiClient.post('/auth/sso/callback', { token });
      const { user, organization, tokens } = response.data.data;

      // Store tokens in cookies (same as login)
      Cookies.set('access_token', tokens.accessToken, { expires: 1 });
      Cookies.set('refresh_token', tokens.refreshToken, { expires: 7 });

      // Redirect to dashboard
      router.push(`/${locale}/dashboard`);
    } catch (error: any) {
      console.error('SSO login failed:', error);
      setStatus('error');
      setErrorMsg(
        error.response?.data?.error || 'Logowanie SSO nie powiodło się'
      );
    }
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Błąd logowania SSO</h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <a
            href={`/${locale}/auth/login`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Przejdź do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Logowanie przez SSO</h2>
        <p className="text-gray-600">Weryfikacja tokena, proszę czekać...</p>
      </div>
    </div>
  );
}
