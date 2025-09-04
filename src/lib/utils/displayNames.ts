/**
 * Utility functions for generating user-friendly display names
 * instead of showing "Anonymous" for unauthenticated users
 */

/**
 * Extract a display name from an email address
 * Examples:
 * - john.doe@email.com → "John D."
 * - jane_smith@gmail.com → "Jane S."
 * - user123@domain.com → "User123"
 */
export function emailToDisplayName(email?: string): string {
  if (!email) return '';
  
  // Extract the local part before @
  const localPart = email.split('@')[0];
  if (!localPart) return '';
  
  // Split by common separators (., _, -, +)
  const parts = localPart.split(/[._\-+]/).filter(part => part.length > 0);
  
  if (parts.length >= 2) {
    // If we have multiple parts, capitalize first and use first letter of second
    const firstName = capitalizeFirst(parts[0]);
    const lastInitial = parts[1].charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
  } else if (parts.length === 1) {
    // Single part, just capitalize
    return capitalizeFirst(parts[0]);
  }
  
  return '';
}

/**
 * Generate a display name from available contact information
 * Priority: firstName > emailToDisplayName > "New Inquiry"
 */
export function generateDisplayName(data: {
  firstName?: string;
  contactEmail?: string;
  customer?: { name?: string };
}): string {
  // If it's a registered customer, use their name
  if (data.customer?.name) {
    return data.customer.name;
  }
  
  // If firstName is provided, use it
  if (data.firstName?.trim()) {
    return data.firstName.trim();
  }
  
  // Try to generate from email
  const emailName = emailToDisplayName(data.contactEmail);
  if (emailName) {
    return emailName;
  }
  
  // Final fallback
  return 'New Inquiry';
}

/**
 * Get a user-friendly label for anonymous vs registered users
 */
export function getUserTypeLabel(data: {
  firstName?: string;
  contactEmail?: string;
  customer?: { name?: string };
}): 'registered' | 'anonymous' | 'identified' {
  if (data.customer?.name) return 'registered';
  if (data.firstName?.trim()) return 'identified';
  return 'anonymous';
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get a display name for tattoo request listings
 * Includes context about the request type
 */
export function getTattooRequestDisplayName(request: {
  firstName?: string;
  contactEmail?: string;
  customer?: { name?: string };
  purpose?: string;
}): string {
  const baseName = generateDisplayName(request);
  const userType = getUserTypeLabel(request);
  
  if (userType === 'registered') {
    return baseName; // Registered customers just show their name
  }
  
  // For anonymous/identified users, add context
  if (request.purpose && request.purpose !== 'General Inquiry') {
    return `${baseName} - ${request.purpose}`;
  }
  
  return baseName;
}

/**
 * Get appropriate styling/badge for user type
 */
export function getUserTypeBadge(data: {
  firstName?: string;
  contactEmail?: string;
  customer?: { name?: string };
}): {
  label: string;
  className: string;
  icon?: string;
} {
  const userType = getUserTypeLabel(data);
  
  switch (userType) {
    case 'registered':
      return {
        label: 'Customer',
        className: 'bg-green-500/20 text-green-400 border border-green-500/30',
        icon: '👤'
      };
    case 'identified':
      return {
        label: 'Identified',
        className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        icon: '✋'
      };
    default:
      return {
        label: 'Anonymous',
        className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
        icon: '❓'
      };
  }
}