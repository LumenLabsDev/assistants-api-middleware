import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

describe('http errors', () => {
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

  it('returns 404 with structured error when thread not found', async () => {
    const res = await request(server).get('/v1/threads/unknown/messages').expect(404);
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.code).toBe('not_found');
  });

  it('returns 400 on validation error', async () => {
    const thread = await request(server).post('/v1/threads').expect(201);
    const res = await request(server)
      .post(`/v1/threads/${thread.body.id}/messages`)
      .send({ role: 'invalid', content: 'x' })
      .expect(400);
    expect(res.body.error).toBeTruthy();
  });
});


