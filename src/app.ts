import Fastify from 'fastify';
import cors from '@fastify/cors';
import { buildContainer } from './container.js';
import { buildControllers } from './interfaces/http/controllers.js';
import { registerErrorHandler } from './interfaces/http/errors.js';
import { createLogger } from './logger.js';

/**
 * Build and configure the Fastify application with routes and error handling.
 */
export async function buildApp() {
  const app = Fastify({ logger: false, trustProxy: true });
  await app.register(cors, { origin: true });

  app.get('/health', async () => ({ status: 'ok' }));

  const deps = buildContainer();
  buildControllers(app, deps);
  registerErrorHandler(app);

  // Basic HTTP request logging
  const httpLogger = createLogger('http');
  app.addHook('onRequest', async (req) => {
    httpLogger.info('request', {
      method: req.method,
      url: req.url,
      id: (req as any).id,
      ip: req.ip,
    });
  });
  app.addHook('onResponse', async (req, reply) => {
    httpLogger.info('response', {
      method: req.method,
      url: req.url,
      statusCode: reply.statusCode,
      id: (req as any).id,
    });
  });

  return app;
}


