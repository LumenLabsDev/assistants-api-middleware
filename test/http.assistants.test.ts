import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

const hasRedis = Boolean(process.env.REDIS_URL);

(hasRedis ? describe : describe.skip)('http assistants', () => {
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

  it('creates assistant and returns resource shape', async () => {
    const res = await request(server)
      .post('/v1/assistants')
      .send({ name: 'A', model: 'gpt-4o', instructions: 'hi' })
      .expect(201);

    expect(res.body.object).toBe('assistant');
    expect(res.body.id).toBeTruthy();
    expect(res.body.created_at).toBeGreaterThan(0);
    expect(res.body.name).toBe('A');
    expect(res.body.model).toBe('gpt-4o');
    expect(res.body.instructions).toBe('hi');
  });

  it('lists assistants as list resource', async () => {
    await request(server).post('/v1/assistants').send({ name: 'B', model: 'gpt-4o' }).expect(201);

    const res = await request(server).get('/v1/assistants').expect(200);
    expect(res.body.object).toBe('list');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.has_more).toBe(false);
  });

  it('gets an assistant by id', async () => {
    const created = await request(server).post('/v1/assistants').send({ name: 'C', model: 'gpt-4o' }).expect(201);
    const res = await request(server).get(`/v1/assistants/${created.body.id}`).expect(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.object).toBe('assistant');
  });

  it('updates an assistant and returns new values', async () => {
    const created = await request(server).post('/v1/assistants').send({ name: 'D', model: 'gpt-4o' }).expect(201);

    const updated = await request(server)
      .post(`/v1/assistants/${created.body.id}`)
      .send({ name: 'D2', instructions: 'rules' })
      .expect(200);

    expect(updated.body.name).toBe('D2');
    expect(updated.body.instructions).toBe('rules');
  });

  it('returns 404 on updating missing assistant', async () => {
    const res = await request(server)
      .post('/v1/assistants/asst_missing')
      .send({ name: 'X' })
      .expect(404);

    expect(res.body.error).toBeTruthy();
  });

  it('rejects unsupported model with 400', async () => {
    const res = await request(server)
      .post('/v1/assistants')
      .send({ model: 'not-a-model' })
      .expect(400);
    expect(res.body.error).toBeTruthy();
  });
});
