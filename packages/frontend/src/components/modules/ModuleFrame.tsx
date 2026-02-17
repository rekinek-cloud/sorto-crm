'use client';

import { useRef, useState, useEffect } from 'react';
import { useOverlay } from '@/lib/contexts/OverlayContext';
import { useAuth } from '@/lib/auth/context';
import { useModuleBridge } from '@/lib/modules/useModuleBridge';
import { ModuleInitData } from '@/lib/modules/types';
import { Loader2, AlertCircle, Maximize2, Minimize2, ExternalLink, RefreshCw } from 'lucide-react';

interface ModuleFrameProps {
  moduleSlug: string;
  moduleUrl: string;
  moduleName: string;
  moduleDescription?: string;
  moduleIcon?: string;
}

export default function ModuleFrame({
  moduleSlug,
  moduleUrl,
  moduleName,
  moduleDescription,
  moduleIcon = '📦',
}: ModuleFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { branding } = useOverlay();
  const { user, organization } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Build embedded URL with mode parameter
  const embeddedUrl = new URL(moduleUrl);
  embeddedUrl.searchParams.set('mode', 'embedded');
  embeddedUrl.searchParams.set('platform', 'sorto');

  // Prepare init data for module
  const initData: ModuleInitData = {
    mode: 'embedded',
    ssoToken: '', // Will be set by SSO flow
    user: user ? {
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      organizationId: organization?.id || '',
      organizationName: '', // Could be fetched
    } : {
      id: '',
      email: '',
      firstName: '',
      lastName: '',
      role: '',
      organizationId: '',
      organizationName: '',
    },
    branding: {
      primaryColor: branding.primaryColor,
      logo: branding.logo,
      name: branding.name,
      theme: 'light' as const, // Platform uses light theme
    },
    locale: 'pl',
    features: [],
  };

  // Module bridge for communication
  const { isReady, error, updateTheme } = useModuleBridge({
    moduleSlug,
    iframeRef,
    initData,
    onReady: () => {
      setIsLoading(false);
      setLoadError(null);
    },
    onResize: (height) => {
      setIframeHeight(height);
    },
    onNotification: (notification) => {
      // Could integrate with toast/notification system
      console.log('Module notification:', notification);
    },
    onNavigate: (path) => {
      // Handle in-module navigation if needed
      console.log('Module navigate:', path);
    },
    onAction: (action) => {
      console.log('Module action:', action);
    },
  });

  // Send theme updates when branding changes after initial load
  useEffect(() => {
    if (isReady && branding.primaryColor) {
      updateTheme({
        primaryColor: branding.primaryColor,
        logo: branding.logo,
        name: branding.name,
        theme: 'light' as const,
      });
    }
  }, [isReady, branding.primaryColor, branding.logo, branding.name, updateTheme]);

  // Handle iframe load (fallback if module doesn't send MODULE_READY)
  const handleIframeLoad = () => {
    // Give module 2 seconds to send MODULE_READY, then assume it's ready
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 2000);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError('Nie udało się załadować modułu');
  };

  // Refresh module
  const refreshModule = () => {
    setIsLoading(true);
    setLoadError(null);
    if (iframeRef.current) {
      iframeRef.current.src = embeddedUrl.toString();
    }
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`}>
      {/* Module Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-white border-b"
        style={{ borderColor: `${branding.primaryColor}20` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{moduleIcon}</span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{moduleName}</h1>
            {moduleDescription && (
              <p className="text-sm text-gray-500">{moduleDescription}</p>
            )}
          </div>
          {isReady && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Połączony
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={refreshModule}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Odśwież moduł"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isFullscreen ? 'Zamknij pełny ekran' : 'Pełny ekran'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <a
            href={moduleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Otwórz w nowym oknie"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Module Content */}
      <div className="relative flex-1 bg-gray-50">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <Loader2
                className="w-10 h-10 animate-spin mx-auto mb-4"
                style={{ color: branding.primaryColor }}
              />
              <p className="text-gray-600 font-medium">Ładowanie {moduleName}...</p>
              <p className="text-sm text-gray-400 mt-1">Przygotowywanie modułu</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center max-w-md px-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-900 font-medium mb-2">Nie udało się załadować modułu</p>
              <p className="text-sm text-gray-500 mb-4">{loadError}</p>
              <button
                onClick={refreshModule}
                className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <RefreshCw className="w-4 h-4" />
                Spróbuj ponownie
              </button>
            </div>
          </div>
        )}

        {/* iframe */}
        <iframe
          ref={iframeRef}
          src={embeddedUrl.toString()}
          className="w-full border-0"
          style={{
            height: iframeHeight
              ? `${iframeHeight}px`
              : isFullscreen
              ? 'calc(100vh - 64px)'
              : 'calc(100vh - 200px)',
            minHeight: '400px',
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="camera; microphone; geolocation; fullscreen; clipboard-write; clipboard-read"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
        />
      </div>
    </div>
  );
}
