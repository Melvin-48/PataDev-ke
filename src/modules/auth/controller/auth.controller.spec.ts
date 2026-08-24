import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthController } from './auth.controller';
import { UsersService } from '../../users/service/users.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SUPABASE_ID = 'supa-uuid-001';
const EMAIL = 'user@patadev.ke';

const verifiedReqUser = { sub: SUPABASE_ID, email: EMAIL };

const localUser = {
  id: 'db-uuid-001',
  supabaseId: SUPABASE_ID,
  email: EMAIL,
  role: UserRole.CLIENT,
  createdAt: new Date(),
  clientProfile: null,
  developerProfile: null,
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUsersService = {
  syncFromSupabase: jest.fn(),
} as unknown as UsersService;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function buildController(): AuthController {
  return new AuthController(mockUsersService);
}


// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AuthController — completeRegistration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // =========================================================================
  // A. CLIENT role — syncFromSupabase is called with verified identity
  // =========================================================================

  it('calls syncFromSupabase with the verified supabaseId, email, and CLIENT role', async () => {
    (mockUsersService.syncFromSupabase as jest.Mock).mockResolvedValue(localUser);

    const controller = buildController();
    await controller.completeRegistration(
      { user: verifiedReqUser },
      { role: UserRole.CLIENT },
    );

    expect(mockUsersService.syncFromSupabase).toHaveBeenCalledTimes(1);
    expect(mockUsersService.syncFromSupabase).toHaveBeenCalledWith({
      supabaseId: SUPABASE_ID,
      email: EMAIL,
      role: UserRole.CLIENT,
    });
  });

  it('returns the mapped UserResponseDto (supabaseId excluded) for a CLIENT registration', async () => {
    (mockUsersService.syncFromSupabase as jest.Mock).mockResolvedValue(localUser);

    const controller = buildController();
    const result = await controller.completeRegistration(
      { user: verifiedReqUser },
      { role: UserRole.CLIENT },
    );

    expect(result).toMatchObject({ id: localUser.id, email: EMAIL, role: UserRole.CLIENT });
    expect((result as any).supabaseId).toBeUndefined();
  });

  // =========================================================================
  // B. DEVELOPER role
  // =========================================================================

  it('calls syncFromSupabase with the verified identity and DEVELOPER role', async () => {
    const devUser = { ...localUser, role: UserRole.DEVELOPER };
    (mockUsersService.syncFromSupabase as jest.Mock).mockResolvedValue(devUser);

    const controller = buildController();
    await controller.completeRegistration(
      { user: verifiedReqUser },
      { role: UserRole.DEVELOPER },
    );

    expect(mockUsersService.syncFromSupabase).toHaveBeenCalledWith({
      supabaseId: SUPABASE_ID,
      email: EMAIL,
      role: UserRole.DEVELOPER,
    });
  });

  // =========================================================================
  // C. ADMIN role — rejected before UsersService is called
  // =========================================================================

  it('throws ForbiddenException when role is ADMIN', async () => {
    const controller = buildController();

    await expect(
      controller.completeRegistration(
        { user: verifiedReqUser },
        { role: UserRole.ADMIN },
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      controller.completeRegistration(
        { user: verifiedReqUser },
        { role: UserRole.ADMIN },
      ),
    ).rejects.toThrow('ADMIN role cannot be self-assigned');
  });

  it('does NOT call UsersService when role is ADMIN', async () => {
    const controller = buildController();

    await controller
      .completeRegistration({ user: verifiedReqUser }, { role: UserRole.ADMIN })
      .catch(() => {});

    expect(mockUsersService.syncFromSupabase).not.toHaveBeenCalled();
  });

  // =========================================================================
  // D. Idempotency — existing user is returned as-is by syncFromSupabase
  // =========================================================================

  it('returns the existing user when called again for an already-registered Supabase user', async () => {
    (mockUsersService.syncFromSupabase as jest.Mock).mockResolvedValue(localUser);

    const controller = buildController();
    const result = await controller.completeRegistration(
      { user: verifiedReqUser },
      { role: UserRole.CLIENT },
    );

    // syncFromSupabase handles idempotency internally — controller just delegates
    expect(mockUsersService.syncFromSupabase).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: localUser.id, role: UserRole.CLIENT });
  });

  // =========================================================================
  // E. Identity comes from the verified JWT, not the request body
  // =========================================================================

  it('uses req.user.sub as supabaseId regardless of any body field', async () => {
    (mockUsersService.syncFromSupabase as jest.Mock).mockResolvedValue(localUser);

    const controller = buildController();
    // The DTO only accepts `role` (whitelist: true will strip other fields),
    // so this test verifies the controller reads identity from req.user
    await controller.completeRegistration(
      { user: { sub: SUPABASE_ID, email: EMAIL } },
      { role: UserRole.CLIENT },
    );

    const callArg = (mockUsersService.syncFromSupabase as jest.Mock).mock.calls[0][0];
    expect(callArg.supabaseId).toBe(SUPABASE_ID);
    expect(callArg.email).toBe(EMAIL);
  });

  it('uses req.user.email as email regardless of any body field', async () => {
    const trustedEmail = 'verified@supabase.io';
    (mockUsersService.syncFromSupabase as jest.Mock).mockResolvedValue({
      ...localUser,
      email: trustedEmail,
    });

    const controller = buildController();
    await controller.completeRegistration(
      { user: { sub: SUPABASE_ID, email: trustedEmail } },
      { role: UserRole.CLIENT },
    );

    const callArg = (mockUsersService.syncFromSupabase as jest.Mock).mock.calls[0][0];
    expect(callArg.email).toBe(trustedEmail);
  });
});
