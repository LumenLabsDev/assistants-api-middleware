import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

const hasRedis = Boolean(process.env.REDIS_URL);

(hasRedis ? describe : describe.skip)('http threads/messages', () => {
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

  it('creates a thread and lists messages (empty initially)', async () => {
    const t = await request(server).post('/v1/threads').expect(201);
    const res = await request(server).get(`/v1/threads/${t.body.id}/messages`).expect(200);
    expect(res.body.object).toBe('list');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it('creates message with defaults when role/content not provided', async () => {
    const t = await request(server).post('/v1/threads').expect(201);
    const msg = await request(server)
      .post(`/v1/threads/${t.body.id}/messages`)
      .send({})
      .expect(201);

    expect(msg.body.object).toBe('thread.message');
    expect(msg.body.role).toBe('user');
    expect(msg.body.content[0]?.text?.value).toBe('');

    const list = await request(server).get(`/v1/threads/${t.body.id}/messages`).expect(200);
    expect(list.body.data.length).toBe(1);
  });

  it('deletes a single message via HTTP', async () => {
    const t = await request(server).post('/v1/threads').expect(201);
    const m1 = await request(server)
      .post(`/v1/threads/${t.body.id}/messages`)
      .send({ role: 'user', content: 'Hello' })
      .expect(201);
    const m2 = await request(server)
      .post(`/v1/threads/${t.body.id}/messages`)
      .send({ role: 'assistant', content: 'Reply' })
      .expect(201);

    await request(server)
      .delete(`/v1/threads/${t.body.id}/messages/${m2.body.id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.id).toBe(m2.body.id);
        expect(res.body.deleted).toBe(true);
      });

    const list = await request(server).get(`/v1/threads/${t.body.id}/messages`).expect(200);
    expect(list.body.data.map((x: any) => x.id)).toEqual([m1.body.id]);
  });

  it('deletes assistant+preceding user pair via HTTP', async () => {
    const t = await request(server).post('/v1/threads').expect(201);
    const u = await request(server)
      .post(`/v1/threads/${t.body.id}/messages`)
      .send({ role: 'user', content: 'Q' })
      .expect(201);
    const a = await request(server)
      .post(`/v1/threads/${t.body.id}/messages`)
      .send({ role: 'assistant', content: 'A' })
      .expect(201);

    const res = await request(server)
      .delete(`/v1/threads/${t.body.id}/messages/${a.body.id}?cascade=pair`)
      .expect(200);

    expect(res.body.object).toBe('list');
    const deletedIds = res.body.data.map((d: any) => d.id).sort();
    expect(deletedIds).toEqual([u.body.id, a.body.id].sort());

    const list = await request(server).get(`/v1/threads/${t.body.id}/messages`).expect(200);
    expect(list.body.data.length).toBe(0);
  });
});
