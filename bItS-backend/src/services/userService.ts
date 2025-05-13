import prisma from '../db/prismaClient';
import { Role } from '../types/user';

/**
 * Service to handle User-related database operations
 */
export class UserService {
  /**
   * Find a user by Supabase auth ID
   * @param id Supabase user ID
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Find a user by email
   * @param email User email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Create or update a user from Supabase auth data
   * This ensures we have a corresponding record in our Prisma database
   * @param userData User data from Supabase auth
   */
  async upsertUser(userData: { id: string; email: string }) {
    return prisma.user.upsert({
      where: { id: userData.id },
      update: { email: userData.email },
      create: {
        id: userData.id,
        email: userData.email,
        role: Role.USER, // Default role for new users
      }
    });
  }

  /**
   * Assign admin role to a user
   * @param userId User ID to make admin
   */
  async makeAdmin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN }
    });
  }

  /**
   * Check if a user is an admin
   * @param userId User ID to check
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    return user?.role === Role.ADMIN;
  }
}
