import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { UsersRepository } from '../repository/users.repository';
import { RedisService } from '../../redis/service/redis.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SUPABASE_ID = 'supa-uuid-001';
const USER_ID = 'db-uuid-001';
const CACHE_KEY = `user:${SUPABASE_ID}`;
const CACHE_TTL = 60;

const baseUser = {
  id: USER_ID,
  supabaseId: SUPABASE_ID,
  email: 'dev@patadev.ke',
  role: UserRole.CLIENT,
  createdAt: new Date(),
  clientProfile: null,
  developerProfile: null,
};

const clientProfileDto = { businessName: 'Jaza Retailers Ltd' };

const createdProfile = {
  id: 'profile-uuid-001',
  userId: USER_ID,
  businessName: 'Jaza Retailers Ltd',
  businessType: null,
  phone: null,
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRepo = {
  findBySupabaseId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  createClientProfile: jest.fn(),
  createDeveloperProfile: jest.fn(),
} as unknown as UsersRepository;

const mockRedis = {
  getJson: jest.fn(),
  setJson: jest.fn(),
  invalidate: jest.fn(),
} as unknown as RedisService;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function buildService(): UsersService {
  return new UsersService(mockRepo, mockRedis);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('UsersService', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // Default: Redis behaves as empty cache — fail-safe contract
    (mockRedis.getJson as jest.Mock).mockResolvedValue(null);
    (mockRedis.setJson as jest.Mock).mockResolvedValue(undefined);
    (mockRedis.invalidate as jest.Mock).mockResolvedValue(undefined);
  });

  // =========================================================================
  // syncFromSupabase
  // =========================================================================

  describe('syncFromSupabase', () => {
    it('returns the existing user and does not create a duplicate when the user already exists', async () => {
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(baseUser);

      const service = buildService();
      const result = await service.syncFromSupabase({
        supabaseId: SUPABASE_ID,
        email: baseUser.email,
        role: UserRole.CLIENT,
      });

      expect(result).toBe(baseUser);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('creates a new user when none exists', async () => {
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(null);
      (mockRepo.create as jest.Mock).mockResolvedValue(baseUser);

      const service = buildService();
      const result = await service.syncFromSupabase({
        supabaseId: SUPABASE_ID,
        email: baseUser.email,
        role: UserRole.CLIENT,
      });

      expect(mockRepo.create).toHaveBeenCalledWith({
        supabaseId: SUPABASE_ID,
        email: baseUser.email,
        role: UserRole.CLIENT,
      });
      expect(result).toBe(baseUser);
    });

    it('populates the Redis cache after creating a new user with the correct key and TTL', async () => {
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(null);
      (mockRepo.create as jest.Mock).mockResolvedValue(baseUser);

      const service = buildService();
      await service.syncFromSupabase({
        supabaseId: SUPABASE_ID,
        email: baseUser.email,
        role: UserRole.CLIENT,
      });

      expect(mockRedis.setJson).toHaveBeenCalledWith(CACHE_KEY, baseUser, CACHE_TTL);
    });

    it('does not populate the Redis cache when the user already existed', async () => {
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(baseUser);

      const service = buildService();
      await service.syncFromSupabase({
        supabaseId: SUPABASE_ID,
        email: baseUser.email,
        role: UserRole.CLIENT,
      });

      expect(mockRedis.setJson).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // findBySupabaseId — cache-aside behavior
  // =========================================================================

  describe('findBySupabaseId', () => {
    it('returns the cached user without hitting the repository on a cache hit', async () => {
      const cachedUser = { ...baseUser };
      (mockRedis.getJson as jest.Mock).mockResolvedValue(cachedUser);

      const service = buildService();
      const result = await service.findBySupabaseId(SUPABASE_ID);

      expect(result).toBe(cachedUser);
      expect(mockRepo.findBySupabaseId).not.toHaveBeenCalled();
    });

    it('queries the repository and returns the user on a cache miss', async () => {
      (mockRedis.getJson as jest.Mock).mockResolvedValue(null);
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(baseUser);

      const service = buildService();
      const result = await service.findBySupabaseId(SUPABASE_ID);

      expect(mockRepo.findBySupabaseId).toHaveBeenCalledWith(SUPABASE_ID);
      expect(result).toBe(baseUser);
    });

    it('repopulates the cache after a cache miss using the correct key and TTL', async () => {
      (mockRedis.getJson as jest.Mock).mockResolvedValue(null);
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(baseUser);

      const service = buildService();
      await service.findBySupabaseId(SUPABASE_ID);

      expect(mockRedis.setJson).toHaveBeenCalledWith(CACHE_KEY, baseUser, CACHE_TTL);
    });

    it('does not repopulate the cache when the repository returns null', async () => {
      (mockRedis.getJson as jest.Mock).mockResolvedValue(null);
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(null);

      const service = buildService();
      await service.findBySupabaseId(SUPABASE_ID);

      expect(mockRedis.setJson).not.toHaveBeenCalled();
    });

    it('falls back to the repository when Redis is unavailable (getJson returns null)', async () => {
      // RedisService.getJson() is fail-safe and returns null on Redis error.
      // UsersService must treat null as a cache miss and continue to the DB.
      (mockRedis.getJson as jest.Mock).mockResolvedValue(null);
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(baseUser);

      const service = buildService();
      const result = await service.findBySupabaseId(SUPABASE_ID);

      expect(mockRepo.findBySupabaseId).toHaveBeenCalledWith(SUPABASE_ID);
      expect(result).toBe(baseUser);
    });
  });

  // =========================================================================
  // createClientProfile — business rules
  // =========================================================================

  describe('createClientProfile', () => {
    it('throws ConflictException when the user is a DEVELOPER (role protection)', async () => {
      const developerUser = { ...baseUser, role: UserRole.DEVELOPER };
      (mockRepo.findById as jest.Mock).mockResolvedValue(developerUser);

      const service = buildService();

      await expect(
        service.createClientProfile(USER_ID, clientProfileDto),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.createClientProfile(USER_ID, clientProfileDto),
      ).rejects.toThrow('User is not a CLIENT');
    });

    it('does not call createClientProfile or invalidate cache when role check fails', async () => {
      const developerUser = { ...baseUser, role: UserRole.DEVELOPER };
      (mockRepo.findById as jest.Mock).mockResolvedValue(developerUser);

      const service = buildService();

      await service.createClientProfile(USER_ID, clientProfileDto).catch(() => {});

      expect(mockRepo.createClientProfile).not.toHaveBeenCalled();
      expect(mockRedis.invalidate).not.toHaveBeenCalled();
    });

    it('throws ConflictException when a CLIENT already has a profile (duplicate protection)', async () => {
      const userWithProfile = {
        ...baseUser,
        role: UserRole.CLIENT,
        clientProfile: { id: 'existing-profile', userId: USER_ID, businessName: 'Old Co' },
      };
      (mockRepo.findById as jest.Mock).mockResolvedValue(userWithProfile);

      const service = buildService();

      await expect(
        service.createClientProfile(USER_ID, clientProfileDto),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.createClientProfile(USER_ID, clientProfileDto),
      ).rejects.toThrow('Client profile already exists');
    });

    it('does not call createClientProfile or invalidate cache when profile already exists', async () => {
      const userWithProfile = {
        ...baseUser,
        role: UserRole.CLIENT,
        clientProfile: { id: 'existing-profile', userId: USER_ID, businessName: 'Old Co' },
      };
      (mockRepo.findById as jest.Mock).mockResolvedValue(userWithProfile);

      const service = buildService();

      await service.createClientProfile(USER_ID, clientProfileDto).catch(() => {});

      expect(mockRepo.createClientProfile).not.toHaveBeenCalled();
      expect(mockRedis.invalidate).not.toHaveBeenCalled();
    });

    it('creates the profile and invalidates the user cache on the happy path', async () => {
      const clientUser = { ...baseUser, role: UserRole.CLIENT, clientProfile: null };
      (mockRepo.findById as jest.Mock).mockResolvedValue(clientUser);
      (mockRepo.createClientProfile as jest.Mock).mockResolvedValue(createdProfile);

      const service = buildService();
      const result = await service.createClientProfile(USER_ID, clientProfileDto);

      expect(mockRepo.createClientProfile).toHaveBeenCalledWith(USER_ID, clientProfileDto);
      expect(result).toBe(createdProfile);
    });

    it('invalidates the cache with the correct key after successful profile creation', async () => {
      const clientUser = { ...baseUser, role: UserRole.CLIENT, clientProfile: null };
      (mockRepo.findById as jest.Mock).mockResolvedValue(clientUser);
      (mockRepo.createClientProfile as jest.Mock).mockResolvedValue(createdProfile);

      const service = buildService();
      await service.createClientProfile(USER_ID, clientProfileDto);

      expect(mockRedis.invalidate).toHaveBeenCalledWith(CACHE_KEY);
    });

    it('throws NotFoundException when user does not exist', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(null);

      const service = buildService();

      await expect(
        service.createClientProfile(USER_ID, clientProfileDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
