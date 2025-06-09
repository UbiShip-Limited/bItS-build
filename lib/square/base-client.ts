import { SquareClient as SquareSDKClient, SquareEnvironment } from "square";
import type { SquareConfig } from './types';

export class BaseSquareClient {
  protected client: SquareSDKClient;
  protected locationId: string;

  constructor(config: SquareConfig) {
    this.client = new SquareSDKClient({
      token: config.accessToken,
      environment: config.environment === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox
    });
    
    this.locationId = config.locationId;
  }

  // Helper methods for API access
  protected getApiUrl(): string {
    const env = (this.client as unknown as { config: { environment: SquareEnvironment } }).config.environment;
    return env === SquareEnvironment.Production 
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';
  }

  protected getAccessToken(): string {
    // Access the token from the client configuration
    return (this.client as unknown as { config: { accessToken: string } }).config.accessToken;
  }

  // Getter for the Square SDK client
  protected getClient(): SquareSDKClient {
    return this.client;
  }

  // Getter for location ID
  protected getLocationId(): string {
    return this.locationId;
  }

  // Helper to initialize from environment variables
  static fromEnv(): BaseSquareClient {
    const { 
      SQUARE_ACCESS_TOKEN,
      SQUARE_ENVIRONMENT = 'sandbox',
      SQUARE_APPLICATION_ID,
      SQUARE_LOCATION_ID
    } = process.env;

    if (!SQUARE_ACCESS_TOKEN) {
      throw new Error('SQUARE_ACCESS_TOKEN is required');
    }

    if (!SQUARE_APPLICATION_ID) {
      throw new Error('SQUARE_APPLICATION_ID is required');
    }

    if (!SQUARE_LOCATION_ID) {
      throw new Error('SQUARE_LOCATION_ID is required');
    }

    return new BaseSquareClient({
      accessToken: SQUARE_ACCESS_TOKEN,
      environment: SQUARE_ENVIRONMENT,
      applicationId: SQUARE_APPLICATION_ID,
      locationId: SQUARE_LOCATION_ID
    });
  }
} 