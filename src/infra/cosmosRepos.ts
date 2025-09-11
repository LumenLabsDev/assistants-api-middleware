import { Assistant, Message, Run, Thread } from '../domain/types.js';
import { AssistantsRepository, IdGenerator, MessagesRepository, RunsRepository, ThreadsRepository } from '../domain/ports.js';
import { getContainer } from './cosmosClient.js';
import { createLogger } from '../logger.js';

const logger = createLogger('infra:cosmos-repos');

export class CosmosAssistantsRepo implements AssistantsRepository {
  constructor(private ids: IdGenerator) {}

  async create(data: Omit<Assistant, 'id' | 'createdAt'>): Promise<Assistant> {
    const id = this.ids.generateId('asst');
    const assistant: Assistant = { 
      id, 
      createdAt: Math.floor(Date.now() / 1000), 
      ...data 
    };

    const container = await getContainer('assistants');
    await container.items.create(assistant);
    
    logger.debug('assistant.created', { id });
    return assistant;
  }

  async get(id: string): Promise<Assistant | null> {
    try {
      const container = await getContainer('assistants');
      const { resource } = await container.item(id, id).read<Assistant>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  async list(): Promise<Assistant[]> {
    const container = await getContainer('assistants');
    const { resources } = await container.items
      .query<Assistant>('SELECT * FROM c ORDER BY c.createdAt DESC')
      .fetchAll();
    return resources;
  }

  async update(id: string, data: Partial<Omit<Assistant, 'id' | 'createdAt'>>): Promise<Assistant | null> {
    const current = await this.get(id);
    if (!current) return null;

    const updated = { ...current, ...data } as Assistant;
    const container = await getContainer('assistants');
    await container.item(id, id).replace(updated);
    
    logger.debug('assistant.updated', { id });
    return updated;
  }
}

export class CosmosThreadsRepo implements ThreadsRepository {
  constructor(private ids: IdGenerator) {}

  async create(): Promise<Thread> {
    const id = this.ids.generateId('thread');
    const thread: Thread = { 
      id, 
      createdAt: Math.floor(Date.now() / 1000) 
    };

    const container = await getContainer('threads');
    await container.items.create(thread);
    
    logger.debug('thread.created', { id });
    return thread;
  }

  async get(id: string): Promise<Thread | null> {
    try {
      const container = await getContainer('threads');
      const { resource } = await container.item(id, id).read<Thread>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }
}

export class CosmosMessagesRepo implements MessagesRepository {
  constructor(private ids: IdGenerator) {}

  async add(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const id = this.ids.generateId('msg');
    const saved: Message = { 
      id, 
      createdAt: Math.floor(Date.now() / 1000), 
      ...message 
    };

    const container = await getContainer('messages');
    await container.items.create(saved);
    
    logger.debug('message.added', { id, threadId: message.threadId });
    return saved;
  }

  async listByThread(threadId: string): Promise<Message[]> {
    const container = await getContainer('messages');
    const { resources } = await container.items
      .query<Message>({
        query: 'SELECT * FROM c WHERE c.threadId = @threadId ORDER BY c.createdAt ASC',
        parameters: [{ name: '@threadId', value: threadId }]
      })
      .fetchAll();
    return resources;
  }
}

export class CosmosRunsRepo implements RunsRepository {
  constructor(private ids: IdGenerator) {}

  async create(run: Omit<Run, 'id' | 'createdAt'>): Promise<Run> {
    const id = this.ids.generateId('run');
    const saved: Run = { 
      id, 
      createdAt: Math.floor(Date.now() / 1000), 
      ...run 
    };

    const container = await getContainer('runs');
    await container.items.create(saved);
    
    logger.debug('run.created', { id, threadId: run.threadId });
    return saved;
  }

  /**
   * Update a run by id, resolving and using its threadId as partition key.
   */
  async update(id: string, data: Partial<Run>): Promise<Run | null> {
    const current = await this.get(id);
    if (!current) return null;

    const updated = { ...current, ...data } as Run;
    const container = await getContainer('runs');
    await container.item(id, current.threadId).replace(updated);
    
    logger.debug('run.updated', { id, threadId: current.threadId });
    return updated;
  }

  async updateInThread(threadId: string, id: string, data: Partial<Run>): Promise<Run | null> {
    const current = await this.getInThread(threadId, id);
    if (!current) return null;
    const updated = { ...current, ...data } as Run;
    const container = await getContainer('runs');
    await container.item(id, threadId).replace(updated);
    logger.debug('run.updated_in_thread', { id, threadId });
    return updated;
  }

  /**
   * Get a run by id via query when partition key is unknown.
   */
  async get(id: string): Promise<Run | null> {
    const container = await getContainer('runs');
    const { resources } = await container.items
      .query<Run>({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }]
      })
      .fetchAll();
    
    return resources.length > 0 ? resources[0] : null;
  }

  async getInThread(threadId: string, id: string): Promise<Run | null> {
    try {
      const container = await getContainer('runs');
      const { resource } = await container.item(id, threadId).read<Run>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  async listByThread(threadId: string): Promise<Run[]> {
    const container = await getContainer('runs');
    const { resources } = await container.items
      .query<Run>({
        query: 'SELECT * FROM c WHERE c.threadId = @threadId ORDER BY c.createdAt ASC',
        parameters: [{ name: '@threadId', value: threadId }]
      })
      .fetchAll();
    return resources;
  }
}
