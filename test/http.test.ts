import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

const hasRedis = Boolean(process.env.REDIS_URL);

(hasRedis ? describe : describe.skip)('http', () => {
  it('assistant → thread → message → run', async () => {
    const app = await buildApp();
    await app.ready();
    const server = app.server;

    const asst = await request(server)
      .post('/v1/assistants')
      .send({ name: 'A', model: 'gpt-4o', instructions: 'keep it short' })
      .expect(201);

    const thread = await request(server).post('/v1/threads').expect(201);

    await request(server)
      .post(`/v1/threads/${thread.body.id}/messages`)
      .send({ role: 'user', content: 'Hello' })
      .expect(201);

    const run = await request(server)
      .post(`/v1/threads/${thread.body.id}/runs`)
      .send({ assistant_id: asst.body.id })
      .expect(201);

    expect(run.body.id).toBeTruthy();

    await app.close();
  }, 15000);
});


