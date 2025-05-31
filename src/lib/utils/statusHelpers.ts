/**
 * Shared status helpers and color mappings
 */

import { BookingStatus } from '@/src/lib/api/services/appointmentService';

/**
 * Get Tailwind CSS classes for appointment status badges
 */
export const getAppointmentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [BookingStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
    [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-800',
    [BookingStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
    [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [BookingStatus.NO_SHOW]: 'bg-orange-100 text-orange-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get Tailwind CSS classes for tattoo request status badges
 */
export const getTattooRequestStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'new': 'bg-purple-100 text-purple-800',
    'reviewed': 'bg-indigo-100 text-indigo-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'deposit_paid': 'bg-yellow-100 text-yellow-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get Tailwind CSS classes for generic status badges
 * Combines both appointment and tattoo request statuses
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // Appointment statuses
    'pending': 'bg-yellow-100 text-yellow-800',
    'scheduled': 'bg-blue-100 text-blue-800',
    'confirmed': 'bg-green-100 text-green-800',
    'completed': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800',
    'no_show': 'bg-orange-100 text-orange-800',
    // Tattoo request statuses
    'new': 'bg-purple-100 text-purple-800',
    'reviewed': 'bg-indigo-100 text-indigo-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'deposit_paid': 'bg-yellow-100 text-yellow-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    // Payment statuses
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Format status for display (capitalize, replace underscores)
 */
export const formatStatus = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}; 