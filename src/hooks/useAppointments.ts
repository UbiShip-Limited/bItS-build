import { useState, useEffect } from 'react';
import { 
  AppointmentService, 
  AppointmentData, 
  CreateAppointmentRequest, 
  AppointmentFilters, 
  AppointmentListResponse,
  BookingType,
  BookingStatus 
} from '../lib/api/services/appointmentService';
import { apiClient } from '../lib/api/apiClient';

const appointmentService = new AppointmentService(apiClient);

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
  createAnonymousAppointmentFromTattooRequest: (
    tattooRequestId: string,
    contactData: {
      contactEmail: string;
      contactPhone?: string;
      startAt: string;
      duration: number;
      bookingType: BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION;
      note?: string;
    }
  ) => Promise<AppointmentData>;
}

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

  const getAppointments = async (filters?: AppointmentFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: AppointmentListResponse = await appointmentService.getAppointments(filters);
      setAppointments(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const getAppointment = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const appointmentData = await appointmentService.getAppointment(id);
      setAppointment(appointmentData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointment = async (data: CreateAppointmentRequest): Promise<AppointmentData> => {
    setIsLoading(true);
    setError(null);
    try {
      const newAppointment = await appointmentService.createAppointment(data);
      setAppointments(prev => [newAppointment, ...prev]);
      return newAppointment;
    } catch (err: any) {
      setError(err.message || 'Failed to create appointment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointmentForCustomer = async (data: {
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
    setIsLoading(true);
    setError(null);
    try {
      const newAppointment = await appointmentService.createAppointmentForCustomer(data);
      setAppointments(prev => [newAppointment, ...prev]);
      return newAppointment;
    } catch (err: any) {
      setError(err.message || 'Failed to create appointment for customer');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointmentWithCustomerDetails = async (data: {
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
    setIsLoading(true);
    setError(null);
    try {
      const newAppointment = await appointmentService.createAppointmentWithCustomerDetails(data);
      setAppointments(prev => [newAppointment, ...prev]);
      return newAppointment;
    } catch (err: any) {
      setError(err.message || 'Failed to create appointment with customer details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAnonymousAppointment = async (data: {
    contactEmail: string;
    contactPhone?: string;
    startAt: string;
    duration: number;
    bookingType: BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION;
    note?: string;
    tattooRequestId?: string;
  }): Promise<AppointmentData> => {
    setIsLoading(true);
    setError(null);
    try {
      const newAppointment = await appointmentService.createAnonymousAppointment(data);
      setAppointments(prev => [newAppointment, ...prev]);
      return newAppointment;
    } catch (err: any) {
      setError(err.message || 'Failed to create anonymous appointment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointment = async (id: string, data: Partial<CreateAppointmentRequest>): Promise<AppointmentData> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedAppointment = await appointmentService.updateAppointment(id, data);
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? updatedAppointment : apt)
      );
      if (appointment?.id === id) {
        setAppointment(updatedAppointment);
      }
      return updatedAppointment;
    } catch (err: any) {
      setError(err.message || 'Failed to update appointment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAppointment = async (id: string, reason?: string): Promise<AppointmentData> => {
    setIsLoading(true);
    setError(null);
    try {
      const cancelledAppointment = await appointmentService.cancelAppointment(id, reason);
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? cancelledAppointment : apt)
      );
      if (appointment?.id === id) {
        setAppointment(cancelledAppointment);
      }
      return cancelledAppointment;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointmentFromTattooRequest = async (
    tattooRequestId: string, 
    appointmentData: Omit<CreateAppointmentRequest, 'tattooRequestId'>
  ): Promise<AppointmentData> => {
    setIsLoading(true);
    setError(null);
    try {
      const newAppointment = await appointmentService.createAppointmentFromTattooRequest(
        tattooRequestId, 
        appointmentData
      );
      setAppointments(prev => [newAppointment, ...prev]);
      return newAppointment;
    } catch (err: any) {
      setError(err.message || 'Failed to create appointment from tattoo request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAnonymousAppointmentFromTattooRequest = async (
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
      return newAppointment;
    } catch (err: any) {
      setError(err.message || 'Failed to create anonymous appointment from tattoo request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

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
    createAnonymousAppointmentFromTattooRequest
  };
}; 