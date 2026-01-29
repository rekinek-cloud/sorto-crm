import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Check if user is authenticated - redirect to dashboard
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');

  if (accessToken) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations('landing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={`/${locale}`} className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary-600">🌊</div>
              <span className="text-xl font-bold text-gray-900">STREAMS</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href={`/${locale}/auth/login`}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="btn btn-primary"
              >
                {t('startFree')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            {t('heroTitle')}
            <span className="text-primary-600"> {t('heroHighlight')}</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            {t('heroDescription')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={`/${locale}/auth/register`}
              className="btn btn-primary btn-lg text-lg px-8 py-4"
            >
              {t('ctaStart')}
            </Link>
            <Link
              href="#features"
              className="btn btn-outline btn-lg text-lg px-8 py-4"
            >
              {t('ctaLearnMore')}
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            {t('trialInfo')}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {t('featuresTitle')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - CRM */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('feature1Title')}
              </h3>
              <p className="text-gray-600">
                {t('feature1Desc')}
              </p>
            </div>

            {/* Feature 2 - Tasks */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('feature2Title')}
              </h3>
              <p className="text-gray-600">
                {t('feature2Desc')}
              </p>
            </div>

            {/* Feature 3 - AI */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('feature3Title')}
              </h3>
              <p className="text-gray-600">
                {t('feature3Desc')}
              </p>
            </div>

            {/* Feature 4 - Pipeline */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border border-orange-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('feature4Title')}
              </h3>
              <p className="text-gray-600">
                {t('feature4Desc')}
              </p>
            </div>

            {/* Feature 5 - Email */}
            <div className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl border border-pink-100">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('feature5Title')}
              </h3>
              <p className="text-gray-600">
                {t('feature5Desc')}
              </p>
            </div>

            {/* Feature 6 - Team */}
            <div className="bg-gradient-to-br from-cyan-50 to-white p-8 rounded-2xl border border-cyan-100">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('feature6Title')}
              </h3>
              <p className="text-gray-600">
                {t('feature6Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {t('pricingTitle')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t('pricingSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
              <p className="mt-2 text-gray-600 text-sm">{t('planStarterDesc')}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">39 PLN</span>
                <span className="text-gray-600">/mies.</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  5 {t('users')}
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  3 {t('streams')}
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  {t('basicCrm')}
                </li>
              </ul>
              <Link
                href={`/${locale}/auth/register`}
                className="mt-8 block w-full btn btn-outline text-center"
              >
                {t('choosePlan')}
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-primary-600 rounded-2xl p-8 text-white relative transform scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  {t('mostPopular')}
                </span>
              </div>
              <h3 className="text-xl font-semibold">Professional</h3>
              <p className="mt-2 text-primary-100 text-sm">{t('planProfessionalDesc')}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold">119 PLN</span>
                <span className="text-primary-200">/mies.</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center">
                  <span className="text-white mr-3">✓</span>
                  25 {t('users')}
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3">✓</span>
                  15 {t('streams')}
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3">✓</span>
                  {t('fullCrm')}
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3">✓</span>
                  {t('aiAssistant')}
                </li>
              </ul>
              <Link
                href={`/${locale}/auth/register`}
                className="mt-8 block w-full bg-white text-primary-600 font-medium py-3 px-4 rounded-lg text-center hover:bg-gray-100 transition-colors"
              >
                {t('choosePlan')}
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900">Enterprise</h3>
              <p className="mt-2 text-gray-600 text-sm">{t('planEnterpriseDesc')}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">{t('custom')}</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  {t('unlimitedUsers')}
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  {t('unlimitedStreams')}
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  {t('dedicatedSupport')}
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  {t('customIntegrations')}
                </li>
              </ul>
              <Link
                href={`/${locale}/auth/register`}
                className="mt-8 block w-full btn btn-outline text-center"
              >
                {t('contactUs')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            {t('ctaTitle')}
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            {t('ctaDescription')}
          </p>
          <Link
            href={`/${locale}/auth/register`}
            className="mt-8 inline-block bg-white text-primary-600 font-semibold py-4 px-8 rounded-lg text-lg hover:bg-gray-100 transition-colors"
          >
            {t('ctaButton')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <span className="text-2xl">🌊</span>
              <span className="text-xl font-bold text-white">STREAMS</span>
            </div>
            <div className="flex space-x-6">
              <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
                {t('terms')}
              </Link>
              <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">
                {t('privacy')}
              </Link>
              <Link href={`/${locale}/auth/login`} className="hover:text-white transition-colors">
                {t('login')}
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            © 2026 STREAMS. {t('allRightsReserved')}
          </div>
        </div>
      </footer>
    </div>
  );
}
