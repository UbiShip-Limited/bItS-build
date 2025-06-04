// Shared types for frontend-backend communication
// These should match the backend types but be maintained separately for frontend

export enum BookingType {
  CONSULTATION = 'consultation',
  DRAWING_CONSULTATION = 'drawing_consultation',
  TATTOO_SESSION = 'tattoo_session'
}

export enum BookingStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum PaymentType {
  CONSULTATION = 'consultation',
  DEPOSIT = 'deposit',
  BALANCE = 'balance',
  FULL_PAYMENT = 'full_payment',
  ADDITIONAL_WORK = 'additional_work'
}

export enum TattooRequestStatus {
  NEW = 'new',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONVERTED_TO_APPOINTMENT = 'converted_to_appointment'
}

// Payment config
export const PAYMENT_CONFIG = {
  MINIMUM_AMOUNTS: {
    [PaymentType.CONSULTATION]: 50,
    [PaymentType.DEPOSIT]: 100,
    [PaymentType.BALANCE]: 50,
    [PaymentType.FULL_PAYMENT]: 50,
    [PaymentType.ADDITIONAL_WORK]: 25
  }
};

export const formatPaymentType = (type: PaymentType): string => {
  switch (type) {
    case PaymentType.CONSULTATION:
      return 'Consultation Fee';
    case PaymentType.DEPOSIT:
      return 'Deposit Payment';
    case PaymentType.BALANCE:
      return 'Balance Payment';
    case PaymentType.FULL_PAYMENT:
      return 'Full Payment';
    case PaymentType.ADDITIONAL_WORK:
      return 'Additional Work';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  }
};

export const getMinimumAmount = (type: PaymentType): number => {
  return PAYMENT_CONFIG.MINIMUM_AMOUNTS[type] || 50;
}; 