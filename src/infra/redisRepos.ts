import { Assistant, Message, Run, Thread } from '../domain/types.js';
import { AssistantsRepository, IdGenerator, MessagesRepository, RunsRepository, ThreadsRepository } from '../domain/ports.js';
import { getRedis } from './redisClient.js';

const key = {
  assistant: (id: string) => `asst:${id}`,
  assistants: () => `asst:index`,
  thread: (id: string) => `thread:${id}`,
  message: (id: string) => `msg:${id}`,
  messagesByThread: (threadId: string) => `thread:${threadId}:messages`,
  run: (id: string) => `run:${id}`,
  runsByThread: (threadId: string) => `thread:${threadId}:runs`,
};

export class RedisAssistantsRepo implements AssistantsRepository {
  constructor(private ids: IdGenerator) {}
  async create(data: Omit<Assistant, 'id' | 'createdAt'>): Promise<Assistant> {
    const id = this.ids.generateId('asst');
    const assistant: Assistant = { id, createdAt: Math.floor(Date.now() / 1000), ...data };
    const redis = await getRedis();
    await redis.multi()
      .set(key.assistant(id), JSON.stringify(assistant))
      .sAdd(key.assistants(), id)
      .exec();
    return assistant;
  }
  async get(id: string): Promise<Assistant | null> {
    const redis = await getRedis();
    const val = await redis.get(key.assistant(id));
    return val ? (JSON.parse(val) as Assistant) : null;
  }
  async list(): Promise<Assistant[]> {
    const redis = await getRedis();
    const ids = await redis.sMembers(key.assistants());
    if (ids.length === 0) return [];
    const values = await redis.mGet(ids.map(key.assistant));
    return values.filter(Boolean).map(v => JSON.parse(v as string) as Assistant);
  }
  async update(id: string, data: Partial<Omit<Assistant, 'id' | 'createdAt'>>): Promise<Assistant | null> {
    const current = await this.get(id);
    if (!current) return null;
    const updated = { ...current, ...data } as Assistant;
    const redis = await getRedis();
    await redis.set(key.assistant(id), JSON.stringify(updated));
    return updated;
  }
}

export class RedisThreadsRepo implements ThreadsRepository {
  constructor(private ids: IdGenerator) {}
  async create(): Promise<Thread> {
    const id = this.ids.generateId('thread');
    const thread: Thread = { id, createdAt: Math.floor(Date.now() / 1000) };
    const redis = await getRedis();
    await redis.set(key.thread(id), JSON.stringify(thread));
    return thread;
  }
  async get(id: string): Promise<Thread | null> {
    const redis = await getRedis();
    const val = await redis.get(key.thread(id));
    return val ? (JSON.parse(val) as Thread) : null;
  }
}

export class RedisMessagesRepo implements MessagesRepository {
  constructor(private ids: IdGenerator) {}
  async add(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const id = this.ids.generateId('msg');
    const saved: Message = { id, createdAt: Math.floor(Date.now() / 1000), ...message };
    const redis = await getRedis();
    await redis.multi()
      .set(key.message(id), JSON.stringify(saved))
      .rPush(key.messagesByThread(message.threadId), id)
      .exec();
    return saved;
  }
  async listByThread(threadId: string): Promise<Message[]> {
    const redis = await getRedis();
    const ids = await redis.lRange(key.messagesByThread(threadId), 0, -1);
    if (ids.length === 0) return [];
    const values = await redis.mGet(ids.map(key.message));
    return values.filter(Boolean).map(v => JSON.parse(v as string) as Message)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
  async deleteInThread(threadId: string, messageId: string): Promise<boolean> {
    const redis = await getRedis();
    await redis.multi()
      .lRem(key.messagesByThread(threadId), 0, messageId)
      .del(key.message(messageId))
      .exec();
    return true;
  }
  async deleteManyInThread(threadId: string, messageIds: string[]): Promise<number> {
    if (messageIds.length === 0) return 0;
    const redis = await getRedis();
    const multi = redis.multi();
    for (const id of messageIds) {
      multi.lRem(key.messagesByThread(threadId), 0, id);
      multi.del(key.message(id));
    }
    await multi.exec();
    return messageIds.length;
  }
}

export class RedisRunsRepo implements RunsRepository {
  constructor(private ids: IdGenerator) {}
  async create(run: Omit<Run, 'id' | 'createdAt'>): Promise<Run> {
    const id = this.ids.generateId('run');
    const saved: Run = { id, createdAt: Math.floor(Date.now() / 1000), ...run };
    const redis = await getRedis();
    await redis.multi()
      .set(key.run(id), JSON.stringify(saved))
      .rPush(key.runsByThread(run.threadId), id)
      .exec();
    return saved;
  }
  async update(id: string, data: Partial<Run>): Promise<Run | null> {
    const current = await this.get(id);
    if (!current) return null;
    const updated = { ...current, ...data } as Run;
    const redis = await getRedis();
    await redis.set(key.run(id), JSON.stringify(updated));
    return updated;
  }
  async updateInThread(threadId: string, id: string, data: Partial<Run>): Promise<Run | null> {
    const current = await this.getInThread(threadId, id);
    if (!current) return null;
    const updated = { ...current, ...data } as Run;
    const redis = await getRedis();
    await redis.set(key.run(id), JSON.stringify(updated));
    return updated;
  }
  async get(id: string): Promise<Run | null> {
    const redis = await getRedis();
    const val = await redis.get(key.run(id));
    return val ? (JSON.parse(val) as Run) : null;
  }
  async getInThread(threadId: string, id: string): Promise<Run | null> {
    const run = await this.get(id);
    if (!run) return null;
    return run.threadId === threadId ? run : null;
  }
  async listByThread(threadId: string): Promise<Run[]> {
    const redis = await getRedis();
    const ids = await redis.lRange(key.runsByThread(threadId), 0, -1);
    if (ids.length === 0) return [];
    const values = await redis.mGet(ids.map(key.run));
    return values
      .filter(Boolean)
      .map(v => JSON.parse(v as string) as Run)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
}


