'use client';

import { useEffect } from 'react';

/**
 * ToastProvider component to ensure toast container is mounted
 * This is needed for our custom toast implementation
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure the toast container is initialized when the app mounts
    // The toast manager handles its own DOM manipulation
    return () => {
      // Cleanup is handled by the toast manager
    };
  }, []);

  return <>{children}</>;
}