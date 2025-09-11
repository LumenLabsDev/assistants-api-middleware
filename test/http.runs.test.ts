import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

const hasRedis = Boolean(process.env.REDIS_URL);

(hasRedis ? describe : describe.skip)('http runs', () => {
  let server: any;
  let close: () => Promise<void>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const app = await buildApp();
    await app.ready();
    server = app.server;
    close = () => app.close();
  });

  afterAll(async () => {
    await close();
  });

  async function createAssistant() {
    const res = await request(server)
      .post('/v1/assistants')
      .send({ name: 'Runner', model: 'gpt-4o', instructions: 'reply ok' })
      .expect(201);
    return res.body.id as string;
  }

  it('creates a run and then fetches it', async () => {
    const thread = await request(server).post('/v1/threads').expect(201);
    await request(server)
      .post(`/v1/threads/${thread.body.id}/messages`)
      .send({ role: 'user', content: 'Hello' })
      .expect(201);

    const assistantId = await createAssistant();

    const run = await request(server)
      .post(`/v1/threads/${thread.body.id}/runs`)
      .send({ assistant_id: assistantId })
      .expect(201);

    const got = await request(server)
      .get(`/v1/threads/${thread.body.id}/runs/${run.body.id}`)
      .expect(200);

    expect(got.body.object).toBe('thread.run');
    expect(['queued', 'in_progress', 'completed', 'failed']).toContain(got.body.status);
  });

  it('returns 404 when fetching a run in a different thread', async () => {
    const t1 = await request(server).post('/v1/threads').expect(201);
    const t2 = await request(server).post('/v1/threads').expect(201);
    const assistantId = await createAssistant();

    const run = await request(server)
      .post(`/v1/threads/${t1.body.id}/runs`)
      .send({ assistant_id: assistantId })
      .expect(201);

    await request(server)
      .get(`/v1/threads/${t2.body.id}/runs/${run.body.id}`)
      .expect(404);
  });

  it('lists runs for a thread', async () => {
    const thread = await request(server).post('/v1/threads').expect(201);
    const assistantId = await createAssistant();

    await request(server)
      .post(`/v1/threads/${thread.body.id}/runs`)
      .send({ assistant_id: assistantId })
      .expect(201);

    const list = await request(server)
      .get(`/v1/threads/${thread.body.id}/runs`)
      .expect(200);

    expect(list.body.object).toBe('list');
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  it('validates run input and returns 400 on missing assistant_id', async () => {
    const thread = await request(server).post('/v1/threads').expect(201);
    const res = await request(server)
      .post(`/v1/threads/${thread.body.id}/runs`)
      .send({})
      .expect(400);
    expect(res.body.error).toBeTruthy();
  });
});
