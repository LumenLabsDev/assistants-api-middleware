import OpenAI from 'openai';
import { ResponsesClient } from '../domain/ports.js';
import { createLogger } from '../logger.js';
import { ExternalServiceError } from '../domain/errors.js';

const logger = createLogger('infra:responses');

export class OpenAIResponsesClient implements ResponsesClient {
  private client?: OpenAI;

  private getClient(apiKey?: string): OpenAI {
    if (!this.client) {
      const key = apiKey ?? process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is missing');
      this.client = new OpenAI({ apiKey: key });
    }
    return this.client;
  }

  /**
   * Create a text response using OpenAI Responses API.
   * Wraps API errors into `ExternalServiceError`.
   */
  async createTextResponse(opts: { model: string; input: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> | string; temperature?: number }): Promise<string> {
    const client = this.getClient();
    logger.debug('responses.create', { model: opts.model });

    try {
      const response = await client.responses.create({
        model: opts.model,
        input:
          typeof opts.input === 'string'
            ? opts.input
            : opts.input.map(m => ({ role: m.role, content: [{ type: 'input_text', text: m.content }] })),
        temperature: opts.temperature,
      } as any);

      const text = (response as any).output_text
        ?? ((response as any).output ?? [])
          .flatMap((o: any) => (o?.content ?? []).map((p: any) => p?.text).filter(Boolean))
          .join('\n');
      return String(text ?? '').trim();
    } catch (e: any) {
      logger.error('responses.error', { message: e?.message });
      throw new ExternalServiceError(e?.message ?? 'Failed to create response');
    }
  }
}


