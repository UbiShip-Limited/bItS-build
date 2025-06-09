// Centralized Service Factory - Create once, use everywhere
import { apiClient } from '../apiClient';
import { CustomerService } from './customerService';
import { AppointmentApiClient } from './appointmentApiClient';
import { TattooRequestApiClient } from './tattooRequestApiClient';
import { paymentService } from './paymentService';
import { GalleryService } from './galleryService';
import { ImageUploadService } from './ImageUploadService';

// Create singleton instances
export const customerService = new CustomerService(apiClient);
export const appointmentService = new AppointmentApiClient(apiClient);
export const tattooRequestService = new TattooRequestApiClient(apiClient);
export const galleryService = new GalleryService(apiClient);
export const imageUploadService = new ImageUploadService(apiClient);

// Re-export the already singleton payment service
export { paymentService } from './paymentService';

// Export types for convenience
export type { Customer } from './customerService';
export type { AppointmentData } from './appointmentApiClient';
export type { TattooRequest } from './tattooRequestApiClient'; 