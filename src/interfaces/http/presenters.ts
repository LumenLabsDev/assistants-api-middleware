import { Assistant, Thread, Message, Run } from '../../domain/types.js';
import { AssistantResource, ThreadResource, MessageResource, RunResource, ListResource } from './dto.js';

/**
 * Converts an Assistant entity to an Assistants API resource.
 */
export function toAssistantResource(a: Assistant): AssistantResource {
  return {
    id: a.id,
    object: 'assistant',
    created_at: a.createdAt,
    name: a.name,
    model: a.model,
    instructions: a.instructions,
  };
}

/**
 * Converts a Thread entity to an Assistants API resource.
 */
export function toThreadResource(t: Thread): ThreadResource {
  return {
    id: t.id,
    object: 'thread',
    created_at: t.createdAt,
  };
}

/**
 * Converts a Message entity to an Assistants API-like message with text parts.
 */
export function toMessageResource(m: Message): MessageResource {
  return {
    id: m.id,
    object: 'thread.message',
    created_at: m.createdAt,
    thread_id: m.threadId,
    role: m.role,
    content: [
      {
        type: 'text',
        text: { value: m.content, annotations: [] as any[] },
      },
    ],
  };
}

/**
 * Converts a Run entity to an Assistants API resource.
 */
export function toRunResource(r: Run): RunResource {
  return {
    id: r.id,
    object: 'thread.run',
    created_at: r.createdAt,
    thread_id: r.threadId,
    assistant_id: r.assistantId,
    status: r.status,
    completed_at: r.completedAt,
    last_error: r.lastError ? { message: r.lastError } : undefined,
  };
}

/**
 * Wraps a list of resources into an Assistants API list response.
 */
export function toList<T>(items: T[]): ListResource<T> {
  return { object: 'list', data: items, has_more: false };
}


