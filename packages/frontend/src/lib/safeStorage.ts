/**
 * Safe localStorage wrapper that handles cases where storage is not available
 * (e.g., incognito mode, iframes, security restrictions)
 */

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      // localStorage not available (incognito, iframe, etc.)
      console.warn('localStorage not available:', e);
    }
    return null;
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return false;
  },

  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return false;
  },

  getJSON: <T>(key: string, defaultValue: T): T => {
    try {
      const item = safeLocalStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
    } catch (e) {
      console.warn('Failed to parse localStorage item:', e);
    }
    return defaultValue;
  },

  setJSON: (key: string, value: unknown): boolean => {
    try {
      return safeLocalStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to stringify localStorage item:', e);
      return false;
    }
  }
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage not available:', e);
    }
    return null;
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      console.warn('sessionStorage not available:', e);
    }
    return false;
  },

  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.warn('sessionStorage not available:', e);
    }
    return false;
  }
};

export default safeLocalStorage;
