// Common type utilities and interfaces

// Generic record type
export type AnyRecord = Record<string, unknown>;

// Type for JSON-serializable values
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// Event handler types
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

// Mock function type for tests
export type MockFunction<T extends (...args: unknown[]) => unknown> = jest.Mock<
  ReturnType<T>,
  Parameters<T>
>;

// Utility type to make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Utility type to extract promise type
export type Awaited<T> = T extends Promise<infer U> ? U : T;

// Form data types
export interface FormDataFile {
  name: string;
  data: Buffer;
  type: string;
  size: number;
}

// Test context types
export interface TestContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  headers?: Record<string, string>;
}

// Request/Response utilities
export type RequestParams = Record<string, string | undefined>;
export type RequestQuery = Record<string, string | string[] | undefined>;
export type RequestBody = JsonObject | FormData | string;

// Date utility types
export type DateString = string; // ISO 8601 format
export type Timestamp = number; // Unix timestamp in seconds

// Status types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// Amount types
export interface MoneyAmount {
  amount: number; // In smallest currency unit (cents)
  currency: string; // ISO 4217 currency code
} 