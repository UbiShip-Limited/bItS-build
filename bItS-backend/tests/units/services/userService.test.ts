import { PrismaClient, User } from '@prisma/client';
import { UserService } from '../../../src/services/userService';
import { Role } from '../../../src/types/user';

// Mock Prisma client
jest.mock('../../../src/db/prismaClient', () => {
  return {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };
});

// Import the mocked prisma client
import prisma from '../../../src/db/prismaClient';

describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    userService = new UserService();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  describe('findById', () => {
    it('should find a user by ID', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com', role: Role.USER } as User;
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const result = await userService.findById('user123');
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' }
      });
      expect(result).toEqual(mockUser);
    });
    
    it('should return null if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      const result = await userService.findById('nonexistent');
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' }
      });
      expect(result).toBeNull();
    });
  });
  
  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com', role: Role.USER } as User;
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const result = await userService.findByEmail('test@example.com');
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(result).toEqual(mockUser);
    });
  });
  
  describe('upsertUser', () => {
    it('should create a new user if not exists', async () => {
      const userData = { id: 'new-user', email: 'new@example.com' };
      const mockCreatedUser = { 
        ...userData, 
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockCreatedUser);
      
      const result = await userService.upsertUser(userData);
      
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { id: userData.id },
        update: { email: userData.email },
        create: {
          id: userData.id,
          email: userData.email,
          role: Role.USER
        }
      });
      expect(result).toEqual(mockCreatedUser);
    });
    
    it('should update an existing user', async () => {
      const userData = { id: 'existing-user', email: 'updated@example.com' };
      const mockUpdatedUser = { 
        ...userData, 
        role: Role.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUpdatedUser);
      
      const result = await userService.upsertUser(userData);
      
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { id: userData.id },
        update: { email: userData.email },
        create: {
          id: userData.id,
          email: userData.email,
          role: Role.USER
        }
      });
      expect(result).toEqual(mockUpdatedUser);
    });
  });
  
  describe('makeAdmin', () => {
    it('should update user role to ADMIN', async () => {
      const userId = 'user123';
      const mockUpdatedUser = { 
        id: userId,
        email: 'test@example.com',
        role: Role.ADMIN,
        updatedAt: new Date()
      };
      
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);
      
      const result = await userService.makeAdmin(userId);
      
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role: Role.ADMIN }
      });
      expect(result).toEqual(mockUpdatedUser);
    });
  });
  
  describe('isUserAdmin', () => {
    it('should return true if user has ADMIN role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.ADMIN });
      
      const result = await userService.isUserAdmin('admin-user');
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-user' },
        select: { role: true }
      });
      expect(result).toBe(true);
    });
    
    it('should return false if user does not have ADMIN role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.USER });
      
      const result = await userService.isUserAdmin('normal-user');
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'normal-user' },
        select: { role: true }
      });
      expect(result).toBe(false);
    });
    
    it('should return false if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      const result = await userService.isUserAdmin('nonexistent');
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' },
        select: { role: true }
      });
      expect(result).toBe(false);
    });
  });
}); 