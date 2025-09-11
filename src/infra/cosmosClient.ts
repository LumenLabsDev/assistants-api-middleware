import { CosmosClient, Database, Container } from '@azure/cosmos';
import { createLogger } from '../logger.js';

const logger = createLogger('infra:cosmos');

let cachedClient: CosmosClient | undefined;
let cachedDatabase: Database | undefined;

export interface CosmosConfig {
  endpoint: string;
  key: string;
  databaseId: string;
}

/**
 * Lazily create and cache a Cosmos DB client and database connection.
 *
 * @param config Optional explicit configuration. Falls back to environment variables.
 * @returns Connected Cosmos client and database handle.
 */
export async function getCosmos(config?: CosmosConfig): Promise<{ client: CosmosClient; database: Database }> {
  if (cachedClient && cachedDatabase) {
    return { client: cachedClient, database: cachedDatabase };
  }

  const endpoint = config?.endpoint ?? process.env.COSMOS_ENDPOINT;
  const key = config?.key ?? process.env.COSMOS_KEY;
  const databaseId = config?.databaseId ?? process.env.COSMOS_DATABASE_ID ?? 'assistants-api';

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY must be set');
  }

  logger.debug('cosmos.connecting', { endpoint, databaseId });

  try {
    cachedClient = new CosmosClient({ endpoint, key });
    
    const { database } = await cachedClient.databases.createIfNotExists({ id: databaseId });
    cachedDatabase = database;

    await Promise.all([
      database.containers.createIfNotExists({ 
        id: 'assistants',
        partitionKey: '/id'
      }),
      database.containers.createIfNotExists({ 
        id: 'threads',
        partitionKey: '/id'
      }),
      database.containers.createIfNotExists({ 
        id: 'messages',
        partitionKey: '/threadId'
      }),
      database.containers.createIfNotExists({ 
        id: 'runs',
        partitionKey: '/threadId'
      })
    ]);

    logger.info('cosmos.connected', { endpoint, databaseId });
    return { client: cachedClient, database: cachedDatabase };
  } catch (error: any) {
    logger.error('cosmos.connection_failed', { error: error.message });
    throw new Error(`Failed to connect to Cosmos DB: ${error.message}`);
  }
}

/**
 * Get a specific container from the database.
 */
export async function getContainer(containerName: string): Promise<Container> {
  const { database } = await getCosmos();
  return database.container(containerName);
}
