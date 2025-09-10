import { Assistant, Thread, Message, Run } from '../domain/types.js';
import { AssistantsRepository, ThreadsRepository, MessagesRepository, RunsRepository, IdGenerator } from '../domain/ports.js';

/**
 * Pseudo-random ID generator for demo repositories.
 */
export class RandomIdGenerator implements IdGenerator {
  generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export class InMemoryAssistantsRepo implements AssistantsRepository {
  private data = new Map<string, Assistant>();
  constructor(private ids: IdGenerator) {}
  /** Create and store an assistant in-memory. */
  async create(data: Omit<Assistant, 'id' | 'createdAt'>): Promise<Assistant> {
    const id = this.ids.generateId('asst');
    const assistant: Assistant = { id, createdAt: Math.floor(Date.now() / 1000), ...data };
    this.data.set(id, assistant);
    return assistant;
  }
  /** Retrieve an assistant by id. */
  async get(id: string): Promise<Assistant | null> { return this.data.get(id) ?? null; }
  /** List all assistants. */
  async list(): Promise<Assistant[]> { return Array.from(this.data.values()); }
  /** Update a stored assistant. */
  async update(id: string, data: Partial<Omit<Assistant, 'id' | 'createdAt'>>): Promise<Assistant | null> {
    const current = this.data.get(id);
    if (!current) return null;
    const updated = { ...current, ...data };
    this.data.set(id, updated);
    return updated;
  }
}

export class InMemoryThreadsRepo implements ThreadsRepository {
  private data = new Map<string, Thread>();
  constructor(private ids: IdGenerator) {}
  /** Create a new thread. */
  async create(): Promise<Thread> {
    const id = this.ids.generateId('thread');
    const thread: Thread = { id, createdAt: Math.floor(Date.now() / 1000) };
    this.data.set(id, thread);
    return thread;
  }
  /** Retrieve a thread by id. */
  async get(id: string): Promise<Thread | null> { return this.data.get(id) ?? null; }
}

export class InMemoryMessagesRepo implements MessagesRepository {
  private data = new Map<string, Message>();
  constructor(private ids: IdGenerator) {}
  /** Add a message to the in-memory store. */
  async add(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const id = this.ids.generateId('msg');
    const saved: Message = { id, createdAt: Math.floor(Date.now() / 1000), ...message };
    this.data.set(id, saved);
    return saved;
  }
  /** List messages for a thread ordered by creation time. */
  async listByThread(threadId: string): Promise<Message[]> {
    return Array.from(this.data.values())
      .filter(m => m.threadId === threadId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
}

export class InMemoryRunsRepo implements RunsRepository {
  private data = new Map<string, Run>();
  constructor(private ids: IdGenerator) {}
  /** Create a run. */
  async create(run: Omit<Run, 'id' | 'createdAt'>): Promise<Run> {
    const id = this.ids.generateId('run');
    const saved: Run = { id, createdAt: Math.floor(Date.now() / 1000), ...run };
    this.data.set(id, saved);
    return saved;
  }
  /** Update a run. */
  async update(id: string, data: Partial<Run>): Promise<Run | null> {
    const current = this.data.get(id);
    if (!current) return null;
    const updated = { ...current, ...data };
    this.data.set(id, updated);
    return updated;
  }
  /** Retrieve a run by id. */
  async get(id: string): Promise<Run | null> { return this.data.get(id) ?? null; }
  /** List runs for a thread. */
  async listByThread(threadId: string): Promise<Run[]> {
    return Array.from(this.data.values()).filter(r => r.threadId === threadId);
  }
}


