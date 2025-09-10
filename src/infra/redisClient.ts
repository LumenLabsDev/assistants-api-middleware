import { createClient, RedisClientType } from 'redis';

let cached: RedisClientType | undefined;

/**
 * Lazily create and cache a Redis client using the provided URL or env REDIS_URL.
 */
export async function getRedis(url?: string): Promise<RedisClientType> {
  if (cached) return cached;
  const redisUrl = url ?? process.env.REDIS_URL;
  if (!redisUrl) throw new Error('REDIS_URL is not set');
  const client: RedisClientType = createClient({ url: redisUrl });
  client.on('error', err => {
    // eslint-disable-next-line no-console
    console.error('Redis client error', err);
  });
  await client.connect();
  cached = client;
  return client;
}


