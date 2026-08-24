import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/service/users.service';
import { UserRole } from '@prisma/client';

jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn().mockReturnValue(() => 'secret'),
}));


describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockUsersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('https://supabase.local'),
    } as unknown as jest.Mocked<ConfigService>;

    mockUsersService = {
      findBySupabaseId: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    strategy = new JwtStrategy(mockConfigService, mockUsersService);
  });

  it('validates a user that exists in the local database', async () => {
    const payload = { sub: 'supa-123', email: 'test@test.com' };
    const localUser: any = { id: 'db-123', role: UserRole.CLIENT };
    
    mockUsersService.findBySupabaseId.mockResolvedValue(localUser);

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      sub: 'supa-123',
      email: 'test@test.com',
      localUserId: 'db-123',
      role: UserRole.CLIENT,
    });
  });

  it('rejects a valid Supabase token when no local User exists', async () => {
    const payload = { sub: 'supa-456', email: 'missing@test.com' };
    
    mockUsersService.findBySupabaseId.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate(payload)).rejects.toThrow('User account not found. Please complete registration.');
  });
});
