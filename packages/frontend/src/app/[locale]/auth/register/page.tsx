'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/context';

const registerSchema = z.object({
  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  subscriptionPlan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional().default('STARTER'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const plans = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '$9/month',
    description: 'Perfect for small teams',
    features: ['5 team members', '3 streams', '100 tasks per user'],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: '$29/month',
    description: 'Ideal for growing businesses',
    features: ['25 team members', '15 streams', '1,000 tasks per user'],
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: '$99/month',
    description: 'For large organizations',
    features: ['Unlimited members', 'Unlimited streams', 'Priority support'],
  },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      subscriptionPlan: 'PROFESSIONAL',
    },
  });

  const selectedPlan = watch('subscriptionPlan');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
    } catch (error: any) {
      // Error handling is done in the auth context
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="text-3xl font-bold text-primary-600">🌊</div>
            <span className="text-2xl font-bold text-gray-900">STREAMS</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Utwórz swoje konto
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Masz już konto?{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
              Zaloguj się
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Organization Name */}
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <input
                  {...register('organizationName')}
                  type="text"
                  className={`mt-1 input ${errors.organizationName ? 'input-error' : ''}`}
                  placeholder="Your company or organization name"
                />
                {errors.organizationName && (
                  <p className="mt-1 text-sm text-error-600">{errors.organizationName.message}</p>
                )}
              </div>

              {/* First and Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className={`mt-1 input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className={`mt-1 input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`mt-1 input ${errors.email ? 'input-error' : ''}`}
                  placeholder="john@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center">
                <input
                  {...register('acceptTerms')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="mt-1 text-sm text-error-600">{errors.acceptTerms.message}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary btn-lg mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>

          {/* Plan Selection */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
              <p className="text-sm text-gray-600 mb-6">
                Start with a 14-day free trial. No credit card required.
              </p>
            </div>

            <div className="space-y-4">
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className={`relative block cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    selectedPlan === plan.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  } ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
                >
                  <input
                    {...register('subscriptionPlan')}
                    type="radio"
                    value={plan.id}
                    className="sr-only"
                  />
                  
                  {plan.popular && (
                    <div className="absolute -top-3 left-4">
                      <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{plan.name}</p>
                          <p className="text-gray-500">{plan.description}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-lg font-semibold text-gray-900">{plan.price}</p>
                        <ul className="mt-2 space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <CheckIcon className="h-4 w-4 text-success-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      selectedPlan === plan.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlan === plan.id && (
                        <CheckIcon className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">✨ What's included in your trial:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Full access to all features</li>
                <li>• No setup fees or hidden costs</li>
                <li>• Cancel anytime during trial</li>
                <li>• Email support included</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}