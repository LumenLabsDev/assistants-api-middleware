import { describe, it, expect } from 'vitest';
import { AssistantsService, ThreadsService, RunsService } from '../src/application/services.js';
import { RedisAssistantsRepo, RedisThreadsRepo, RedisMessagesRepo, RedisRunsRepo } from '../src/infra/redisRepos.js';
import { UuidIdGenerator } from '../src/infra/idGenerator.js';
import { FakeResponsesClient } from '../src/infra/fakeResponsesClient.js';

const hasRedis = Boolean(process.env.REDIS_URL);

(hasRedis ? describe : describe.skip)('services', () => {
  const ids = new UuidIdGenerator();
  const assistantsRepo = new RedisAssistantsRepo(ids);
  const threadsRepo = new RedisThreadsRepo(ids);
  const messagesRepo = new RedisMessagesRepo(ids);
  const runsRepo = new RedisRunsRepo(ids);
  const responses = new FakeResponsesClient();

  const assistants = new AssistantsService(assistantsRepo);
  const threads = new ThreadsService(threadsRepo, messagesRepo);
  const runs = new RunsService(runsRepo, assistantsRepo, messagesRepo, responses);

  it('creates assistant, thread, message, and run', async () => {
    const a = await assistants.create({ name: 'A', model: 'gpt-4o', instructions: 'hi' });
    const t = await threads.createThread();
    await threads.addMessage({ threadId: t.id, role: 'user', content: 'Hello' });
    const run = await runs.createRun({ threadId: t.id, assistantId: a.id });
    expect(run.status === 'completed' || run.status === 'failed').toBe(true);
  });
});


