import { ResponsesClient } from '../domain/ports.js';

/**
 * Test double for `ResponsesClient` returning a fixed response.
 */
export class FakeResponsesClient implements ResponsesClient {
  async createTextResponse(_: { model: string; input: any; temperature?: number }): Promise<string> {
    return 'ok';
  }
}


