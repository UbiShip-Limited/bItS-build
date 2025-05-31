export class AppointmentError extends Error {
  constructor(
    message: string, 
    public code: string, 
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppointmentError';
  }
}

export class SquareIntegrationError extends AppointmentError {
  constructor(message: string, public originalError?: Error | unknown) {
    super(message, 'SQUARE_ERROR', 500);
    this.name = 'SquareIntegrationError';
  }
}

export class ValidationError extends AppointmentError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppointmentError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class AuthorizationError extends AppointmentError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 403);
    this.name = 'AuthorizationError';
  }
} 