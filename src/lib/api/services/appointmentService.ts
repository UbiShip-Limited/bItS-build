import { ApiClient } from '../apiClient';

// Enums to match backend
export enum BookingType {
  CONSULTATION = 'consultation',
  DRAWING_CONSULTATION = 'drawing_consultation',
  TATTOO_SESSION = 'tattoo_session'
}

export enum BookingStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export interface AppointmentData {
  id: string;
  customerId?: string;
  artistId?: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: BookingType;
  status: BookingStatus;
  notes?: string;
  priceQuote?: number;
  tattooRequestId?: string;
  squareId?: string;
  customer?: any;
  artist?: any;
  tattooRequest?: any;
  // For anonymous bookings
  contactEmail?: string;
  contactPhone?: string;
}

export interface CreateAppointmentRequest {
  customerId?: string;
  artistId?: string;
  startAt: string;
  duration: number;
  bookingType: BookingType;
  status?: BookingStatus;
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
  status?: BookingStatus;
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
  status?: BookingStatus;
  customerId?: string;
  artistId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export class AppointmentService {
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

    const response = await this.apiClient.get(`/appointments?${params.toString()}`) as { data: AppointmentListResponse };
    return response.data;
  }

  async getAppointment(id: string): Promise<AppointmentData> {
    const response = await this.apiClient.get(`/appointments/${id}`) as { data: AppointmentData };
    return response.data;
  }

  async createAppointment(data: CreateAppointmentRequest): Promise<AppointmentData> {
    const response = await this.apiClient.post('/appointments', data) as { data: AppointmentData };
    return response.data;
  }

  // Create appointment for existing customer
  async createAppointmentForCustomer(data: {
    customerId: string;
    artistId?: string;
    startAt: string;
    duration: number;
    bookingType: BookingType;
    status?: BookingStatus;
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
    bookingType: BookingType;
    status?: BookingStatus;
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
    bookingType: BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION;
    note?: string;
    tattooRequestId?: string;
  }): Promise<AppointmentData> {
    return this.createAppointment({
      ...data,
      isAnonymous: true
    });
  }

  async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<AppointmentData> {
    const response = await this.apiClient.put(`/appointments/${id}`, data) as { data: AppointmentData };
    return response.data;
  }

  async cancelAppointment(id: string, reason?: string): Promise<AppointmentData> {
    const response = await this.apiClient.post(`/appointments/${id}/cancel`, { reason }) as { data: AppointmentData };
    return response.data;
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
      bookingType: BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION;
      note?: string;
    }
  ): Promise<AppointmentData> {
    return this.createAnonymousAppointment({
      ...contactData,
      tattooRequestId
    });
  }
} 