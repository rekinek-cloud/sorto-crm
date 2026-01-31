'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const forgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      // TODO: Implement password reset API call
      // await apiClient.post('/auth/forgot-password', { email: data.email });

      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast.success('Jeśli konto istnieje, wysłaliśmy link do resetowania hasła');
    } catch (error: any) {
      toast.error('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/dashboard" className="inline-flex items-center space-x-2 mb-6">
            <div className="text-3xl font-bold text-primary-600">🌊</div>
            <span className="text-2xl font-bold text-gray-900">STREAMS</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Resetuj hasło
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Podaj swój adres email, a wyślemy Ci link do resetowania hasła.
          </p>
        </div>

        {isSubmitted ? (
          /* Success state */
          <div className="mt-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <EnvelopeIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sprawdź swoją skrzynkę
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła.
              Sprawdź również folder spam.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Powrót do logowania
            </Link>
          </div>
        ) : (
          /* Form */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adres email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={`mt-1 input ${errors.email ? 'input-error' : ''}`}
                placeholder="twoj@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary btn-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Wysyłanie...
                  </div>
                ) : (
                  'Wyślij link resetujący'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Powrót do logowania
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
