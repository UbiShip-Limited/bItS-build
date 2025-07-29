/**
 * Utility function for combining class names with conditional logic
 * Supports strings, booleans, undefined, and objects with boolean values
 */
export function cn(...classes: (string | boolean | undefined | { [key: string]: boolean })[]): string {
  return classes
    .filter(Boolean)
    .map((c) => {
      if (typeof c === "object") {
        return Object.entries(c)
          .filter(([, value]) => value)
          .map(([key]) => key);
      }
      return c;
    })
    .flat()
    .join(" ");
} 