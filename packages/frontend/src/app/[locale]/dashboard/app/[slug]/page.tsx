'use client';

import { useParams } from 'next/navigation';
import { useOverlay } from '@/lib/contexts/OverlayContext';
import ModuleFrame from '@/components/modules/ModuleFrame';
import Link from 'next/link';
import { Package } from 'lucide-react';

// Icon mapping for modules
const moduleIcons: Record<string, string> = {
  'focus-photo': '📸',
  'focus-cloud': '☁️',
  'flyball': '🎯',
  'slotify': '📅',
  'sites': '🌐',
  'faktury-ksef': '📄',
  'hr': '👥',
  'projekty': '📊',
  'flota': '🚗',
};

export default function AppWrapperPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { purchasedModules, branding } = useOverlay();

  const module = purchasedModules.find(m => m.slug === slug);

  // Module not found or not purchased
  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Moduł niedostępny
          </h2>
          <p className="text-gray-500 mb-6">
            Ten moduł nie został znaleziony lub nie jest aktywny w Twoim planie.
          </p>
          <Link
            href="/dashboard/modules"
            className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Package className="w-4 h-4" />
            Przeglądaj dostępne moduły
          </Link>
        </div>
      </div>
    );
  }

  // Module without URL
  if (!module.url) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">{moduleIcons[slug] || '📦'}</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {module.name}
          </h2>
          <p className="text-gray-500 mb-6">
            Ten moduł nie ma jeszcze skonfigurowanej aplikacji.
            Wkrótce będzie dostępny.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6"> {/* Negative margin to fill container */}
      <ModuleFrame
        moduleSlug={module.slug}
        moduleUrl={module.url}
        moduleName={module.name}
        moduleDescription={module.description || undefined}
        moduleIcon={moduleIcons[module.slug] || '📦'}
      />
    </div>
  );
}
