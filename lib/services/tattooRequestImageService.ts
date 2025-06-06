import CloudinaryService from '../cloudinary';
import { prisma } from '../prisma/prisma';
import { auditService } from './auditService';
import { NotFoundError, ValidationError } from './errors';
import type { Image } from '@prisma/client';

/**
 * Service for managing images related to tattoo requests.
 * Encapsulates all interactions with Cloudinary and the database Image table for tattoo requests.
 */
export class TattooRequestImageService {
  /**
   * Link pre-uploaded Cloudinary images to an existing tattoo request.
   */
  async linkImagesToRequest(
    requestId: string,
    publicIds: string[],
    userId?: string
  ): Promise<void> {
    const tattooRequest = await prisma.tattooRequest.findUnique({ where: { id: requestId } });
    if (!tattooRequest) {
      throw new NotFoundError('TattooRequest', requestId);
    }

    const validatedImages = await Promise.all(
      publicIds.map(async (publicId) => {
        const result = await CloudinaryService.validateUploadResult(publicId);
        if (!result) {
          throw new ValidationError(`Invalid or unverified image public_id: ${publicId}`);
        }
        return result;
      })
    );

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        validatedImages.map((image) =>
          tx.image.create({
            data: {
              url: image.secureUrl,
              publicId: image.publicId,
              tattooRequestId: requestId,
              metadata: {
                source: 'cloudinary_link',
                linkedAt: new Date().toISOString(),
                width: image.width,
                height: image.height,
                format: image.format,
              },
            },
          })
        )
      );
    });

    await auditService.log({
      userId,
      action: 'LINK_IMAGES',
      resource: 'TattooRequest',
      resourceId: requestId,
      details: {
        linkedImages: publicIds,
        imageCount: validatedImages.length,
      },
    });
  }

  /**
   * Get all images associated with a tattoo request from the database.
   */
  async getImagesForRequest(requestId: string): Promise<Image[]> {
    const images = await prisma.image.findMany({
      where: { tattooRequestId: requestId },
      orderBy: { createdAt: 'asc' },
    });
    return images;
  }

  /**
   * Transfers images from a tattoo request to a customer's folder in Cloudinary.
   * This now correctly calls the existing CloudinaryService method.
   */
  async transferImagesForCustomer(requestId: string, customerId: string): Promise<void> {
    try {
      // The Cloudinary service already knows how to find images by tattooRequestId
      await CloudinaryService.transferImagesToCustomer(requestId, customerId);
    } catch (error) {
      console.warn(`Failed to transfer images for request ${requestId} to customer ${customerId}:`, error);
      // We log a warning and don't re-throw, as this might not be a critical failure.
    }
  }
}

export const tattooRequestImageService = new TattooRequestImageService(); 