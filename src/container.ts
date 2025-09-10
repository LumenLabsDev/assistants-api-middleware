import { RandomIdGenerator, InMemoryAssistantsRepo, InMemoryThreadsRepo, InMemoryMessagesRepo, InMemoryRunsRepo } from './infra/memoryRepos.js';
import { OpenAIResponsesClient } from './infra/openaiResponsesClient.js';
import { FakeResponsesClient } from './infra/fakeResponsesClient.js';
import { AssistantsService, ThreadsService, RunsService } from './application/services.js';
import { RedisAssistantsRepo, RedisThreadsRepo, RedisMessagesRepo, RedisRunsRepo } from './infra/redisRepos.js';

/**
 * Compose and provide application dependencies for runtime and tests.
 * Uses Redis repositories when REDIS_URL is set, otherwise in-memory.
 */
export function buildContainer() {
  const ids = new RandomIdGenerator();

  const useRedis = Boolean(process.env.REDIS_URL);
  const assistantsRepo = useRedis ? new RedisAssistantsRepo(ids) : new InMemoryAssistantsRepo(ids);
  const threadsRepo = useRedis ? new RedisThreadsRepo(ids) : new InMemoryThreadsRepo(ids);
  const messagesRepo = useRedis ? new RedisMessagesRepo(ids) : new InMemoryMessagesRepo(ids);
  const runsRepo = useRedis ? new RedisRunsRepo(ids) : new InMemoryRunsRepo(ids);

  const responsesClient = process.env.NODE_ENV === 'test' ? new FakeResponsesClient() : new OpenAIResponsesClient();

  const assistants = new AssistantsService(assistantsRepo);
  const threads = new ThreadsService(threadsRepo, messagesRepo);
  const runs = new RunsService(runsRepo, assistantsRepo, messagesRepo, responsesClient);

  return { assistants, threads, runs };
}


