import { ApiClient } from '../apiClient';
import { Customer } from './customerService';
import { Artist } from '../../../app/data/artist-data';
import { TattooRequest } from './tattooRequestApiClient';

// Re-export for convenience
export { BookingType, BookingStatus } from '../../types/shared';

export interface AppointmentData {
  id: string;
  customerId?: string;
  artistId?: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string; // Will be BookingType but as string from API
  status: string; // Will be BookingStatus but as string from API
  notes?: string;
  priceQuote?: number;
  tattooRequestId?: string;
  squareId?: string;
  customer?: Customer;
  artist?: Artist;
  tattooRequest?: TattooRequest;
  // For anonymous bookings
  contactEmail?: string;
  contactPhone?: string;
}

export interface CreateAppointmentRequest {
  customerId?: string;
  artistId?: string;
  startAt: string;
  duration: number;
  bookingType: string;
  status?: string;
  note?: string;
  priceQuote?: number;
  tattooRequestId?: string;
  // For existing customers
  customerEmail?: string;
  customerPhone?: string;
  // For anonymous bookings
  contactEmail?: string;
  contactPhone?: string;
  isAnonymous?: boolean;
}

export interface UpdateAppointmentRequest {
  artistId?: string;
  startAt?: string;
  duration?: number;
  status?: string;
  note?: string;
  priceQuote?: number;
}

export interface AppointmentListResponse {
  data: AppointmentData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AppointmentFilters {
  status?: string;
  customerId?: string;
  artistId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/**
 * Frontend API Client for appointment operations
 * Handles HTTP communication with the backend API
 */
export class AppointmentApiClient {
  constructor(private apiClient: ApiClient) {}

  async getAppointments(filters?: AppointmentFilters): Promise<AppointmentListResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await this.apiClient.get(`/appointments?${params.toString()}`) as AppointmentListResponse;
    return response;
  }

  async getAppointment(id: string): Promise<AppointmentData> {
    const response = await this.apiClient.get(`/appointments/${id}`) as AppointmentData;
    return response;
  }

  async createAppointment(data: CreateAppointmentRequest): Promise<AppointmentData> {
    const response = await this.apiClient.post('/appointments', data) as { appointment: AppointmentData };
    return response.appointment;
  }

  // Create appointment for existing customer
  async createAppointmentForCustomer(data: {
    customerId: string;
    artistId?: string;
    startAt: string;
    duration: number;
    bookingType: string;
    status?: string;
    note?: string;
    priceQuote?: number;
    tattooRequestId?: string;
  }): Promise<AppointmentData> {
    return this.createAppointment(data);
  }

  // Create appointment with customer details (will create customer if needed)
  async createAppointmentWithCustomerDetails(data: {
    customerEmail: string;
    customerPhone?: string;
    artistId?: string;
    startAt: string;
    duration: number;
    bookingType: string;
    status?: string;
    note?: string;
    priceQuote?: number;
    tattooRequestId?: string;
  }): Promise<AppointmentData> {
    return this.createAppointment(data);
  }

  // Create anonymous appointment (for consultations)
  async createAnonymousAppointment(data: {
    contactEmail: string;
    contactPhone?: string;
    startAt: string;
    duration: number;
    bookingType: string; // 'consultation' | 'drawing_consultation'
    note?: string;
    tattooRequestId?: string;
  }): Promise<AppointmentData> {
    return this.createAppointment({
      ...data,
      isAnonymous: true
    });
  }

  async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<AppointmentData> {
    const response = await this.apiClient.put(`/appointments/${id}`, data) as { appointment: AppointmentData };
    return response.appointment;
  }

  async cancelAppointment(id: string, reason?: string): Promise<AppointmentData> {
    const response = await this.apiClient.post(`/appointments/${id}/cancel`, { reason }) as { appointment: AppointmentData };
    return response.appointment;
  }

  // Helper method to create appointment from tattoo request
  async createAppointmentFromTattooRequest(
    tattooRequestId: string,
    appointmentData: Omit<CreateAppointmentRequest, 'tattooRequestId'>
  ): Promise<AppointmentData> {
    return this.createAppointment({
      ...appointmentData,
      tattooRequestId
    });
  }

  // Helper method to create anonymous appointment from tattoo request
  async createAnonymousAppointmentFromTattooRequest(
    tattooRequestId: string,
    contactData: {
      contactEmail: string;
      contactPhone?: string;
      startAt: string;
      duration: number;
      bookingType: string; // 'consultation' | 'drawing_consultation'
      note?: string;
    }
  ): Promise<AppointmentData> {
    return this.createAnonymousAppointment({
      ...contactData,
      tattooRequestId
    });
  }
}

// Export with both names for backward compatibility during transition
export { AppointmentApiClient as AppointmentService }; 