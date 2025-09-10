/**
 * Assistant entity.
 */
export type Assistant = {
  id: string;
  name?: string;
  instructions?: string;
  model?: string;
  createdAt: number;
};

/**
 * Thread entity that groups a conversation.
 */
export type Thread = {
  id: string;
  createdAt: number;
};

/**
 * Message entity belonging to a thread.
 */
export type Message = {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
};

/**
 * Run entity representing an execution of the assistant over a thread's messages.
 */
export type Run = {
  id: string;
  threadId: string;
  assistantId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  lastError?: string;
  responseMessageId?: string;
};


