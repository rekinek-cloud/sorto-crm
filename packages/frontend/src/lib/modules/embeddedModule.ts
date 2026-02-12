/**
 * Embedded Module Helper
 *
 * Use this in external modules to integrate with the platform.
 *
 * Example usage in module's main component:
 *
 * ```tsx
 * import { useEmbeddedModule } from '@sorto/module-sdk';
 *
 * function App() {
 *   const { isEmbedded, platform, sendNotification } = useEmbeddedModule();
 *
 *   if (isEmbedded) {
 *     // Render without shell (header, sidebar)
 *     return <MainContent />;
 *   }
 *
 *   // Render full standalone app
 *   return (
 *     <Shell>
 *       <MainContent />
 *     </Shell>
 *   );
 * }
 * ```
 */

import { ModuleMessage, ModuleInitData, createModuleMessage } from './types';

interface EmbeddedModuleOptions {
  onInit?: (data: ModuleInitData) => void;
  onThemeChange?: (branding: ModuleInitData['branding']) => void;
  onUserChange?: (user: ModuleInitData['user']) => void;
  onLogout?: () => void;
}

class EmbeddedModuleSDK {
  private isEmbedded: boolean = false;
  private platform: ModuleInitData | null = null;
  private callbacks: EmbeddedModuleOptions = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkEmbeddedMode();
      this.setupMessageListener();
    }
  }

  private checkEmbeddedMode() {
    const params = new URLSearchParams(window.location.search);
    this.isEmbedded = params.get('mode') === 'embedded';
  }

  private setupMessageListener() {
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent) {
    const message = event.data as ModuleMessage;
    if (!message?.type || !message?.timestamp) return;

    switch (message.type) {
      case 'PLATFORM_INIT':
        this.platform = message.payload;
        this.callbacks.onInit?.(message.payload);
        break;

      case 'PLATFORM_THEME':
        if (this.platform) {
          this.platform.branding = message.payload;
        }
        this.callbacks.onThemeChange?.(message.payload);
        break;

      case 'PLATFORM_USER':
        if (this.platform) {
          this.platform.user = message.payload;
        }
        this.callbacks.onUserChange?.(message.payload);
        break;

      case 'PLATFORM_LOGOUT':
        this.callbacks.onLogout?.();
        break;
    }
  }

  // Send message to platform
  private sendToPlatform(type: ModuleMessage['type'], payload: any) {
    if (!this.isEmbedded || typeof window === 'undefined') return;

    const message = createModuleMessage(type, payload);
    window.parent.postMessage(message, '*');
  }

  // Public API
  public init(options: EmbeddedModuleOptions) {
    this.callbacks = options;

    // Notify platform that module is ready
    if (this.isEmbedded) {
      this.sendToPlatform('MODULE_READY', { version: '1.0.0' });
    }
  }

  public getIsEmbedded(): boolean {
    return this.isEmbedded;
  }

  public getPlatformData(): ModuleInitData | null {
    return this.platform;
  }

  // Request navigation (platform will handle)
  public navigate(path: string) {
    this.sendToPlatform('MODULE_NAVIGATE', { path });
  }

  // Update iframe height
  public updateHeight(height: number) {
    this.sendToPlatform('MODULE_RESIZE', { height });
  }

  // Send notification to platform
  public notify(notification: { title: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }) {
    this.sendToPlatform('MODULE_NOTIFICATION', notification);
  }

  // Trigger custom action
  public triggerAction(actionType: string, payload: any) {
    this.sendToPlatform('MODULE_ACTION', { type: actionType, payload });
  }

  // Cleanup
  public destroy() {
    window.removeEventListener('message', this.handleMessage.bind(this));
  }
}

// Singleton instance
let sdkInstance: EmbeddedModuleSDK | null = null;

export function getEmbeddedModuleSDK(): EmbeddedModuleSDK {
  if (!sdkInstance) {
    sdkInstance = new EmbeddedModuleSDK();
  }
  return sdkInstance;
}

// React hook for easy integration
export function useEmbeddedModule(options: EmbeddedModuleOptions = {}) {
  if (typeof window === 'undefined') {
    return {
      isEmbedded: false,
      platform: null,
      navigate: () => {},
      updateHeight: () => {},
      notify: () => {},
      triggerAction: () => {},
    };
  }

  const sdk = getEmbeddedModuleSDK();
  sdk.init(options);

  return {
    isEmbedded: sdk.getIsEmbedded(),
    platform: sdk.getPlatformData(),
    navigate: sdk.navigate.bind(sdk),
    updateHeight: sdk.updateHeight.bind(sdk),
    notify: sdk.notify.bind(sdk),
    triggerAction: sdk.triggerAction.bind(sdk),
  };
}
