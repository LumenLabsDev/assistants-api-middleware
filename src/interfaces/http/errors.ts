import { FastifyInstance } from 'fastify';
import { createLogger } from '../../logger.js';
import { DomainError, NotFoundError, ValidationError } from '../../domain/errors.js';

const logger = createLogger('http:error');

/**
 * Registers a global error handler that maps domain errors to HTTP status codes
 * and emits structured logs.
 */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, _req, reply) => {
    const statusFromErr = typeof (err as any).statusCode === 'number' ? (err as any).statusCode : undefined;
    let status = statusFromErr ?? 500;
    let code = 'internal_error';
    let message = err.message || 'Internal server error';

    if (err instanceof ValidationError) {
      status = 400;
      code = err.code;
    } else if (err instanceof NotFoundError) {
      status = 404;
      code = err.code;
    } else if (err instanceof DomainError) {
      status = 422;
      code = err.code;
    }

    logger.error('request_error', { status, code, message });
    reply.code(status).send({ error: { code, message } });
  });
}


