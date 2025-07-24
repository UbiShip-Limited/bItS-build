import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoadCallback?: () => void;
  }
}

interface UseRecaptchaOptions {
  siteKey?: string;
  action?: string;
}

export const useRecaptcha = ({ siteKey, action = 'submit' }: UseRecaptchaOptions = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use environment variable if no site key provided
  const recaptchaSiteKey = siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!recaptchaSiteKey) {
      console.warn('reCAPTCHA site key not provided');
      return;
    }

    // Check if already loaded
    if (window.grecaptcha && window.grecaptcha.ready) {
      setIsLoaded(true);
      return;
    }

    // Create callback for when script loads
    window.onRecaptchaLoadCallback = () => {
      setIsLoaded(true);
    };

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}&onload=onRecaptchaLoadCallback`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      setError('Failed to load reCAPTCHA');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      const scriptElement = document.querySelector(`script[src*="recaptcha"]`);
      if (scriptElement) {
        scriptElement.remove();
      }
      delete window.onRecaptchaLoadCallback;
    };
  }, [recaptchaSiteKey]);

  const executeRecaptcha = useCallback(async (customAction?: string): Promise<string | null> => {
    if (!recaptchaSiteKey) {
      console.warn('reCAPTCHA site key not provided');
      return null;
    }

    if (!isLoaded || !window.grecaptcha) {
      setError('reCAPTCHA not loaded');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(recaptchaSiteKey, {
        action: customAction || action
      });
      return token;
    } catch (err) {
      console.error('reCAPTCHA execution error:', err);
      setError('Failed to execute reCAPTCHA');
      return null;
    }
  }, [recaptchaSiteKey, action, isLoaded]);

  return {
    executeRecaptcha,
    isLoaded,
    error,
    isAvailable: !!recaptchaSiteKey
  };
};