/**
 * Input shape for creating an assistant.
 */
export type AssistantCreateInput = {
  name?: string;
  instructions?: string;
  model?: string;
};

/**
 * Input shape for updating an assistant.
 */
export type AssistantUpdateInput = Partial<AssistantCreateInput>;

/** Input for adding a message to a thread. */
export type ThreadMessageCreateInput = {
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/** Input for creating a run. */
export type RunCreateInput = {
  threadId: string;
  assistantId: string;
  temperature?: number;
};


