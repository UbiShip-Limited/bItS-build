// Add TypeScript declarations for Jest mocks to fix type issues

import { jest } from '@jest/globals';

// Extend Jest methods to handle any type of value for tests
declare global {
  namespace jest {
    interface Mock<T extends (...args: any[]) => any = any> {
      mockResolvedValue(value: any): this;
      mockResolvedValueOnce(value: any): this;
      mockRejectedValue(value: any): this;
      mockRejectedValueOnce(value: any): this;
      mockImplementation(fn: (...args: any[]) => any): this;
      mockImplementationOnce(fn: (...args: any[]) => any): this;
    }
    
    // Extend jest.fn to accept any
    function fn(): Mock;
    function fn<T extends (...args: any[]) => any>(implementation?: T): Mock<T>;
  }
} 