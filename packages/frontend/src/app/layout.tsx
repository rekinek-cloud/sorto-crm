import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export const metadata: Metadata = {
  title: 'STREAMS - Produktywność w przepływie',
  description: 'STREAMS - nowoczesna platforma produktywności z zarządzaniem strumieniami, celami i AI',
  keywords: 'STREAMS, produktywność, strumienie, cele, zarządzanie zadaniami, projekty, CRM',
  authors: [{ name: 'STREAMS Team' }],
  openGraph: {
    title: 'STREAMS - Produktywność w przepływie',
    description: 'STREAMS - nowoczesna platforma produktywności z zarządzaniem strumieniami',
    type: 'website',
    locale: 'pl_PL',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>
            {children}
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
            />
          </Providers>
      </body>
    </html>
  );
}