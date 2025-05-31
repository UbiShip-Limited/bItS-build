// Add TypeScript declarations for Jest mocks to fix type issues

// Extend Jest methods to handle unknown type of value for tests
declare global {
  namespace jest {
    interface Mock<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> {
      mockResolvedValue(value: unknown): this;
      mockResolvedValueOnce(value: unknown): this;
      mockRejectedValue(value: unknown): this;
      mockRejectedValueOnce(value: unknown): this;
      mockImplementation(fn: (...args: unknown[]) => unknown): this;
      mockImplementationOnce(fn: (...args: unknown[]) => unknown): this;
    }
    
    // Extend jest.fn to accept unknown
    function fn(): Mock;
    function fn<T extends (...args: unknown[]) => unknown>(implementation?: T): Mock<T>;
    
    // Jest type extensions and custom matchers
    interface Matchers<R> {
      toMatchError(errorClass: new (...args: unknown[]) => Error, message?: string | RegExp): R;
    }
  }
}

// Export an empty object to make this a module
export {}; 