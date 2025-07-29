import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import '@fastify/jwt';
import { UserWithRole } from './auth';
import { AnalyticsService } from '../services/analyticsService';
import { AuditService } from '../services/auditService';
import { RealtimeService } from '../services/realtimeService';
import { CommunicationService } from '../services/communicationService';
import { EnhancedCustomerService } from '../services/enhancedCustomerService';
import { UserService } from '../services/userService';
import { AvailabilityService } from '../services/availabilityService';
import { SquareIntegrationService } from '../services/squareIntegrationService';
import PaymentService from '../services/paymentService';
import PaymentLinkService from '../services/paymentLinkService';
import BookingService from '../services/bookingService';
import { AppointmentService } from '../services/appointmentService';
import { TattooRequestImageService } from '../services/tattooRequestImageService';
import { TattooRequestService } from '../services/tattooRequestService';
import { TattooRequestWorkflowService } from '../services/tattooRequestWorkflowService';
import { EmailTemplateService } from '../services/emailTemplateService';
import { EmailService } from '../services/emailService';
import { EmailAutomationService } from '../services/emailAutomationService';

declare module 'fastify' {
  export interface FastifyInstance {
    prisma: PrismaClient;
    services: {
      analyticsService: AnalyticsService;
      auditService: AuditService;
      realtimeService: RealtimeService;
      communicationService: CommunicationService;
      customerService: EnhancedCustomerService;
      userService: UserService;
      availabilityService: AvailabilityService;
      squareIntegrationService: SquareIntegrationService;
      paymentService: PaymentService;
      paymentLinkService: PaymentLinkService;
      bookingService: BookingService;
      appointmentService: AppointmentService;
      tattooRequestImageService: TattooRequestImageService;
      tattooRequestService: TattooRequestService;
      tattooRequestWorkflowService: TattooRequestWorkflowService;
      emailTemplateService: EmailTemplateService;
      emailService: EmailService;
      emailAutomationService: EmailAutomationService;
    };
    authorize: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void;
  }

  interface FastifyRequest {
    user?: UserWithRole;
    rawBody?: string;
  }

  interface FastifyContextConfig {
    rawBody?: boolean;
    [key: string]: unknown;
  }
}

