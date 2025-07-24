import { ValidationError } from './errors';

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export class RecaptchaService {
  private secretKey: string;
  private verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  private minimumScore = 0.5; // Adjust based on your needs (0.0 - 1.0)

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error('reCAPTCHA secret key is required');
    }
    this.secretKey = secretKey;
  }

  /**
   * Verify reCAPTCHA v3 token
   * @param token - The reCAPTCHA token from the client
   * @param action - Expected action name (optional)
   * @returns Promise<boolean> - True if verification passes
   */
  async verify(token: string, action?: string): Promise<boolean> {
    if (!token) {
      throw new ValidationError('reCAPTCHA token is required');
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: this.secretKey,
          response: token,
        }),
      });

      if (!response.ok) {
        console.error('reCAPTCHA API error:', response.status);
        return false;
      }

      const data: RecaptchaVerifyResponse = await response.json();

      // Check if verification was successful
      if (!data.success) {
        console.error('reCAPTCHA verification failed:', data['error-codes']);
        return false;
      }

      // Check score for v3
      if (data.score !== undefined && data.score < this.minimumScore) {
        console.warn(`reCAPTCHA score too low: ${data.score}`);
        return false;
      }

      // Verify action matches if provided
      if (action && data.action !== action) {
        console.warn(`reCAPTCHA action mismatch: expected ${action}, got ${data.action}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      // In case of network errors, you might want to fail open or closed
      // For security, we'll fail closed (deny access)
      return false;
    }
  }

  /**
   * Set minimum score threshold for v3
   * @param score - Score between 0.0 and 1.0
   */
  setMinimumScore(score: number): void {
    if (score < 0 || score > 1) {
      throw new Error('Score must be between 0.0 and 1.0');
    }
    this.minimumScore = score;
  }
}

// Singleton instance
let recaptchaService: RecaptchaService | null = null;

export const initializeRecaptchaService = (secretKey: string): RecaptchaService => {
  if (!recaptchaService) {
    recaptchaService = new RecaptchaService(secretKey);
  }
  return recaptchaService;
};

export const getRecaptchaService = (): RecaptchaService => {
  if (!recaptchaService) {
    throw new Error('RecaptchaService not initialized. Call initializeRecaptchaService first.');
  }
  return recaptchaService;
};