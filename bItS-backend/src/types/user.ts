import { User as SupabaseUser } from '@supabase/supabase-js';
import { Prisma } from '@prisma/client';

// Explicitly define the Role enum to match Prisma schema
export enum Role {
  USER = 'USER',
  ARTIST = 'ARTIST',
  ASSISTANT = 'ASSISTANT',
  ADMIN = 'ADMIN'
}

export interface User extends SupabaseUser {
  role?: Role;
}

// For extended Fastify request typing
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  isAdmin: boolean;
} 