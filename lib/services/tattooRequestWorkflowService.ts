import { TattooRequestService, ConvertToAppointmentData } from './tattooRequestService';
import { AppointmentService } from './appointmentService';
import { BookingType, BookingStatus } from '../types/booking';
import { EnhancedCustomerService } from './enhancedCustomerService';
import { tattooRequestImageService } from './tattooRequestImageService';
import { auditService } from './auditService';
import { prisma } from '../prisma/prisma';
import { ValidationError, NotFoundError } from './errors';
import type { Appointment } from '@prisma/client';

/**
 * Orchestrates complex, multi-step business workflows involving tattoo requests.
 * This service is responsible for coordinating other services to perform operations
 * like converting a tattoo request into a formal appointment.
 */
export class TattooRequestWorkflowService {
  private tattooRequestService: TattooRequestService;
  private appointmentService: AppointmentService;
  private customerService: EnhancedCustomerService;
  private prisma: any;
  private paymentService: any;
  private communicationService: any;
  private auditService: any;

  constructor(
    prisma?: any,
    tattooRequestService?: TattooRequestService,
    paymentService?: any,
    communicationService?: any,
    auditService?: any
  ) {
    this.prisma = prisma || require('../prisma/prisma').prisma;
    this.tattooRequestService = tattooRequestService || new TattooRequestService();
    this.appointmentService = new AppointmentService();
    this.customerService = new EnhancedCustomerService(this.prisma);
    this.paymentService = paymentService;
    this.communicationService = communicationService;
    this.auditService = auditService;
  }

  /**
   * Converts an approved tattoo request into a formal appointment.
   * This is the primary workflow, involving validation, customer creation (if needed),
   * booking creation, and state updates.
   *
   * @param requestId The ID of the tattoo request to convert.
   * @param appointmentData The data for the new appointment.
   * @param userId The ID of the admin/artist performing the action.
   * @returns An object containing the new appointment and the updated tattoo request.
   */
  async convertToAppointment(
    requestId: string,
    appointmentData: ConvertToAppointmentData,
    userId?: string
  ) {
    // 1. Fetch and validate the original tattoo request
    const tattooRequest = await this.tattooRequestService.findById(requestId);
    if (!tattooRequest) {
      throw new NotFoundError('TattooRequest', requestId);
    }
    if (tattooRequest.status !== 'approved') {
      throw new ValidationError(
        `Tattoo request must be 'approved' to be converted. Current status: '${tattooRequest.status}'`
      );
    }

    // 2. Ensure a customer exists, creating one if the request was anonymous
    let customerId = tattooRequest.customerId;
    let wasAnonymous = false;
    if (!customerId) {
      const newCustomer = await this.customerService.createFromTattooRequest(tattooRequest);
      customerId = newCustomer.id;
      wasAnonymous = true;

      // Link the new customer to the original request
      await this.prisma.tattooRequest.update({
        where: { id: requestId },
        data: { customerId: newCustomer.id },
      });

      // Attempt to transfer associated images to the customer's profile
      await tattooRequestImageService.transferImagesForCustomer(requestId, customerId);
    }
    
    if (!customerId) {
        throw new ValidationError('A customer ID is required to create an appointment.');
    }

    // 3. Create the appointment via the AppointmentService
    let appointment: Appointment;
    try {
      appointment = await this.appointmentService.create({
        startAt: appointmentData.startAt,
        duration: appointmentData.duration,
        customerId,
        bookingType: (appointmentData.bookingType as BookingType) || BookingType.TATTOO_SESSION,
        status: BookingStatus.CONFIRMED,
        artistId: appointmentData.artistId,
        note: appointmentData.note,
        priceQuote: appointmentData.priceQuote,
        tattooRequestId: requestId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during appointment creation.';
      console.error(`TattooRequestWorkflowService Error: ${message}`);
      throw new ValidationError(`Failed to create appointment: ${message}`);
    }

    if (!appointment) {
      throw new ValidationError(`Failed to create appointment for an unknown reason.`);
    }

    // 4. Update the tattoo request status to reflect its conversion
    const updatedTattooRequest = await this.tattooRequestService.updateStatus(requestId, 'converted_to_appointment', userId);

    // 5. Log the successful conversion for auditing purposes
    await this.auditService.log({
      userId,
      action: 'CONVERTED_TO_APPOINTMENT',
      resource: 'TattooRequest',
      resourceId: requestId,
      details: {
        appointmentId: appointment.id,
        customerId,
        wasAnonymous,
      },
    });

    return {
      success: true,
      appointment: appointment,
      tattooRequest: updatedTattooRequest,
    };
  }
}

export const tattooRequestWorkflowService = new TattooRequestWorkflowService();
