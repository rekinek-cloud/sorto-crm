'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DomainBranding {
  name: string;
  primaryColor: string;
  logo: string | null;
  slug: string | null;
}

const defaultBranding: DomainBranding = {
  name: 'STREAMS',
  primaryColor: '#6366f1',
  logo: null,
  slug: null,
};

interface DomainBrandingProps {
  locale: string;
  className?: string;
  showName?: boolean;
}

export function DomainBrandingLogo({ locale, className = '', showName = true }: DomainBrandingProps) {
  const [branding, setBranding] = useState<DomainBranding>(defaultBranding);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/v1/overlays/branding');
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setBranding(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      }
    };
    fetchBranding();
  }, []);

  return (
    <Link href={`/${locale}`} className={`flex items-center space-x-2 ${className}`}>
      {branding.logo ? (
        <img src={branding.logo} alt={branding.name} className="h-8 w-auto" />
      ) : (
        <div className="text-2xl font-bold" style={{ color: branding.primaryColor }}>🌊</div>
      )}
      {showName && (
        <span className="text-xl font-bold text-gray-900">{branding.name}</span>
      )}
    </Link>
  );
}

export function DomainBrandingFooter({ locale, className = '' }: DomainBrandingProps) {
  const [branding, setBranding] = useState<DomainBranding>(defaultBranding);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/v1/overlays/branding');
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setBranding(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      }
    };
    fetchBranding();
  }, []);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-2xl">🌊</span>
      <span className="text-xl font-bold text-white">{branding.name}</span>
    </div>
  );
}

export function CopyrightWithBranding({ text }: { text: string }) {
  const [branding, setBranding] = useState<DomainBranding>(defaultBranding);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/v1/overlays/branding');
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setBranding(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      }
    };
    fetchBranding();
  }, []);

  return (
    <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
      © 2026 {branding.name}. {text}
    </div>
  );
}

export function useDomainBranding() {
  const [branding, setBranding] = useState<DomainBranding>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/v1/overlays/branding');
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setBranding(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranding();
  }, []);

  return { branding, isLoading };
}
