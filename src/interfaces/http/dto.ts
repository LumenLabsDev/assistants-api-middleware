export type AssistantResource = {
  id: string;
  object: 'assistant';
  created_at: number;
  name?: string;
  model?: string;
  instructions?: string;
};

export type ThreadResource = {
  id: string;
  object: 'thread';
  created_at: number;
};

export type MessageTextPart = {
  type: 'text';
  text: { value: string; annotations: any[] };
};

export type MessageResource = {
  id: string;
  object: 'thread.message';
  created_at: number;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageTextPart[];
};

export type RunResource = {
  id: string;
  object: 'thread.run';
  created_at: number;
  thread_id: string;
  assistant_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  completed_at?: number;
  last_error?: { message: string };
};

export type ListResource<T> = {
  object: 'list';
  data: T[];
  has_more: boolean;
};


