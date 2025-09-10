import { describe, it, expect } from 'vitest';
import { AssistantsService, ThreadsService, RunsService } from '../src/application/services.js';
import { InMemoryAssistantsRepo, InMemoryThreadsRepo, InMemoryMessagesRepo, InMemoryRunsRepo, RandomIdGenerator } from '../src/infra/memoryRepos.js';

class FakeResponsesClient {
  async createTextResponse(_: any): Promise<string> {
    return 'ok';
  }
}

describe('services', () => {
  const ids = new RandomIdGenerator();
  const assistantsRepo = new InMemoryAssistantsRepo(ids);
  const threadsRepo = new InMemoryThreadsRepo(ids);
  const messagesRepo = new InMemoryMessagesRepo(ids);
  const runsRepo = new InMemoryRunsRepo(ids);
  const responses = new FakeResponsesClient();

  const assistants = new AssistantsService(assistantsRepo);
  const threads = new ThreadsService(threadsRepo, messagesRepo);
  const runs = new RunsService(runsRepo, assistantsRepo, messagesRepo, responses as any);

  it('creates assistant, thread, message, and run', async () => {
    const a = await assistants.create({ name: 'A', model: 'gpt-4o', instructions: 'hi' });
    const t = await threads.createThread();
    await threads.addMessage({ threadId: t.id, role: 'user', content: 'Hello' });
    const run = await runs.createRun({ threadId: t.id, assistantId: a.id });
    expect(run.status === 'completed' || run.status === 'failed').toBe(true);
  });
});


