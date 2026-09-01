import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { UsersRepository } from '../repository/users.repository';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SUPABASE_ID = 'supa-uuid-001';
const USER_ID = 'db-uuid-001';

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

const developerProfileDto = {
  displayName: 'Jane Dev',
  techStack: ['React', 'NestJS'],
};

const createdDeveloperProfile = {
  id: 'dev-profile-uuid-001',
  userId: USER_ID,
  displayName: 'Jane Dev',
  bio: null,
  techStack: ['React', 'NestJS'],
  portfolioUrl: null,
  listingTier: null,
};

const mockRepo = {
  findBySupabaseId: jest.fn(),
  findByEmail: jest.fn(),
  updateSupabaseId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  createClientProfile: jest.fn(),
  createDeveloperProfile: jest.fn(),
  updateClientProfile: jest.fn(),
  updateDeveloperProfile: jest.fn(),
} as unknown as UsersRepository;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function buildService(): UsersService {
  return new UsersService(mockRepo);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('UsersService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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
      (mockRepo.findByEmail as jest.Mock).mockResolvedValue(null);
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

    it('updates an existing user if they are found by email instead of supabaseId', async () => {
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(null);
      (mockRepo.findByEmail as jest.Mock).mockResolvedValue(baseUser);
      (mockRepo.updateSupabaseId as jest.Mock).mockResolvedValue({
        ...baseUser,
        supabaseId: 'new-supabase-id',
      });

      const service = buildService();
      const result = await service.syncFromSupabase({
        supabaseId: 'new-supabase-id',
        email: baseUser.email,
        role: UserRole.CLIENT,
      });

      expect(mockRepo.findByEmail).toHaveBeenCalledWith(baseUser.email);
      expect(mockRepo.updateSupabaseId).toHaveBeenCalledWith(baseUser.id, 'new-supabase-id');
      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(result.supabaseId).toBe('new-supabase-id');
    });
  });

  // =========================================================================
  // findBySupabaseId
  // =========================================================================

  describe('findBySupabaseId', () => {
    it('queries the repository and returns the user', async () => {
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(baseUser);

      const service = buildService();
      const result = await service.findBySupabaseId(SUPABASE_ID);

      expect(mockRepo.findBySupabaseId).toHaveBeenCalledWith(SUPABASE_ID);
      expect(result).toBe(baseUser);
    });

    it('returns null when user does not exist', async () => {
      (mockRepo.findBySupabaseId as jest.Mock).mockResolvedValue(null);

      const service = buildService();
      const result = await service.findBySupabaseId(SUPABASE_ID);

      expect(result).toBeNull();
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

    it('does not call createClientProfile when role check fails', async () => {
      const developerUser = { ...baseUser, role: UserRole.DEVELOPER };
      (mockRepo.findById as jest.Mock).mockResolvedValue(developerUser);

      const service = buildService();

      await service.createClientProfile(USER_ID, clientProfileDto).catch(() => {});

      expect(mockRepo.createClientProfile).not.toHaveBeenCalled();
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

    it('does not call createClientProfile when profile already exists', async () => {
      const userWithProfile = {
        ...baseUser,
        role: UserRole.CLIENT,
        clientProfile: { id: 'existing-profile', userId: USER_ID, businessName: 'Old Co' },
      };
      (mockRepo.findById as jest.Mock).mockResolvedValue(userWithProfile);

      const service = buildService();

      await service.createClientProfile(USER_ID, clientProfileDto).catch(() => {});

      expect(mockRepo.createClientProfile).not.toHaveBeenCalled();
    });

    it('creates the profile on the happy path', async () => {
      const clientUser = { ...baseUser, role: UserRole.CLIENT, clientProfile: null };
      (mockRepo.findById as jest.Mock).mockResolvedValue(clientUser);
      (mockRepo.createClientProfile as jest.Mock).mockResolvedValue(createdProfile);

      const service = buildService();
      const result = await service.createClientProfile(USER_ID, clientProfileDto);

      expect(mockRepo.createClientProfile).toHaveBeenCalledWith(USER_ID, clientProfileDto);
      expect(result).toBe(createdProfile);
    });

    it('throws NotFoundException when user does not exist', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(null);

      const service = buildService();

      await expect(
        service.createClientProfile(USER_ID, clientProfileDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // createDeveloperProfile — business rules
  // =========================================================================

  describe('createDeveloperProfile', () => {
    it('throws ConflictException when the user is a CLIENT (role protection)', async () => {
      const clientUser = { ...baseUser, role: UserRole.CLIENT };
      (mockRepo.findById as jest.Mock).mockResolvedValue(clientUser);

      const service = buildService();

      await expect(
        service.createDeveloperProfile(USER_ID, developerProfileDto),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.createDeveloperProfile(USER_ID, developerProfileDto),
      ).rejects.toThrow('User is not a DEVELOPER');
    });

    it('does not call createDeveloperProfile when role check fails', async () => {
      const clientUser = { ...baseUser, role: UserRole.CLIENT };
      (mockRepo.findById as jest.Mock).mockResolvedValue(clientUser);

      const service = buildService();
      await service.createDeveloperProfile(USER_ID, developerProfileDto).catch(() => {});

      expect(mockRepo.createDeveloperProfile).not.toHaveBeenCalled();
    });

    it('throws ConflictException when a DEVELOPER already has a profile (duplicate protection)', async () => {
      const devWithProfile = {
        ...baseUser,
        role: UserRole.DEVELOPER,
        developerProfile: { id: 'existing-dev-profile', userId: USER_ID, displayName: 'Old' },
      };
      (mockRepo.findById as jest.Mock).mockResolvedValue(devWithProfile);

      const service = buildService();

      await expect(
        service.createDeveloperProfile(USER_ID, developerProfileDto),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.createDeveloperProfile(USER_ID, developerProfileDto),
      ).rejects.toThrow('Developer profile already exists');
    });

    it('creates the developer profile on the happy path', async () => {
      const devUser = { ...baseUser, role: UserRole.DEVELOPER, developerProfile: null };
      (mockRepo.findById as jest.Mock).mockResolvedValue(devUser);
      (mockRepo.createDeveloperProfile as jest.Mock).mockResolvedValue(createdDeveloperProfile);

      const service = buildService();
      const result = await service.createDeveloperProfile(USER_ID, developerProfileDto);

      expect(mockRepo.createDeveloperProfile).toHaveBeenCalledWith(USER_ID, developerProfileDto);
      expect(result).toBe(createdDeveloperProfile);
    });
  });

  // =========================================================================
  // updateClientProfile — business rules
  // =========================================================================

  describe('updateClientProfile', () => {
    it('throws NotFoundException when the client profile does not exist', async () => {
      const clientUserNoProfile = { ...baseUser, role: UserRole.CLIENT, clientProfile: null };
      (mockRepo.findById as jest.Mock).mockResolvedValue(clientUserNoProfile);

      const service = buildService();

      await expect(
        service.updateClientProfile(USER_ID, { businessName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.updateClientProfile(USER_ID, { businessName: 'New Name' }),
      ).rejects.toThrow('Client profile not found. Create a profile first.');
    });

    it('does not call updateClientProfile when profile does not exist', async () => {
      const clientUserNoProfile = { ...baseUser, role: UserRole.CLIENT, clientProfile: null };
      (mockRepo.findById as jest.Mock).mockResolvedValue(clientUserNoProfile);

      const service = buildService();
      await service.updateClientProfile(USER_ID, { businessName: 'New Name' }).catch(() => {});

      expect(mockRepo.updateClientProfile).not.toHaveBeenCalled();
    });

    it('updates the client profile on the happy path', async () => {
      const userWithProfile = {
        ...baseUser,
        role: UserRole.CLIENT,
        clientProfile: { id: 'profile-uuid-001', userId: USER_ID, businessName: 'Old Co' },
      };
      const updatedProfile = { ...createdProfile, businessName: 'New Co' };
      (mockRepo.findById as jest.Mock).mockResolvedValue(userWithProfile);
      (mockRepo.updateClientProfile as jest.Mock).mockResolvedValue(updatedProfile);

      const service = buildService();
      const result = await service.updateClientProfile(USER_ID, { businessName: 'New Co' });

      expect(mockRepo.updateClientProfile).toHaveBeenCalledWith(USER_ID, { businessName: 'New Co' });
      expect(result).toBe(updatedProfile);
    });
  });

  // =========================================================================
  // updateDeveloperProfile — business rules
  // =========================================================================

  describe('updateDeveloperProfile', () => {
    it('throws NotFoundException when the developer profile does not exist', async () => {
      const devUserNoProfile = { ...baseUser, role: UserRole.DEVELOPER, developerProfile: null };
      (mockRepo.findById as jest.Mock).mockResolvedValue(devUserNoProfile);

      const service = buildService();

      await expect(
        service.updateDeveloperProfile(USER_ID, { displayName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.updateDeveloperProfile(USER_ID, { displayName: 'New Name' }),
      ).rejects.toThrow('Developer profile not found. Create a profile first.');
    });

    it('does not call updateDeveloperProfile when profile does not exist', async () => {
      const devUserNoProfile = { ...baseUser, role: UserRole.DEVELOPER, developerProfile: null };
      (mockRepo.findById as jest.Mock).mockResolvedValue(devUserNoProfile);

      const service = buildService();
      await service.updateDeveloperProfile(USER_ID, { displayName: 'New Name' }).catch(() => {});

      expect(mockRepo.updateDeveloperProfile).not.toHaveBeenCalled();
    });

    it('updates the developer profile on the happy path', async () => {
      const devWithProfile = {
        ...baseUser,
        role: UserRole.DEVELOPER,
        developerProfile: { id: 'dev-profile-uuid-001', userId: USER_ID, displayName: 'Old' },
      };
      const updatedProfile = { ...createdDeveloperProfile, displayName: 'New Name' };
      (mockRepo.findById as jest.Mock).mockResolvedValue(devWithProfile);
      (mockRepo.updateDeveloperProfile as jest.Mock).mockResolvedValue(updatedProfile);

      const service = buildService();
      const result = await service.updateDeveloperProfile(USER_ID, { displayName: 'New Name' });

      expect(mockRepo.updateDeveloperProfile).toHaveBeenCalledWith(USER_ID, { displayName: 'New Name' });
      expect(result).toBe(updatedProfile);
    });
  });
});
