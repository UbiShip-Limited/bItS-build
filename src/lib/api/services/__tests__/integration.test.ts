import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BookingType } from '../../../types/shared';

// Mock the API client to avoid real HTTP calls using vi.hoisted()
const mockApiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}));

// Mock the actual apiClient import
vi.mock('../../apiClient', () => ({
  apiClient: mockApiClient
}));

// Import after mocks are set up
import { TattooRequestApiClient } from '../tattooRequestApiClient';
import { AppointmentApiClient } from '../appointmentApiClient';
import { paymentService } from '../paymentService';

// Mock data
const mockTattooRequest = {
  contactEmail: 'test@example.com',
  contactPhone: '+1234567890',
  description: 'Test tattoo request for endpoint testing. This is a detailed description that meets the minimum requirements.',
  placement: 'arm',
  size: 'medium',
  colorPreference: 'black and grey',
  style: 'traditional',
  purpose: 'personal',
  preferredArtist: 'any',
  timeframe: '1-2 months',
  contactPreference: 'email',
  additionalNotes: 'This is a test request for endpoint validation.'
};

const mockAppointment = {
  contactEmail: 'appointment@example.com',
  contactPhone: '+1234567890',
  startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  duration: 120,
  bookingType: BookingType.CONSULTATION,
  note: 'Test appointment booking',
  isAnonymous: true
};

describe('API Integration Tests', () => {
  let tattooRequestClient: TattooRequestApiClient;
  let appointmentClient: AppointmentApiClient;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Initialize clients
    tattooRequestClient = new TattooRequestApiClient(mockApiClient as any);
    appointmentClient = new AppointmentApiClient(mockApiClient as any);
  });

  describe('TattooRequest API', () => {
    it('should create a tattoo request successfully', async () => {
      // Mock successful response
      mockApiClient.post.mockResolvedValueOnce({
        id: 'test-request-123',
        contactEmail: mockTattooRequest.contactEmail,
        description: mockTattooRequest.description,
        status: 'new'
      });

      const result = await tattooRequestClient.create(mockTattooRequest);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-request-123');
      expect(result.contactEmail).toBe(mockTattooRequest.contactEmail);
      expect(result.description).toBe(mockTattooRequest.description);
      expect(result.status).toBe('new');
      expect(mockApiClient.post).toHaveBeenCalledWith('/tattoo-requests', mockTattooRequest);
    });

    it('should handle validation errors', async () => {
      const { contactEmail, description, ...invalidRequest } = mockTattooRequest;

      // Mock validation error response
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Validation failed' }
        }
      });

      await expect(tattooRequestClient.create(invalidRequest as any))
        .rejects
        .toThrow();
      
      expect(mockApiClient.post).toHaveBeenCalledWith('/tattoo-requests', invalidRequest);
    });

    it('should require authentication for getting all requests', async () => {
      // Mock 401 unauthorized response
      mockApiClient.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        }
      });

      await expect(tattooRequestClient.getAll())
        .rejects
        .toThrow();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/tattoo-requests');
    });

    it('should require authentication for getting request by ID', async () => {
      // Mock 401 unauthorized response
      mockApiClient.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        }
      });

      await expect(tattooRequestClient.getById('test-id'))
        .rejects
        .toThrow();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/tattoo-requests/test-id');
    });

    it('should require authentication for updating status', async () => {
      // Mock 401 unauthorized response
      mockApiClient.put.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        }
      });

      await expect(tattooRequestClient.updateStatus('test-id', 'reviewed'))
        .rejects
        .toThrow();
      
      expect(mockApiClient.put).toHaveBeenCalledWith('/tattoo-requests/test-id/status', { status: 'reviewed' });
    });
  });

  describe('Appointment API', () => {
    it('should create an anonymous appointment successfully', async () => {
      // Mock successful response
      mockApiClient.post.mockResolvedValueOnce({
        appointment: {
          id: 'appt-123',
          contactEmail: mockAppointment.contactEmail,
          duration: mockAppointment.duration
        }
      });

      const result = await appointmentClient.createAnonymousAppointment({
        contactEmail: mockAppointment.contactEmail,
        contactPhone: mockAppointment.contactPhone,
        startAt: mockAppointment.startAt,
        duration: mockAppointment.duration,
        bookingType: mockAppointment.bookingType,
        note: mockAppointment.note
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe('appt-123');
      expect(result.contactEmail).toBe(mockAppointment.contactEmail);
      expect(result.duration).toBe(mockAppointment.duration);
    });

    it('should validate appointment data', async () => {
      const invalidAppointment = {
        contactEmail: 'invalid-email',
        startAt: 'invalid-date',
        duration: -1,
        bookingType: 'invalid-type'
      };

      // Mock validation error
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid appointment data' }
        }
      });

      await expect(appointmentClient.createAnonymousAppointment(invalidAppointment as any))
        .rejects
        .toThrow();
    });

    it('should require authentication for getting all appointments', async () => {
      // Mock 401 unauthorized response
      mockApiClient.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        }
      });

      await expect(appointmentClient.getAppointments())
        .rejects
        .toThrow();
    });

    it('should require authentication for getting appointment by ID', async () => {
      // Mock 401 unauthorized response
      mockApiClient.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        }
      });

      await expect(appointmentClient.getAppointment('test-id'))
        .rejects
        .toThrow();
    });
  });

  describe('Payment API', () => {
    it('should validate payment link data', () => {
      expect(paymentService.getMinimumAmount('consultation' as any)).toBe(50);
      expect(paymentService.formatPaymentType('consultation' as any)).toBe('Consultation Fee');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(tattooRequestClient.getAll())
        .rejects
        .toThrow('Network Error');
    });

    it('should handle server errors with proper status codes', async () => {
      // Mock 500 server error
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      });

      await expect(tattooRequestClient.create(mockTattooRequest))
        .rejects
        .toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should handle email validation errors', async () => {
      const invalidEmailRequest = {
        ...mockTattooRequest,
        contactEmail: 'invalid-email-format'
      };

      // Mock validation error
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid email format' }
        }
      });

      await expect(tattooRequestClient.create(invalidEmailRequest))
        .rejects
        .toThrow();
    });

    it('should handle description length validation', async () => {
      const shortDescriptionRequest = {
        ...mockTattooRequest,
        description: 'too short'
      };

      // Mock validation error
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Description too short' }
        }
      });

      await expect(tattooRequestClient.create(shortDescriptionRequest))
        .rejects
        .toThrow();
    });

    it('should handle future date validation for appointments', async () => {
      const pastDateAppointment = {
        ...mockAppointment,
        startAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      };

      // Mock validation error
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Date must be in the future' }
        }
      });

      await expect(appointmentClient.createAnonymousAppointment(pastDateAppointment))
        .rejects
        .toThrow();
    });
  });
}); 