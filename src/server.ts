import 'dotenv/config';
import { createLogger } from './logger.js';
import { buildApp } from './app.js';

const logger = createLogger('server');

const port = Number(process.env.PORT ?? 3500);

/** Boot the HTTP server and listen on configured port. */
buildApp()
  .then(app => {
    const provider = process.env.DATABASE_PROVIDER ?? 'redis';
    logger.info('Database provider', { provider });
    
    return app.listen({ port, host: '0.0.0.0' });
  })
  .then(addr => {
    logger.info('Server listening', { addr });
  })
  .catch(err => {
    logger.error('Server failed to start', { err });
    process.exit(1);
  });


