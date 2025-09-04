import { useState, useCallback, useMemo } from 'react';
import {
  type AppointmentData,
  type CreateAppointmentRequest,
  type AppointmentListResponse,
  type AppointmentFilters,
  BookingType,
  BookingStatus
} from '../lib/api/services/appointmentApiClient';
import { appointmentService } from '../lib/api/services/index';

// Helper function to extract error message from unknown error
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
};

export interface UseAppointmentsReturn {
  appointments: AppointmentData[];
  appointment: AppointmentData | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
  getAppointments: (filters?: AppointmentFilters) => Promise<void>;
  getAppointment: (id: string) => Promise<void>;
  createAppointment: (data: CreateAppointmentRequest) => Promise<AppointmentData>;
  createAppointmentForCustomer: (data: {
    customerId: string;
    artistId?: string;
    startAt: string;
    duration: number;
    bookingType: BookingType;
    status?: BookingStatus;
    note?: string;
    priceQuote?: number;
    tattooRequestId?: string;
  }) => Promise<AppointmentData>;
  createAppointmentWithCustomerDetails: (data: {
    customerEmail: string;
    customerPhone?: string;
    artistId?: string;
    startAt: string;
    duration: number;
    bookingType: BookingType;
    status?: BookingStatus;
    note?: string;
    priceQuote?: number;
    tattooRequestId?: string;
  }) => Promise<AppointmentData>;
  createAnonymousAppointment: (data: {
    firstName?: string;
    contactEmail: string;
    contactPhone?: string;
    startAt: string;
    duration: number;
    bookingType: BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION;
    note?: string;
    tattooRequestId?: string;
  }) => Promise<AppointmentData>;
  updateAppointment: (id: string, data: Partial<CreateAppointmentRequest>) => Promise<AppointmentData>;
  cancelAppointment: (id: string, reason?: string) => Promise<AppointmentData>;
  createAppointmentFromTattooRequest: (tattooRequestId: string, appointmentData: Omit<CreateAppointmentRequest, 'tattooRequestId'>) => Promise<AppointmentData>;
  createAnonymousAppointmentFromTattooRequest: (tattooRequestId: string, contactData: {
    contactEmail: string;
    contactPhone?: string;
    startAt: string;
    duration: number;
    bookingType: BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION;
    note?: string;
  }) => Promise<AppointmentData>;
  // Cache management
  clearCache: () => void;
}

// Simple cache for appointment lists
const appointmentListCache = new Map<string, { 
  data: AppointmentListResponse; 
  timestamp: number; 
}>();
const CACHE_DURATION = 30000; // 30 seconds

