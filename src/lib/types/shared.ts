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
  DRAWING_CONSULTATION = 'drawing_consultation',
  TATTOO_DEPOSIT = 'tattoo_deposit',
  TATTOO_FINAL = 'tattoo_final'
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
    [PaymentType.CONSULTATION]: 35,
    [PaymentType.DRAWING_CONSULTATION]: 50,
    [PaymentType.TATTOO_DEPOSIT]: 75,
    [PaymentType.TATTOO_FINAL]: 100
  }
};

export const formatPaymentType = (type: PaymentType): string => {
  switch (type) {
    case PaymentType.CONSULTATION:
      return 'Consultation';
    case PaymentType.DRAWING_CONSULTATION:
      return 'Drawing Consultation';
    case PaymentType.TATTOO_DEPOSIT:
      return 'Tattoo Deposit';
    case PaymentType.TATTOO_FINAL:
      return 'Final Payment';
    default:
      return (type as string).charAt(0).toUpperCase() + (type as string).slice(1).replace('_', ' ');
  }
};

export const getMinimumAmount = (type: PaymentType): number => {
  return PAYMENT_CONFIG.MINIMUM_AMOUNTS[type] || 50;
}; 