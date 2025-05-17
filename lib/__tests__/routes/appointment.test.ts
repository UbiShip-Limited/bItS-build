process.env.NODE_ENV = 'test';

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, dateToISOStrings } from '../test-helpers';
import supertest from 'supertest';

// Type guard for mocked functions
const isMockFunction = (fn: any): fn is jest.Mock => 
  fn && typeof fn === 'function' && typeof fn.mockReset === 'function';

// Mock data
const mockAppointments = [
  {
    id: '1',
    customerId: 'customer1',
    artistId: 'artist1',
    date: new Date('2023-08-15T14:00:00Z'),
    duration: 120,
    status: 'confirmed',
    notes: 'First session for dragon tattoo',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    artist: {
      id: 'artist1',
      email: 'artist@example.com',
      role: 'artist'
    }
  },
  {
    id: '2',
    customerId: 'customer2',
    artistId: 'artist1',
    date: new Date('2023-08-20T10:00:00Z'),
    duration: 60,
    status: 'pending',
    notes: 'Consultation for flower tattoo',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-5678',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    artist: {
      id: 'artist1',
      email: 'artist@example.com',
      role: 'artist'
    }
  }
];

const mockAppointmentWithDateStrings = mockAppointments.map(app => dateToISOStrings(app));

// Mock JWT token and user
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'artist1',
  email: 'artist@example.com',
  role: 'artist'
};

describe('Appointment Routes', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  
  beforeEach(async () => {
    // Setup test app and get supertest instance
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Reset mocks AND provide default implementations
    // This is crucial to make the tests work
    if (isMockFunction(mockPrismaClient.appointment.findMany)) {
      mockPrismaClient.appointment.findMany.mockReset();
      mockPrismaClient.appointment.findMany.mockResolvedValue(mockAppointments);
      
      mockPrismaClient.appointment.count.mockReset();
      mockPrismaClient.appointment.count.mockResolvedValue(mockAppointments.length);
      
      mockPrismaClient.appointment.findUnique.mockReset();
      mockPrismaClient.appointment.findUnique.mockImplementation(({ where }) => {
        const appointment = mockAppointments.find(a => a.id === where.id);
        return Promise.resolve(appointment || null);
      });
      
      mockPrismaClient.appointment.create.mockReset();
      mockPrismaClient.appointment.create.mockImplementation(({ data }) => {
        const newAppointment = {
          id: '3',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: data.customerId,
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '555-0000',
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
        return Promise.resolve(newAppointment);
      });
      
      mockPrismaClient.appointment.update.mockReset();
      mockPrismaClient.appointment.update.mockImplementation(({ where, data }) => {
        const appointment = mockAppointments.find(a => a.id === where.id);
        if (!appointment) return Promise.resolve(null);
        return Promise.resolve({ ...appointment, ...data });
      });
      
      mockPrismaClient.auditLog.create.mockReset();
      mockPrismaClient.auditLog.create.mockResolvedValue({ id: 'audit1' });
    }
    
    // Setup mock for user auth check - always needs to be defined
    mockPrismaClient.user.findUnique.mockReset();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role
    });

    // For debugging
    console.log('Mocks setup complete');
  });
  
  afterEach(async () => {
    await testApp.teardown();
  });
  
  describe('GET /appointments', () => {
    it('should return a paginated list of appointments', async () => {
      // Check what the endpoint actually returns
      const response = await authRequest
        .get('/appointments')
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Compare with the structure received rather than expected
      expect(response.body.data).toEqual(mockAppointmentWithDateStrings);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });
    
    it('should filter by status', async () => {
      // Set up specific mock for this test
      mockPrismaClient.appointment.findMany.mockResolvedValue([mockAppointments[1]]);
      mockPrismaClient.appointment.count.mockResolvedValue(1);
      
      await authRequest
        .get('/appointments?status=pending')
        .expect(200);
      
      expect(mockPrismaClient.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ 
            status: 'pending' 
          })
        })
      );
    });
    
    it('should handle date range filtering', async () => {
      const from = '2023-08-01T00:00:00Z';
      const to = '2023-08-31T23:59:59Z';
      
      await authRequest
        .get(`/appointments?from=${from}&to=${to}`)
        .expect(200);
      
      expect(mockPrismaClient.appointment.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /appointments/:id', () => {
    it('should return a single appointment', async () => {
      // Force the mock to return the appointment
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointments[0]);
      
      const response = await authRequest
        .get('/appointments/1')
        .expect(200);
      
      expect(response.body).toEqual(mockAppointmentWithDateStrings[0]);
    });
    
    it('should return 404 if appointment not found', async () => {
      // Force the mock to return null
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);
      
      await authRequest
        .get('/appointments/999')
        .expect(404)
        .expect({ error: 'Appointment not found' });
    });
  });

  describe('POST /appointments', () => {
    it('should create a new appointment', async () => {
      const newAppointment = {
        customerId: 'customer3',
        artistId: 'artist1',
        date: '2023-09-01T15:00:00Z',
        duration: 90,
        notes: 'New small tattoo'
      };
      
      const createdAppointment = {
        id: '3',
        ...newAppointment,
        date: new Date(newAppointment.date),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'customer3',
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '555-0000',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      // Force the mock to return the created appointment
      mockPrismaClient.appointment.create.mockResolvedValue(createdAppointment);
      
      await authRequest
        .post('/appointments')
        .send(newAppointment)
        .expect(200);
      
      expect(mockPrismaClient.appointment.create).toHaveBeenCalled();
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
    });
    
    it('should validate required fields', async () => {
      await authRequest
        .post('/appointments')
        .send({ customerId: 'customer3' }) // Missing other required fields
        .expect(400);
    });
  });

  describe('PUT /appointments/:id', () => {
    it('should update an appointment', async () => {
      const updateData = {
        status: 'confirmed',
        notes: 'Updated notes'
      };
      
      const updatedAppointment = {
        ...mockAppointments[0],
        ...updateData
      };
      
      // First call to findUnique needs to return the appointment
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointments[0]);
      // Then update needs to return the updated appointment
      mockPrismaClient.appointment.update.mockResolvedValue(updatedAppointment);
      
      await authRequest
        .put('/appointments/1')
        .send(updateData)
        .expect(200);
      
      expect(mockPrismaClient.appointment.update).toHaveBeenCalled();
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
    });
    
    it('should return 404 if appointment not found', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);
      
      await authRequest
        .put('/appointments/999')
        .send({ status: 'confirmed' })
        .expect(404);
    });
  });

  describe('DELETE /appointments/:id', () => {
    it('should cancel an appointment', async () => {
      const canceledAppointment = {
        ...mockAppointments[0],
        status: 'canceled'
      };
      
      // First call to findUnique needs to return the appointment
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointments[0]);
      // Then update needs to return the canceled appointment
      mockPrismaClient.appointment.update.mockResolvedValue(canceledAppointment);
      
      await authRequest
        .delete('/appointments/1')
        .expect(200);
      
      expect(mockPrismaClient.appointment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'canceled' }
      });
    });
    
    it('should return 404 if appointment not found', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);
      
      await authRequest
        .delete('/appointments/999')
        .expect(404);
    });
  });
});