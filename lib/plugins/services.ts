import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

// Import all services
import { AnalyticsService } from '../services/analyticsService';
import { AuditService } from '../services/auditService';
import BookingService from '../services/bookingService';
import { EnhancedCustomerService } from '../services/enhancedCustomerService';
import { RealtimeService } from '../services/realtimeService';
import { TattooRequestService } from '../services/tattooRequestService';
import { TattooRequestImageService } from '../services/tattooRequestImageService';
import { TattooRequestWorkflowService } from '../services/tattooRequestWorkflowService';
import PaymentService from '../services/paymentService';
import PaymentLinkService from '../services/paymentLinkService';
import { SquareIntegrationService } from '../services/squareIntegrationService';
import { UserService } from '../services/userService';
import { CommunicationService } from '../services/communicationService';
import { AppointmentService } from '../services/appointmentService';
import { AvailabilityService } from '../services/availabilityService';
import { EmailTemplateService } from '../services/emailTemplateService';
import { EmailService } from '../services/emailService';
import { EmailAutomationService } from '../services/emailAutomationService';

// Define the services interface
export interface Services {
  analyticsService: AnalyticsService;
  auditService: AuditService;
  bookingService: BookingService;
  customerService: EnhancedCustomerService;
  realtimeService: RealtimeService;
  tattooRequestService: TattooRequestService;
  tattooRequestImageService: TattooRequestImageService;
  tattooRequestWorkflowService: TattooRequestWorkflowService;
  paymentService: PaymentService;
  paymentLinkService: PaymentLinkService;
  squareIntegrationService: SquareIntegrationService;
  userService: UserService;
  communicationService: CommunicationService;
  appointmentService: AppointmentService;
  availabilityService: AvailabilityService;
  emailTemplateService: EmailTemplateService;
  emailService: EmailService;
  emailAutomationService: EmailAutomationService;
}

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
  // Wait for prisma to be available
  await fastify.after();

  const prisma = fastify.prisma;
  
  // Initialize services with their dependencies
  const analyticsService = new AnalyticsService(prisma);
  const auditService = new AuditService(prisma);
  const realtimeService = new RealtimeService();
  const communicationService = new CommunicationService(realtimeService);
  const customerService = new EnhancedCustomerService(prisma);
  const userService = new UserService(prisma);
  const availabilityService = new AvailabilityService();
  
  // Square services
  const squareIntegrationService = new SquareIntegrationService();
  const paymentService = new PaymentService(prisma);
  const paymentLinkService = new PaymentLinkService(prisma);
  
  // Booking service
  const bookingService = new BookingService();
  
  // Appointment service
  const appointmentService = new AppointmentService(realtimeService);
  
  // Tattoo request services
  const tattooRequestImageService = new TattooRequestImageService(prisma);
  const tattooRequestService = new TattooRequestService(communicationService, realtimeService);
  const tattooRequestWorkflowService = new TattooRequestWorkflowService(
    prisma,
    tattooRequestService,
    paymentService,
    communicationService,
    auditService
  );

  // Email services
  const emailTemplateService = new EmailTemplateService();
  const emailService = new EmailService();
  const emailAutomationService = new EmailAutomationService(realtimeService);

  // Create services object
  const services: Services = {
    analyticsService,
    auditService,
    bookingService,
    customerService,
    realtimeService,
    tattooRequestService,
    tattooRequestImageService,
    tattooRequestWorkflowService,
    paymentService,
    paymentLinkService,
    squareIntegrationService,
    userService,
    communicationService,
    appointmentService,
    availabilityService,
    emailTemplateService,
    emailService,
    emailAutomationService
  };

  // Decorate fastify with services
  fastify.decorate('services', services);
};

export default fp(servicesPlugin, {
  name: 'services',
  dependencies: ['prisma']
});