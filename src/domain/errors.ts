/**
 * Domain error hierarchy used across application, interfaces, and infrastructure layers.
 * Ensures consistent error codes and enables unified HTTP mapping.
 */
export class DomainError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

/**
 * Error thrown when a requested resource cannot be found.
 * @example throw new NotFoundError('assistant_not_found')
 */
export class NotFoundError extends DomainError {
  constructor(message = 'Resource not found') {
    super('not_found', message);
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends DomainError {
  constructor(message = 'Validation failed') {
    super('validation_error', message);
    this.name = 'ValidationError';
  }
}

/**
 * Error representing failures from external services (e.g., OpenAI).
 */
export class ExternalServiceError extends DomainError {
  constructor(message = 'External service error') {
    super('external_service_error', message);
    this.name = 'ExternalServiceError';
  }
}




