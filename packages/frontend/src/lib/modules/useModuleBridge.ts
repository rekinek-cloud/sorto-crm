'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { ModuleMessage, ModuleInitData, createModuleMessage } from './types';

interface UseModuleBridgeOptions {
  moduleSlug: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  initData: ModuleInitData;
  onReady?: () => void;
  onNavigate?: (path: string) => void;
  onResize?: (height: number) => void;
  onNotification?: (notification: { title: string; message: string; type: string }) => void;
  onAction?: (action: { type: string; payload: any }) => void;
}

const ALLOWED_ORIGINS = [
  '*.sorto.ai',
  '*.dev.sorto.ai',
  'localhost:3000',
  'localhost:3001',
  'localhost:3002',
];

export function useModuleBridge({
  moduleSlug,
  iframeRef,
  initData,
  onReady,
  onNavigate,
  onResize,
  onNotification,
  onAction,
}: UseModuleBridgeOptions) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initSentRef = useRef(false);

  // Send message to module
  const sendMessage = useCallback((type: ModuleMessage['type'], payload: any) => {
    if (!iframeRef.current?.contentWindow) {
      console.warn('Module iframe not available');
      return;
    }

    const message = createModuleMessage(type, payload, moduleSlug);

    try {
      iframeRef.current.contentWindow.postMessage(message, '*');
    } catch (err) {
      console.error('Failed to send message to module:', err);
    }
  }, [iframeRef, moduleSlug]);

  // Send init data to module
  const sendInit = useCallback(() => {
    if (initSentRef.current) return;
    initSentRef.current = true;
    sendMessage('PLATFORM_INIT', initData);
  }, [sendMessage, initData]);

  // Handle messages from module
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin.replace(/^https?:\/\//, '');
      const isValid = ALLOWED_ORIGINS.some(allowed => {
        if (allowed.startsWith('*.')) {
          const domain = allowed.slice(2);
          return origin.endsWith(domain) || origin === domain.slice(1);
        }
        return origin === allowed || origin.startsWith(allowed);
      });

      if (!isValid) {
        return; // Ignore messages from unknown origins
      }

      const message = event.data as ModuleMessage;
      if (!message?.type || !message?.timestamp) {
        return; // Not a valid module message
      }

      // Handle different message types
      switch (message.type) {
        case 'MODULE_READY':
          setIsReady(true);
          setError(null);
          sendInit();
          onReady?.();
          break;

        case 'MODULE_NAVIGATE':
          onNavigate?.(message.payload.path);
          break;

        case 'MODULE_RESIZE':
          onResize?.(message.payload.height);
          break;

        case 'MODULE_NOTIFICATION':
          onNotification?.(message.payload);
          break;

        case 'MODULE_ACTION':
          onAction?.(message.payload);
          break;

        default:
          console.log('Unknown module message:', message.type);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendInit, onReady, onNavigate, onResize, onNotification, onAction]);

  // Send theme updates
  const updateTheme = useCallback((branding: ModuleInitData['branding']) => {
    sendMessage('PLATFORM_THEME', branding);
  }, [sendMessage]);

  // Send user updates
  const updateUser = useCallback((user: ModuleInitData['user']) => {
    sendMessage('PLATFORM_USER', user);
  }, [sendMessage]);

  // Notify module of logout
  const notifyLogout = useCallback(() => {
    sendMessage('PLATFORM_LOGOUT', {});
  }, [sendMessage]);

  return {
    isReady,
    error,
    sendMessage,
    updateTheme,
    updateUser,
    notifyLogout,
  };
}
