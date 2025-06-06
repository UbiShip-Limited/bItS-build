import { TattooRequestService } from './tattooRequestService';
import BookingService, { BookingType, BookingStatus } from './bookingService';
import { EnhancedCustomerService } from './enhancedCustomerService';
import { TattooRequestImageService } from './tattooRequestImageService';
import { auditService } from './auditService';
import { prisma } from '../prisma/prisma';
import { ValidationError } from './errors';
import type { ConvertToAppointmentData } from './tattooRequestService';

/**
 * Orchestrates complex business workflows involving tattoo requests.
 * This service coordinates other services to perform multi-step operations.
 */
export class TattooRequestWorkflowService {
  private tattooRequestService: TattooRequestService;
  private bookingService: BookingService;
  private customerService: EnhancedCustomerService;
  private imageService: TattooRequestImageService;

  constructor() {
    this.tattooRequestService = new TattooRequestService();
    this.bookingService = new BookingService();
    this.customerService = new EnhancedCustomerService();
    this.imageService = new TattooRequestImageService();
  }

  /**
   * Converts an approved tattoo request into a formal appointment.
   * This workflow involves:
   * 1. Validating the request status.
   * 2. Creating a new customer if the request was anonymous.
   * 3. Transferring associated images to the new customer.
   * 4. Creating a booking via the BookingService.
   * 5. Updating the request status to 'converted_to_appointment'.
   * 6. Logging the entire operation to the audit trail.
   */
  async convertToAppointment(
    requestId: string,
    appointmentData: ConvertToAppointmentData,
    userId?: string
  ) {
    const tattooRequest = await this.tattooRequestService.findById(requestId);
    if (tattooRequest.status !== 'approved') {
      throw new ValidationError(
        `Tattoo request must be approved to be converted. Current status: ${tattooRequest.status}`
      );
    }

    let customerId = tattooRequest.customerId;
    let wasAnonymous = false;

    if (!customerId) {
      const newCustomer = await this.customerService.createFromTattooRequest(tattooRequest);
      customerId = newCustomer.id;
      wasAnonymous = true;

      await prisma.tattooRequest.update({
        where: { id: requestId },
        data: { customerId: newCustomer.id },
      });

      await this.imageService.transferImagesForCustomer(requestId, customerId);
    }
    
    if (!customerId) {
        throw new ValidationError('Cannot create appointment without a customer.');
    }

    const bookingResult = await this.bookingService.createBooking({
      ...appointmentData,
      customerId,
      bookingType: appointmentData.bookingType || BookingType.TATTOO_SESSION,
      status: BookingStatus.CONFIRMED,
      tattooRequestId: requestId,
    });

    if (!bookingResult.success) {
      throw new ValidationError(`Failed to create appointment booking: ${bookingResult.error}`);
    }

    await this.tattooRequestService.updateStatus(requestId, 'converted_to_appointment', userId);

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
      tattooRequest: await this.tattooRequestService.findById(requestId),
    };
  }
}

export const tattooRequestWorkflowService = new TattooRequestWorkflowService(); 