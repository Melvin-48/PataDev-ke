import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

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

  // -------------------------------------------------------------------------
  // Helper: build an app with a stubbed JWT guard that injects a specific user
  // -------------------------------------------------------------------------
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

  // =========================================================================
  // 1. GET /users/me — accessible to any authenticated user
  // =========================================================================

  it('authenticated CLIENT can access GET /users/me (resolves without 403)', async () => {
    // The service will attempt to find the user in DB — we expect either 200
    // or a non-403 error (e.g. 401 if the local user is not in the test DB).
    // This test strictly proves the route is NOT blocked by the RolesGuard.
    const res = await request(appAsClient.getHttpServer()).get('/users/me');
    expect(res.status).not.toBe(403);
  });

  it('authenticated DEVELOPER can access GET /users/me (resolves without 403)', async () => {
    const res = await request(appAsDeveloper.getHttpServer()).get('/users/me');
    expect(res.status).not.toBe(403);
  });

  // =========================================================================
  // 2. PATCH /users/me/developer-profile — CLIENT must receive 403
  //    This is the critical test: JwtAuthGuard → RolesGuard → Controller
  // =========================================================================

  it('CLIENT receives 403 when accessing PATCH /users/me/developer-profile', async () => {
    const res = await request(appAsClient.getHttpServer())
      .patch('/users/me/developer-profile')
      .send({ displayName: 'Hacked', techStack: [] });
    expect(res.status).toBe(403);
  });

  // =========================================================================
  // 3. PATCH /users/me/developer-profile — DEVELOPER does NOT receive 403
  //    (may get a different status from the service layer, but not a role 403)
  // =========================================================================

  it('DEVELOPER does not receive 403 when accessing PATCH /users/me/developer-profile', async () => {
    const res = await request(appAsDeveloper.getHttpServer())
      .patch('/users/me/developer-profile')
      .send({ displayName: 'Jane Dev' });
    // Service may return 404 (no profile) or similar — but NOT 403
    expect(res.status).not.toBe(403);
  });

  // =========================================================================
  // 4. PATCH /users/me/client-profile — DEVELOPER must receive 403
  // =========================================================================

  it('DEVELOPER receives 403 when accessing PATCH /users/me/client-profile', async () => {
    const res = await request(appAsDeveloper.getHttpServer())
      .patch('/users/me/client-profile')
      .send({ businessName: 'Hacked' });
    expect(res.status).toBe(403);
  });

  // =========================================================================
  // 5. POST /users/me/developer-profile — CLIENT must receive 403
  // =========================================================================

  it('CLIENT receives 403 when accessing POST /users/me/developer-profile', async () => {
    const res = await request(appAsClient.getHttpServer())
      .post('/users/me/developer-profile')
      .send({ displayName: 'Hacked', techStack: ['Node'] });
    expect(res.status).toBe(403);
  });
});
