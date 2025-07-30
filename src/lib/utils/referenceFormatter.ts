/**
 * Utility functions for formatting reference numbers and tracking tokens
 * to make them more user-friendly while maintaining uniqueness
 */

/**
 * Formats a UUID into a user-friendly reference number
 * Example: "550e8400-e29b-41d4-a716-446655440000" -> "TATT-550E-8400"
 */
export function formatReferenceNumber(uuid: string): string {
  if (!uuid) return '';
  
  // Remove hyphens and convert to uppercase
  const cleanId = uuid.replace(/-/g, '').toUpperCase();
  
  // Take first 8 characters and format as TATT-XXXX-XXXX
  const part1 = cleanId.substring(0, 4);
  const part2 = cleanId.substring(4, 8);
  
  return `TATT-${part1}-${part2}`;
}

/**
 * Formats a tracking token into a user-friendly format
 * Example: "550e8400-e29b-41d4-a716-446655440000" -> "TRK-550E-8400"
 */
export function formatTrackingToken(token: string): string {
  if (!token) return '';
  
  // Remove hyphens and convert to uppercase
  const cleanToken = token.replace(/-/g, '').toUpperCase();
  
  // Take first 8 characters and format as TRK-XXXX-XXXX
  const part1 = cleanToken.substring(0, 4);
  const part2 = cleanToken.substring(4, 8);
  
  return `TRK-${part1}-${part2}`;
}

/**
 * Alternative format using year and shortened ID
 * Example: "550e8400-e29b-41d4-a716-446655440000" -> "TR-2024-550E84"
 */
export function formatReferenceWithYear(uuid: string): string {
  if (!uuid) return '';
  
  const year = new Date().getFullYear();
  const cleanId = uuid.replace(/-/g, '').toUpperCase();
  const shortId = cleanId.substring(0, 6);
  
  return `TR-${year}-${shortId}`;
}

/**
 * Format as a stylized ink-themed reference
 * Example: "550e8400-e29b-41d4-a716-446655440000" -> "INK#550E8400"
 */
export function formatInkReference(uuid: string): string {
  if (!uuid) return '';
  
  const cleanId = uuid.replace(/-/g, '').toUpperCase();
  const shortId = cleanId.substring(0, 8);
  
  return `INK#${shortId}`;
}

/**
 * Copies text to clipboard and returns a promise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Modern way
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}