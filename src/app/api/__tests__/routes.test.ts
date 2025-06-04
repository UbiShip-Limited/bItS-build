import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock axios properly for route tests
const mockAxios = vi.hoisted(() => ({
  default: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}));

vi.mock('axios', () => mockAxios);

// Import route handlers after mocks are set up
import { POST as tattooRequestPOST, GET as tattooRequestGET } from '../tattoo-requests/route';
import { POST as appointmentPOST, GET as appointmentGET } from '../appointments/route';

// Test data
const mockTattooRequestData = {
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

const mockAppointmentData = {
  contactEmail: 'appointment@example.com',
  contactPhone: '+1234567890',
  startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  duration: 120,
  bookingType: 'consultation',
  note: 'Test appointment booking',
  isAnonymous: true
};

// Helper function to create mock NextRequest
function createMockRequest(method: string, url: string, body?: any): NextRequest {
  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return request;
}

describe('Next.js API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tattoo Requests API', () => {
    describe('POST /api/tattoo-requests', () => {
      it('should create a tattoo request successfully', async () => {
        // Mock successful axios response
        mockAxios.default.mockResolvedValueOnce({
          data: {
            id: 'test-id-123',
            contactEmail: 'test@example.com',
            status: 'new'
          },
          status: 200
        });

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/tattoo-requests',
          mockTattooRequestData
        );

        const response = await tattooRequestPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toBeDefined();
        expect(data.id).toBe('test-id-123');
      });

      it('should handle missing required fields', async () => {
        const { contactEmail, description, ...invalidData } = mockTattooRequestData;

        // Mock axios to throw an error for invalid data
        mockAxios.default.mockRejectedValueOnce({
          response: {
            status: 400,
            data: { error: 'Validation failed' }
          }
        });

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/tattoo-requests',
          invalidData
        );

        const response = await tattooRequestPOST(request);
        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/tattoo-requests', () => {
      it('should require authentication', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/tattoo-requests'
        );

        // Mock axios to return 401 for unauthenticated requests
        mockAxios.get.mockRejectedValueOnce({
          response: {
            status: 401,
            data: { error: 'Unauthorized' }
          }
        });

        const response = await tattooRequestGET(request);
        expect(response.status).toBe(401);
      });

      it('should forward query parameters correctly', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/tattoo-requests?status=new&page=1&limit=10'
        );

        mockAxios.get.mockResolvedValueOnce({
          data: {
            data: [],
            pagination: { total: 0, page: 1, limit: 10, pages: 0 }
          },
          status: 200
        });

        await tattooRequestGET(request);

        expect(mockAxios.get).toHaveBeenCalledWith(
          'http://localhost:3001/tattoo-requests?status=new&page=1&limit=10',
          expect.any(Object)
        );
      });
    });
  });

  describe('Appointments API', () => {
    describe('POST /api/appointments', () => {
      it('should create an anonymous appointment successfully', async () => {
        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/appointments',
          mockAppointmentData
        );

        mockAxios.default.mockResolvedValueOnce({
          data: {
            appointment: {
              id: 'appt-123',
              ...mockAppointmentData
            }
          },
          status: 200
        });

        const response = await appointmentPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.appointment).toBeDefined();
        expect(data.appointment.id).toBe('appt-123');
      });

      it('should validate appointment data', async () => {
        const invalidData = {
          contactEmail: 'invalid-email',
          startAt: 'invalid-date',
          duration: -1
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/appointments',
          invalidData
        );

        mockAxios.default.mockRejectedValueOnce({
          response: {
            status: 400,
            data: { error: 'Invalid appointment data' }
          }
        });

        const response = await appointmentPOST(request);
        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/appointments', () => {
      it('should require authentication', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/appointments'
        );

        mockAxios.get.mockRejectedValueOnce({
          response: {
            status: 401,
            data: { error: 'Unauthorized' }
          }
        });

        const response = await appointmentGET(request);
        expect(response.status).toBe(401);
      });

      it('should forward authorization headers', async () => {
        const request = new NextRequest('http://localhost:3000/api/appointments', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        });

        mockAxios.get.mockResolvedValueOnce({
          data: { data: [], pagination: {} },
          status: 200
        });

        await appointmentGET(request);

        expect(mockAxios.get).toHaveBeenCalledWith(
          'http://localhost:3001/appointments',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token'
            })
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/tattoo-requests',
        mockTattooRequestData
      );

      mockAxios.default.mockRejectedValueOnce(new Error('Network Error'));

      const response = await tattooRequestPOST(request);
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    it('should preserve backend error messages', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/tattoo-requests',
        mockTattooRequestData
      );

      mockAxios.default.mockRejectedValueOnce({
        response: {
          status: 422,
          data: { error: 'Validation failed: Email is required' }
        }
      });

      const response = await tattooRequestPOST(request);
      expect(response.status).toBe(422);
      
      const data = await response.json();
      expect(data.error).toBe('Validation failed: Email is required');
    });
  });

  describe('Request Proxy Behavior', () => {
    it('should proxy requests to correct backend URL', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/tattoo-requests',
        mockTattooRequestData
      );

      mockAxios.default.mockResolvedValueOnce({
        data: { id: 'test-123' },
        status: 200
      });

      await tattooRequestPOST(request);

      expect(mockAxios.default).toHaveBeenCalledWith(
        'http://localhost:3001/tattoo-requests',
        mockTattooRequestData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should forward authorization headers when present', async () => {
      const request = new NextRequest('http://localhost:3000/api/tattoo-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      mockAxios.get.mockResolvedValueOnce({
        data: [],
        status: 200
      });

      await tattooRequestGET(request);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:3001/tattoo-requests',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
  });
}); 