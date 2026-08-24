import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { SupabaseVerifiedGuard } from '../src/modules/auth/guards/supabase-verified.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn().mockReturnValue(() => 'secret'),
}));


/**
 * E2E tests for Users controller guard/authorization wiring.
 *
 * The JWT guard is overridden at the module boundary so tests focus on
 * controller/authorization wiring rather than real Supabase JWKS calls.
 * Unauthenticated behaviour (401) is NOT tested here because the guard
 * is globally overridden — a separate context without the override would
 * be required for that, which is out of scope for this wiring test.
 */

function buildAuthenticatedGuard(user: object) {
  return { canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = user; return true; } };
}

// ---------------------------------------------------------------------------
// Suite 1 — UsersController guard/role wiring
// ---------------------------------------------------------------------------

describe('UsersController (E2E) — guard wiring', () => {
  let appAsClient: INestApplication;
  let appAsDeveloper: INestApplication;

  const clientUser = {
    sub: 'supa-client-001',
    email: 'client@patadev.ke',
    localUserId: 'db-client-001',
    role: UserRole.CLIENT,
  };

  const developerUser = {
    sub: 'supa-dev-001',
    email: 'dev@patadev.ke',
    localUserId: 'db-dev-001',
    role: UserRole.DEVELOPER,
  };

  async function buildApp(user: object): Promise<INestApplication> {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(buildAuthenticatedGuard(user))
      .compile();

    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    return app;
  }

  beforeAll(async () => {
    appAsClient = await buildApp(clientUser);
    appAsDeveloper = await buildApp(developerUser);
  });

  afterAll(async () => {
    await appAsClient.close();
    await appAsDeveloper.close();
  });

  it('authenticated CLIENT can access GET /users/me (resolves without 403)', async () => {
    const res = await request(appAsClient.getHttpServer()).get('/users/me');
    expect(res.status).not.toBe(403);
  });

  it('authenticated DEVELOPER can access GET /users/me (resolves without 403)', async () => {
    const res = await request(appAsDeveloper.getHttpServer()).get('/users/me');
    expect(res.status).not.toBe(403);
  });

  it('CLIENT receives 403 when accessing PATCH /users/me/developer-profile', async () => {
    const res = await request(appAsClient.getHttpServer())
      .patch('/users/me/developer-profile')
      .send({ displayName: 'Hacked', techStack: [] });
    expect(res.status).toBe(403);
  });

  it('DEVELOPER does not receive 403 when accessing PATCH /users/me/developer-profile', async () => {
    const res = await request(appAsDeveloper.getHttpServer())
      .patch('/users/me/developer-profile')
      .send({ displayName: 'Jane Dev' });
    expect(res.status).not.toBe(403);
  });

  it('DEVELOPER receives 403 when accessing PATCH /users/me/client-profile', async () => {
    const res = await request(appAsDeveloper.getHttpServer())
      .patch('/users/me/client-profile')
      .send({ businessName: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('CLIENT receives 403 when accessing POST /users/me/developer-profile', async () => {
    const res = await request(appAsClient.getHttpServer())
      .post('/users/me/developer-profile')
      .send({ displayName: 'Hacked', techStack: ['Node'] });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — POST /auth/complete-registration guard wiring
// ---------------------------------------------------------------------------

describe('AuthController — complete-registration (E2E)', () => {
  let app: INestApplication;

  // Minimal Supabase identity: no localUserId, no role — just what the
  // SupabaseVerifiedStrategy provides after JWKS verification.
  const supabaseIdentity = {
    sub: 'supa-new-user-001',
    email: 'newuser@patadev.ke',
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(SupabaseVerifiedGuard)
      .useValue(buildAuthenticatedGuard(supabaseIdentity))
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects ADMIN self-assignment with 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/complete-registration')
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when no role is provided (ValidationPipe enforcement)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/complete-registration')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid role value', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/complete-registration')
      .send({ role: 'SUPERUSER' });
    expect(res.status).toBe(400);
  });

  it('CLIENT registration passes the guard and controller checks (not blocked by 403)', async () => {
    // Without a real DB, the service will fail — but 403 would indicate a guard
    // or ADMIN-check failure. Any other status confirms the auth wiring is correct.
    const res = await request(app.getHttpServer())
      .post('/auth/complete-registration')
      .send({ role: 'CLIENT' });
    expect(res.status).not.toBe(403);
  });

  it('DEVELOPER registration passes the guard and controller checks (not blocked by 403)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/complete-registration')
      .send({ role: 'DEVELOPER' });
    expect(res.status).not.toBe(403);
  });
});

