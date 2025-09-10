import { z } from 'zod';
import { SUPPORTED_MODELS } from '../../domain/models.js';
import { ValidationError } from '../../domain/errors.js';

/**
 * Zod schema for creating an assistant.
 */
export const AssistantCreateSchema = z.object({
  name: z.string().optional(),
  instructions: z.string().optional(),
  model: z.enum(SUPPORTED_MODELS as unknown as [string, ...string[]]).optional(),
});

/** Partial schema for updating an assistant. */
export const AssistantUpdateSchema = AssistantCreateSchema.partial();

/**
 * Zod schema for creating a message.
 */
export const MessageCreateSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']).default('user'),
  content: z.string().default(''),
});

/**
 * Zod schema for creating a run.
 */
export const RunCreateSchema = z.object({
  assistant_id: z.string(),
  temperature: z.number().min(0).max(2).optional(),
});

export type AssistantCreate = z.infer<typeof AssistantCreateSchema>;
export type AssistantUpdate = z.infer<typeof AssistantUpdateSchema>;
export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type RunCreate = z.infer<typeof RunCreateSchema>;

/**
 * Safe-parse helper that throws a domain `ValidationError` on failure.
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const message = Object.values(flattened.fieldErrors)
      .flat()
      .filter(Boolean)
      .join(', ') || 'Invalid request';
    throw new ValidationError(message);
  }
  return parsed.data;
}


