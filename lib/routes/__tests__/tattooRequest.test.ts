import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import tattooRequestsRoutes from '../tattooRequest';
import { TattooRequestService } from '../../services/tattooRequestService'; // Backend service
import BookingService, { BookingType, BookingStatus } from '../../services/bookingService';
import { ValidationError, NotFoundError } from '../../services/errors';

// Mock dependencies
vi.mock('../../services/tattooRequestService'); // Backend service
vi.mock('../../services/bookingService');

describe('TattooRequest Routes - Production Workflow', () => {
  let app: FastifyInstance;
  let mockTattooRequestService: any;
  let mockBookingService: any;

  // Sample business data
  const mockAnonymousRequest = {
    id: 'req-123',
    description: 'Traditional dragon tattoo on upper arm',
    contactEmail: 'user@example.com',
    contactPhone: '+1234567890',
    placement: 'Upper arm',
    size: 'Medium',
    status: 'new',
    trackingToken: 'track-abc123',
    customerId: null,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    referenceImages: [],
    customer: null
  };

  const mockAuthenticatedRequest = {
    ...mockAnonymousRequest,
    id: 'req-456',
    customerId: 'customer-123',
    trackingToken: null,
    customer: {
      id: 'customer-123',
      name: 'John Doe',
      email: 'john@example.com'
    }
  };

  const mockAppointment = {
    id: 'appointment-123',
    startTime: new Date('2024-01-20T10:00:00Z'),
    duration: 120,
    status: 'confirmed',
    customerId: 'customer-123'
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create fresh Fastify instance
    app = Fastify({ logger: false });

    // Mock service instances
    mockTattooRequestService = {
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      convertToAppointment: vi.fn()
    };

    mockBookingService = {
      createBooking: vi.fn()
    };

    // Mock constructors to return our mocks
    vi.mocked(TattooRequestService).mockImplementation(() => mockTattooRequestService);
    vi.mocked(BookingService).mockImplementation(() => mockBookingService);

    // Register the routes with the proper prefix
    await app.register(tattooRequestsRoutes, { prefix: '/tattoo-requests' });
  });

  afterEach(async () => {
    await app.close();
    vi.resetAllMocks();
  });

  describe('Business Workflow: Anonymous User Submits Request', () => {
    it('should allow anonymous user to submit tattoo request', async () => {
      mockTattooRequestService.create.mockResolvedValueOnce(mockAnonymousRequest);

      const requestData = {
        description: 'Traditional dragon tattoo on upper arm',
        contactEmail: 'user@example.com',
        contactPhone: '+1234567890',
        placement: 'Upper arm',
        size: 'Medium',
        style: 'Traditional',
        colorPreference: 'Black and gray'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('req-123');
      expect(body.status).toBe('new');
      expect(body.trackingToken).toBe('track-abc123');
      
      expect(mockTattooRequestService.create).toHaveBeenCalledWith(
        requestData,
        undefined // No user ID for anonymous request
      );
    });

    it('should allow authenticated user to submit tattoo request', async () => {
      mockTattooRequestService.create.mockResolvedValueOnce(mockAuthenticatedRequest);

      const requestData = {
        description: 'Traditional dragon tattoo on upper arm',
        customerId: 'customer-123',
        placement: 'Upper arm',
        size: 'Medium'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.customerId).toBe('customer-123');
      expect(body.trackingToken).toBeNull();
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests',
        payload: {
          description: 'Too short' // Less than 10 characters
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Business Workflow: Admin Dashboard Management', () => {
    it('should list tattoo requests for admin dashboard', async () => {
      mockTattooRequestService.list.mockResolvedValueOnce({
        data: [mockAnonymousRequest, mockAuthenticatedRequest],
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: '/tattoo-requests'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(2);
      
      expect(mockTattooRequestService.list).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        limit: 20
      });
    });

    it('should filter requests by status', async () => {
      mockTattooRequestService.list.mockResolvedValueOnce({
        data: [mockAnonymousRequest],
        pagination: { total: 1, page: 1, limit: 20, pages: 1 }
      });

      const response = await app.inject({
        method: 'GET',
        url: '/tattoo-requests?status=new'
      });

      expect(response.statusCode).toBe(200);
      expect(mockTattooRequestService.list).toHaveBeenCalledWith({
        status: 'new',
        page: 1,
        limit: 20
      });
    });

    it('should get individual tattoo request details', async () => {
      mockTattooRequestService.findById.mockResolvedValueOnce(mockAnonymousRequest);

      const response = await app.inject({
        method: 'GET',
        url: '/tattoo-requests/req-123'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('req-123');
      
      expect(mockTattooRequestService.findById).toHaveBeenCalledWith('req-123');
    });
  });

  describe('Business Workflow: Admin Status Management', () => {
    it('should allow admin to approve tattoo request', async () => {
      const approvedRequest = { ...mockAnonymousRequest, status: 'approved' };
      mockTattooRequestService.updateStatus.mockResolvedValueOnce(approvedRequest);

      const response = await app.inject({
        method: 'PUT',
        url: '/tattoo-requests/req-123/status',
        payload: { status: 'approved' }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('approved');
      
      expect(mockTattooRequestService.updateStatus).toHaveBeenCalledWith(
        'req-123',
        'approved',
        undefined // Auth middleware not setting user in test
      );
    });

    it('should allow admin to reject tattoo request', async () => {
      const rejectedRequest = { ...mockAnonymousRequest, status: 'rejected' };
      mockTattooRequestService.updateStatus.mockResolvedValueOnce(rejectedRequest);

      const response = await app.inject({
        method: 'PUT',
        url: '/tattoo-requests/req-123/status',
        payload: { status: 'rejected' }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('rejected');
    });

    it('should validate status values', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/tattoo-requests/req-123/status',
        payload: { status: 'invalid_status' }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Business Workflow: Convert to Appointment (Core Integration)', () => {
    it('should convert approved tattoo request to appointment', async () => {
      const conversionResult = {
        success: true,
        message: 'Tattoo request successfully converted to appointment',
        appointment: mockAppointment,
        customer: 'customer-123',
        tattooRequest: { ...mockAnonymousRequest, status: 'converted_to_appointment' }
      };

      mockTattooRequestService.convertToAppointment.mockResolvedValueOnce(conversionResult);

      const appointmentData = {
        startAt: '2024-01-20T10:00:00Z',
        duration: 120,
        artistId: 'artist-123',
        bookingType: BookingType.TATTOO_SESSION,
        priceQuote: 300
      };

      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests/req-123/convert-to-appointment',
        payload: appointmentData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.appointment.id).toBe('appointment-123');
      expect(body.tattooRequest.status).toBe('converted_to_appointment');
      
      expect(mockTattooRequestService.convertToAppointment).toHaveBeenCalledWith(
        'req-123',
        {
          startAt: new Date('2024-01-20T10:00:00Z'),
          duration: 120,
          artistId: 'artist-123',
          bookingType: BookingType.TATTOO_SESSION,
          priceQuote: 300,
          note: undefined
        },
        undefined // Auth middleware not setting user in test
      );
    });

    it('should use default values for conversion', async () => {
      const conversionResult = { success: true, appointment: mockAppointment };
      mockTattooRequestService.convertToAppointment.mockResolvedValueOnce(conversionResult);

      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests/req-123/convert-to-appointment',
        payload: {
          startAt: '2024-01-20T10:00:00Z',
          duration: 60
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockTattooRequestService.convertToAppointment).toHaveBeenCalledWith(
        'req-123',
        {
          startAt: new Date('2024-01-20T10:00:00Z'),
          duration: 60,
          artistId: undefined, // Should default to current user (undefined in test)
          bookingType: BookingType.TATTOO_SESSION, // Default booking type
          priceQuote: undefined,
          note: undefined
        },
        undefined // Auth middleware not setting user in test
      );
    });

    it('should validate required conversion fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests/req-123/convert-to-appointment',
        payload: {
          duration: 60
          // Missing required startAt
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Business Workflow: Image Upload Support', () => {
    it('should handle image upload for tattoo requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests/upload-images',
        headers: {
          'content-type': 'multipart/form-data; boundary=----formdata'
        },
        payload: [
          '------formdata',
          'Content-Disposition: form-data; name="file"; filename="reference.jpg"',
          'Content-Type: image/jpeg',
          '',
          'fake image data',
          '------formdata--'
        ].join('\r\n')
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.images).toBeDefined();
      expect(Array.isArray(body.images)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle service validation errors', async () => {
      mockTattooRequestService.create.mockRejectedValueOnce(
        new ValidationError('Either customer ID or contact email is required')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests',
        payload: { description: 'Test description' }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle not found errors', async () => {
      mockTattooRequestService.findById.mockRejectedValueOnce(
        new NotFoundError('TattooRequest', 'non-existent')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/tattoo-requests/non-existent'
      });

      expect(response.statusCode).toBe(404);
    });
  });
}); 