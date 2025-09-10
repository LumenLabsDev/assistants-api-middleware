import { AssistantsRepository, ThreadsRepository, MessagesRepository, RunsRepository, ResponsesClient } from '../domain/ports.js';
import { normalizeModel } from '../domain/models.js';
import { Assistant, Message, Run, Thread } from '../domain/types.js';
import { NotFoundError } from '../domain/errors.js';
import { AssistantCreateInput, AssistantUpdateInput, ThreadMessageCreateInput, RunCreateInput } from './dto.js';

/**
 * Use cases for managing assistants.
 */
export class AssistantsService {
  constructor(private assistants: AssistantsRepository) {}
  /** Create an assistant. */
  async create(data: AssistantCreateInput): Promise<Assistant> { return this.assistants.create(data as Omit<Assistant, 'id' | 'createdAt'>); }
  /** List all assistants. */
  async list(): Promise<Assistant[]> { return this.assistants.list(); }
  /** Get an assistant by id. */
  async get(id: string): Promise<Assistant | null> { return this.assistants.get(id); }
  /** Update an assistant. */
  async update(id: string, data: AssistantUpdateInput): Promise<Assistant | null> { return this.assistants.update(id, data as Partial<Omit<Assistant, 'id' | 'createdAt'>>); }
  /** Get an assistant or throw NotFoundError. */
  async requireAssistant(id: string): Promise<Assistant> {
    const a = await this.assistants.get(id);
    if (!a) throw new NotFoundError('assistant_not_found');
    return a;
  }
}

/**
 * Use cases for thread lifecycle and messages.
 */
export class ThreadsService {
  constructor(private threads: ThreadsRepository, private messages: MessagesRepository) {}
  /** Create a new thread. */
  async createThread(): Promise<Thread> { return this.threads.create(); }
  /** Get a thread by id. */
  async getThread(id: string): Promise<Thread | null> { return this.threads.get(id); }
  /** Get a thread or throw NotFoundError. */
  async requireThread(id: string): Promise<Thread> {
    const t = await this.threads.get(id);
    if (!t) throw new NotFoundError('thread_not_found');
    return t;
  }
  /** Add a message to a thread. */
  async addMessage(input: ThreadMessageCreateInput): Promise<Message> {
    return this.messages.add({ threadId: input.threadId, role: input.role, content: input.content });
  }
  /** List messages for a thread in chronological order. */
  async listMessages(threadId: string): Promise<Message[]> { return this.messages.listByThread(threadId); }
}

/**
 * Use cases for running assistants over thread messages and capturing outputs.
 */
export class RunsService {
  constructor(
    private runs: RunsRepository,
    private assistants: AssistantsRepository,
    private messages: MessagesRepository,
    private responses: ResponsesClient,
  ) {}

  /**
   * Create a run for a thread and assistant, invoking the Responses client.
   */
  async createRun(params: RunCreateInput): Promise<Run> {
    const assistant = await this.assistants.get(params.assistantId);
    if (!assistant) throw new NotFoundError('assistant_not_found');

    const run = await this.runs.create({
      threadId: params.threadId,
      assistantId: params.assistantId,
      status: 'queued',
    });

    try {
      await this.runs.update(run.id, { status: 'in_progress' });
      const msgs = await this.messages.listByThread(params.threadId);
      const input: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (assistant.instructions) input.push({ role: 'system', content: assistant.instructions });
      for (const m of msgs) input.push({ role: m.role, content: m.content });

      const model = normalizeModel(assistant.model);
      const text = await this.responses.createTextResponse({ model, input, temperature: params.temperature });

      const saved = await this.messages.add({ threadId: params.threadId, role: 'assistant', content: text });
      await this.runs.update(run.id, { status: 'completed', completedAt: Math.floor(Date.now() / 1000), responseMessageId: saved.id });
    } catch (err: any) {
      await this.runs.update(run.id, { status: 'failed', lastError: String(err?.message ?? err) });
    }
    const finalRun = await this.runs.get(run.id);
    // finalRun can't be null here, but assert anyway
    return finalRun as Run;
  }

  async getRun(runId: string): Promise<Run | null> { return this.runs.get(runId); }
  async listRuns(threadId: string): Promise<Run[]> { return this.runs.listByThread(threadId); }
  /** Get a run or throw NotFoundError. */
  async requireRun(runId: string): Promise<Run> {
    const r = await this.runs.get(runId);
    if (!r) throw new NotFoundError('run_not_found');
    return r;
  }
}


