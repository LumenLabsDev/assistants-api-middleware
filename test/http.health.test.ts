import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

const hasRedis = Boolean(process.env.REDIS_URL);

(hasRedis ? describe : describe.skip)('http health', () => {
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

  it('returns ok', async () => {
    const res = await request(server).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});