export const useAppointments = (): UseAppointmentsReturn => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null>(null);

  const clearCache = useCallback(() => {
    appointmentListCache.clear();
    console.log('🧹 Cleared appointment cache');
  }, []);

  const getAppointments = useCallback(async (filters?: AppointmentFilters) => {
    // Create cache key from filters
    const cacheKey = filters ? JSON.stringify(filters) : 'default';
    const cached = appointmentListCache.get(cacheKey);
    const now = Date.now();
    
    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📝 Using cached appointments');
      setAppointments(cached.data.data);
      setPagination(cached.data.pagination);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response: AppointmentListResponse = await appointmentService.getAppointments(filters);
      
      // Cache the result
      appointmentListCache.set(cacheKey, {
        data: response,
        timestamp: now
      });
      
      setAppointments(response.data);
      setPagination(response.pagination);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to fetch appointments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAppointment = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const appointmentData = await appointmentService.getAppointment(id);
      setAppointment(appointmentData);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to fetch appointment');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAppointment = useCallback(async (data: CreateAppointmentRequest): Promise<AppointmentData> => {
    setIsLoading(true);
    setError(null);
    try {
      const newAppointment = await appointmentService.createAppointment(data);
      setAppointments(prev => [newAppointment, ...prev]);
      // Clear cache as data is now stale
      clearCache();
      return newAppointment;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to create appointment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearCache]);

  const createAppointmentForCustomer = useCallback(async (data: {
    customerId: string;
    artistId?: string;
    startAt: string;
    duration: number;
    bookingType: BookingType;
    status?: BookingStatus;
    note?: string;
    priceQuote?: number;
    tattooRequestId?: string;
  }): Promise<AppointmentData> => {
    return createAppointment({
      ...data,
      bookingType: data.bookingType as string,
      status: data.status as string,
    });
  }, [createAppointment]);

  const createAppointmentWithCustomerDetails = useCallback(async (data: {
    customerEmail: string;
    customerPhone?: string;
    artistId?: string;
    startAt: string;
    duration: number;
    bookingType: BookingType;
    status?: BookingStatus;
    note?: string;
    priceQuote?: number;
    tattooRequestId?: string;
  }): Promise<AppointmentData> => {
    return createAppointment({
      ...data,
      bookingType: data.bookingType as string,
      status: data.status as string,
    });
  }, [createAppointment]);

  const createAnonymousAppointment = useCallback(async (data: {
    firstName?: string;
    contactEmail: string;
    contactPhone?: string;
    startAt: string;
    duration: number;
    bookingType: BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION;
    note?: string;
    tattooRequestId?: string;
  }): Promise<AppointmentData> => {
    return appointmentService.createAnonymousAppointment({
      ...data,
      bookingType: data.bookingType as string,
    });
  }, []);

  const updateAppointment = useCallback(async (id: string, data: Partial<CreateAppointmentRequest>): Promise<AppointmentData> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedAppointment = await appointmentService.updateAppointment(id, data);
      
      // Update in current list if present
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? updatedAppointment : apt)
      );
      
      // Update single appointment if it's the current one
      if (appointment?.id === id) {
        setAppointment(updatedAppointment);
      }
      
      // Clear cache as data is now stale
      clearCache();
      
      return updatedAppointment;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to update appointment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appointment, clearCache]);

  const cancelAppointment = useCallback(async (id: string, reason?: string): Promise<AppointmentData> => {
    setIsLoading(true);
    setError(null);
    try {
      const cancelledAppointment = await appointmentService.cancelAppointment(id, reason);
      
      // Update in current list
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? cancelledAppointment : apt)
      );
      
      // Update single appointment if it's the current one
      if (appointment?.id === id) {
        setAppointment(cancelledAppointment);
      }
      
      // Clear cache as data is now stale
      clearCache();
      
      return cancelledAppointment;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to cancel appointment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appointment, clearCache]);

  const createAppointmentFromTattooRequest = useCallback(async (
    tattooRequestId: string,
    appointmentData: Omit<CreateAppointmentRequest, 'tattooRequestId'>
  ): Promise<AppointmentData> => {
    return createAppointment({
      ...appointmentData,
      tattooRequestId
    });
  }, [createAppointment]);

  const createAnonymousAppointmentFromTattooRequest = useCallback(async (
    tattooRequestId: string,
    contactData: {
      contactEmail: string;
      contactPhone?: string;
      startAt: string;
      duration: number;
      bookingType: BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION;
      note?: string;
    }
  ): Promise<AppointmentData> => {
    setIsLoading(true);
    setError(null);
    try {
      const newAppointment = await appointmentService.createAnonymousAppointmentFromTattooRequest(
        tattooRequestId,
        contactData
      );
      setAppointments(prev => [newAppointment, ...prev]);
      clearCache();
      return newAppointment;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to create anonymous appointment from tattoo request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearCache]);

  return {
    appointments,
    appointment,
    isLoading,
    error,
    pagination,
    getAppointments,
    getAppointment,
    createAppointment,
    createAppointmentForCustomer,
    createAppointmentWithCustomerDetails,
    createAnonymousAppointment,
    updateAppointment,
    cancelAppointment,
    createAppointmentFromTattooRequest,
    createAnonymousAppointmentFromTattooRequest,
    clearCache
  };
}; 