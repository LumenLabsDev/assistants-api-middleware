import Fastify from 'fastify';
import cors from '@fastify/cors';
import { buildContainer } from './container.js';
import { buildControllers } from './interfaces/http/controllers.js';
import { registerErrorHandler } from './interfaces/http/errors.js';

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

  return app;
}


