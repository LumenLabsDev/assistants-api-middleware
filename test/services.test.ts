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
  const runs = new RunsService(runsRepo, threadsRepo, assistantsRepo, messagesRepo, responses);

  it('creates assistant, thread, message, and run', async () => {
    const a = await assistants.create({ name: 'A', model: 'gpt-4o', instructions: 'hi' });
    const t = await threads.createThread();
    await threads.addMessage({ threadId: t.id, role: 'user', content: 'Hello' });
    const run = await runs.createRun({ threadId: t.id, assistantId: a.id });
    expect(run.status === 'completed' || run.status === 'failed').toBe(true);
  });

  it('getInThread returns null for mismatched thread, and run when matching', async () => {
    const a = await assistants.create({ name: 'A2', model: 'gpt-4o' });
    const t1 = await threads.createThread();
    const t2 = await threads.createThread();
    await threads.addMessage({ threadId: t1.id, role: 'user', content: 'Hi' });
    const run = await runs.createRun({ threadId: t1.id, assistantId: a.id });

    const wrong = await runs.getInThread(t2.id, run.id);
    expect(wrong).toBeNull();

    const correct = await runs.getInThread(t1.id, run.id);
    expect(correct?.id).toBe(run.id);
  });

  it('deletes a single message in a thread', async () => {
    const t = await threads.createThread();
    const u1 = await threads.addMessage({ threadId: t.id, role: 'user', content: 'Hello' });
    const a1 = await threads.addMessage({ threadId: t.id, role: 'assistant', content: 'Reply' });

    let list = await threads.listMessages(t.id);
    expect(list.map(m => m.id)).toEqual([u1.id, a1.id]);

    await threads.deleteMessage(t.id, a1.id);

    list = await threads.listMessages(t.id);
    expect(list.map(m => m.id)).toEqual([u1.id]);
  });

  it('deletes assistant+preceding user pair', async () => {
    const t = await threads.createThread();
    const u1 = await threads.addMessage({ threadId: t.id, role: 'user', content: 'Q1' });
    const a1 = await threads.addMessage({ threadId: t.id, role: 'assistant', content: 'A1' });

    const result = await threads.deleteMessagePair(t.id, a1.id);
    expect(result.deleted.sort()).toEqual([u1.id, a1.id].sort());

    const list = await threads.listMessages(t.id);
    expect(list.length).toBe(0);
  });
});


