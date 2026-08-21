import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

// redis.service.ts uses `import Redis from 'ioredis'` (ESM default import compiled
// to CommonJS). jest.mock must mirror the module shape exactly:
// { __esModule: true, default: <class> }  so that the `default` binding resolves
// to a real constructor function rather than `undefined`.
jest.mock('ioredis', () => {
  class RedisMock {
    constructor(_url: string) {}
    quit = jest.fn().mockResolvedValue('OK');
    get = jest.fn().mockResolvedValue(null);
    setex = jest.fn().mockResolvedValue('OK');
    del = jest.fn().mockResolvedValue(1);
  }
  return { __esModule: true, default: RedisMock };
});

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    delete process.env.REDIS_URL;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
