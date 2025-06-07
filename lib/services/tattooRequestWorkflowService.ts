import { TattooRequestService, ConvertToAppointmentData } from './tattooRequestService';
import BookingService, { BookingType, BookingStatus } from './bookingService';
import { EnhancedCustomerService } from './enhancedCustomerService';
import { tattooRequestImageService } from './tattooRequestImageService';
import { auditService } from './auditService';
import { prisma } from '../prisma/prisma';
import { ValidationError, NotFoundError } from './errors';
import type { TattooRequest, Appointment } from '@prisma/client';

/**
 * Orchestrates complex, multi-step business workflows involving tattoo requests.
 * This service is responsible for coordinating other services to perform operations
 * like converting a tattoo request into a formal appointment.
 */
export class TattooRequestWorkflowService {
  private tattooRequestService: TattooRequestService;
  private bookingService: BookingService;
  private customerService: EnhancedCustomerService;

  constructor() {
    this.tattooRequestService = new TattooRequestService();
    this.bookingService = new BookingService();
    this.customerService = new EnhancedCustomerService();
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
      await prisma.tattooRequest.update({
        where: { id: requestId },
        data: { customerId: newCustomer.id },
      });

      // Attempt to transfer associated images to the customer's profile
      await tattooRequestImageService.transferImagesForCustomer(requestId, customerId);
    }
    
    if (!customerId) {
        throw new ValidationError('A customer ID is required to create an appointment.');
    }

    // 3. Create the booking/appointment via the BookingService
    let bookingResult: { success: boolean; booking?: Appointment, error?: string };
    try {
      const result = await this.bookingService.createBooking({
        ...appointmentData,
        customerId,
        bookingType: appointmentData.bookingType || BookingType.TATTOO_SESSION,
        status: BookingStatus.CONFIRMED,
        tattooRequestId: requestId,
      });
      bookingResult = { ...result, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during booking creation.';
      console.error(`TattooRequestWorkflowService Error: ${message}`);
      throw new ValidationError(`Failed to create appointment booking: ${message}`);
    }

    if (!bookingResult.success || !bookingResult.booking) {
      throw new ValidationError(`Failed to create appointment booking for an unknown reason.`);
    }

    // 4. Update the tattoo request status to reflect its conversion
    const updatedTattooRequest = await this.tattooRequestService.updateStatus(requestId, 'converted_to_appointment', userId);

    // 5. Log the successful conversion for auditing purposes
    await auditService.log({
      userId,
      action: 'CONVERTED_TO_APPOINTMENT',
      resource: 'TattooRequest',
      resourceId: requestId,
      details: {
        appointmentId: bookingResult.booking.id,
        customerId,
        wasAnonymous,
      },
    });

    return {
      success: true,
      appointment: bookingResult.booking,
      tattooRequest: updatedTattooRequest,
    };
  }
}

export const tattooRequestWorkflowService = new TattooRequestWorkflowService();
