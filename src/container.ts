import { UuidIdGenerator } from './infra/idGenerator.js';
import { OpenAIResponsesClient } from './infra/openaiResponsesClient.js';
import { FakeResponsesClient } from './infra/fakeResponsesClient.js';
import { AssistantsService, ThreadsService, RunsService } from './application/services.js';
import { RedisAssistantsRepo, RedisThreadsRepo, RedisMessagesRepo, RedisRunsRepo } from './infra/redisRepos.js';

/**
 * Compose and provide application dependencies for runtime and tests.
 * Uses Redis repositories exclusively (in-memory support removed).
 */
export function buildContainer() {
  const ids = new UuidIdGenerator();

  const assistantsRepo = new RedisAssistantsRepo(ids);
  const threadsRepo = new RedisThreadsRepo(ids);
  const messagesRepo = new RedisMessagesRepo(ids);
  const runsRepo = new RedisRunsRepo(ids);

  const responsesClient = process.env.NODE_ENV === 'test' ? new FakeResponsesClient() : new OpenAIResponsesClient();

  const assistants = new AssistantsService(assistantsRepo);
  const threads = new ThreadsService(threadsRepo, messagesRepo);
  const runs = new RunsService(runsRepo, assistantsRepo, messagesRepo, responsesClient);

  return { assistants, threads, runs };
}


