import { UuidIdGenerator } from './infra/idGenerator.js';
import { OpenAIResponsesClient } from './infra/openaiResponsesClient.js';
import { FakeResponsesClient } from './infra/fakeResponsesClient.js';
import { AssistantsService, ThreadsService, RunsService } from './application/services.js';
import { RedisAssistantsRepo, RedisThreadsRepo, RedisMessagesRepo, RedisRunsRepo } from './infra/redisRepos.js';
import { CosmosAssistantsRepo, CosmosThreadsRepo, CosmosMessagesRepo, CosmosRunsRepo } from './infra/cosmosRepos.js';

/** Database provider type for dependency injection. */
export type DatabaseProvider = 'redis' | 'cosmos';

/**
 * Compose and provide application dependencies for runtime and tests.
 * Supports both Redis and Azure Cosmos DB as database providers.
 */
export function buildContainer(dbProvider?: DatabaseProvider) {
  const ids = new UuidIdGenerator();
  
  // Determine database provider from environment or parameter
  const provider = dbProvider ?? (process.env.DATABASE_PROVIDER as DatabaseProvider) ?? 'redis';

  // Create repositories based on provider
  let assistantsRepo, threadsRepo, messagesRepo, runsRepo;
  
  if (provider === 'cosmos') {
    assistantsRepo = new CosmosAssistantsRepo(ids);
    threadsRepo = new CosmosThreadsRepo(ids);
    messagesRepo = new CosmosMessagesRepo(ids);
    runsRepo = new CosmosRunsRepo(ids);
  } else {
    // Default to Redis
    assistantsRepo = new RedisAssistantsRepo(ids);
    threadsRepo = new RedisThreadsRepo(ids);
    messagesRepo = new RedisMessagesRepo(ids);
    runsRepo = new RedisRunsRepo(ids);
  }

  const responsesClient = process.env.NODE_ENV === 'test' ? new FakeResponsesClient() : new OpenAIResponsesClient();

  const assistants = new AssistantsService(assistantsRepo);
  const threads = new ThreadsService(threadsRepo, messagesRepo);
  const runs = new RunsService(runsRepo, threadsRepo, assistantsRepo, messagesRepo, responsesClient);

  return { assistants, threads, runs, provider };
}


