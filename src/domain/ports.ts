import { Assistant, Thread, Message, Run } from './types.js';

/**
 * ID generator abstraction for repositories.
 */
export interface IdGenerator {
  generateId(prefix: string): string;
}

/**
 * Repository port for `Assistant` persistence.
 */
export interface AssistantsRepository {
  /** Create a new assistant. */
  create(data: Omit<Assistant, 'id' | 'createdAt'>): Promise<Assistant>;
  /** Retrieve an assistant by id. */
  get(id: string): Promise<Assistant | null>;
  /** List all assistants. */
  list(): Promise<Assistant[]>;
  /** Update an existing assistant. */
  update(id: string, data: Partial<Omit<Assistant, 'id' | 'createdAt'>>): Promise<Assistant | null>;
}

/**
 * Repository port for `Thread` persistence.
 */
export interface ThreadsRepository {
  create(): Promise<Thread>;
  get(id: string): Promise<Thread | null>;
}

/**
 * Repository port for `Message` persistence.
 */
export interface MessagesRepository {
  add(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  listByThread(threadId: string): Promise<Message[]>;
}

/**
 * Repository port for `Run` persistence.
 */
export interface RunsRepository {
  create(run: Omit<Run, 'id' | 'createdAt'>): Promise<Run>;
  update(id: string, data: Partial<Run>): Promise<Run | null>;
  get(id: string): Promise<Run | null>;
  listByThread(threadId: string): Promise<Run[]>;
}

/**
 * Client port for interacting with text generation Responses API.
 */
export interface ResponsesClient {
  createTextResponse(opts: {
    model: string;
    input: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> | string;
    temperature?: number;
  }): Promise<string>;
}


