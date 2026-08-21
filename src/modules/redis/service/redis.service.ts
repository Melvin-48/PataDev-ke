import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL must be configured');
    }

    super(redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy: (attempt: number) => Math.min(attempt * 200, 5000),
      reconnectOnError: () => true,
    });

    this.on('connect', () => this.logger.log('Redis connecting'));
    this.on('ready', () => this.logger.log('Redis ready'));
    this.on('close', () => this.logger.warn('Redis connection closed'));
    this.on('error', (err: Error) =>
      this.logger.error(`Redis error: ${err.message}`),
    );
  }

  async onModuleDestroy() {
    await this.quit();
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`getJson failed for key "${key}": ${msg}`);
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`setJson failed for key "${key}": ${msg}`);
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      await this.del(key);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`invalidate failed for key "${key}": ${msg}`);
    }
  }
}
