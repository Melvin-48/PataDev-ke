import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

// ---------------------------------------------------------------------------
// ioredis mock
// ---------------------------------------------------------------------------
// RedisService extends Redis (ioredis default export) at the class level.
// The mock must export { __esModule: true, default: class } so that the
// TypeScript/CommonJS import binding resolves to a real constructor.
// Each method is a jest.fn() so individual tests can override behaviour.

let mockGet: jest.Mock;
let mockSetex: jest.Mock;
let mockDel: jest.Mock;
let mockQuit: jest.Mock;

jest.mock('ioredis', () => {
  class RedisMock {
    on = jest.fn().mockReturnThis();
    get = (...args: unknown[]) => mockGet(...args);
    setex = (...args: unknown[]) => mockSetex(...args);
    del = (...args: unknown[]) => mockDel(...args);
    quit = (...args: unknown[]) => mockQuit(...args);
  }
  return { __esModule: true, default: RedisMock };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function buildService(): Promise<RedisService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [RedisService],
  }).compile();
  return module.get<RedisService>(RedisService);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('RedisService', () => {
  beforeEach(() => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    // Default: successful no-op behaviour
    mockGet = jest.fn().mockResolvedValue(null);
    mockSetex = jest.fn().mockResolvedValue('OK');
    mockDel = jest.fn().mockResolvedValue(1);
    mockQuit = jest.fn().mockResolvedValue('OK');
  });

  afterEach(() => {
    delete process.env.REDIS_URL;
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Instantiation
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('should be defined when REDIS_URL is present', async () => {
      const service = await buildService();
      expect(service).toBeDefined();
    });

    it('should throw when REDIS_URL is missing', () => {
      delete process.env.REDIS_URL;
      expect(() => new (RedisService as any)()).toThrow(
        'REDIS_URL must be configured',
      );
    });
  });

  // -------------------------------------------------------------------------
  // getJson
  // -------------------------------------------------------------------------

  describe('getJson', () => {
    it('returns parsed object on a cache hit', async () => {
      const payload = { id: 'abc', email: 'a@b.com' };
      mockGet = jest.fn().mockResolvedValue(JSON.stringify(payload));

      const service = await buildService();
      const result = await service.getJson<typeof payload>('user:abc');

      expect(result).toEqual(payload);
    });

    it('returns null on a cache miss (Redis returns null)', async () => {
      mockGet = jest.fn().mockResolvedValue(null);

      const service = await buildService();
      const result = await service.getJson('user:abc');

      expect(result).toBeNull();
    });

    it('returns null when Redis get rejects — does not throw', async () => {
      mockGet = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const service = await buildService();
      await expect(service.getJson('user:abc')).resolves.toBeNull();
    });

    it('returns null when cached value is malformed JSON — does not throw', async () => {
      mockGet = jest.fn().mockResolvedValue('not-valid-json}{');

      const service = await buildService();
      await expect(service.getJson('user:abc')).resolves.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // setJson
  // -------------------------------------------------------------------------

  describe('setJson', () => {
    it('calls setex with the correct key', async () => {
      const service = await buildService();
      await service.setJson('user:abc', { name: 'Alice' }, 60);

      expect(mockSetex).toHaveBeenCalledWith(
        'user:abc',
        60,
        JSON.stringify({ name: 'Alice' }),
      );
    });

    it('passes the provided TTL in seconds', async () => {
      const service = await buildService();
      await service.setJson('user:abc', {}, 300);

      expect(mockSetex).toHaveBeenCalledWith('user:abc', 300, expect.any(String));
    });

    it('serializes the value with JSON.stringify', async () => {
      const service = await buildService();
      const value = { role: 'CLIENT', id: '123' };
      await service.setJson('user:123', value, 60);

      const [, , serialized] = mockSetex.mock.calls[0];
      expect(serialized).toBe(JSON.stringify(value));
    });

    it('resolves successfully when Redis succeeds', async () => {
      const service = await buildService();
      await expect(service.setJson('user:abc', {}, 60)).resolves.toBeUndefined();
    });

    it('resolves (does not throw) when Redis setex rejects', async () => {
      mockSetex = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const service = await buildService();
      await expect(service.setJson('user:abc', {}, 60)).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // invalidate
  // -------------------------------------------------------------------------

  describe('invalidate', () => {
    it('calls del with the correct key', async () => {
      const service = await buildService();
      await service.invalidate('user:abc');

      expect(mockDel).toHaveBeenCalledWith('user:abc');
    });

    it('resolves successfully when Redis succeeds', async () => {
      const service = await buildService();
      await expect(service.invalidate('user:abc')).resolves.toBeUndefined();
    });

    it('resolves (does not throw) when Redis del rejects', async () => {
      mockDel = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const service = await buildService();
      await expect(service.invalidate('user:abc')).resolves.toBeUndefined();
    });
  });
});
