import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

/**
 * SupabaseVerifiedStrategy — Passport strategy name: 'supabase-verified'
 *
 * Sole responsibility: cryptographic verification of a Supabase-issued JWT
 * via the Supabase JWKS endpoint. This strategy does NOT query the local
 * database and does NOT require a local User record to exist.
 *
 * Used exclusively for the registration bootstrap endpoint
 * (POST /auth/complete-registration) where a newly signed-up Supabase user
 * does not yet have a local application account.
 *
 * Contrast with JwtStrategy ('jwt') which additionally resolves the local
 * User record and rejects tokens for users not yet registered locally.
 */
@Injectable()
export class SupabaseVerifiedStrategy extends PassportStrategy(
  Strategy,
  'supabase-verified',
) {
  constructor(configService: ConfigService) {
    const supabaseUrl = configService
      .getOrThrow<string>('SUPABASE_URL')
      .replace(/\/$/, '');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        cacheMaxAge: 3_600_000,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      algorithms: ['ES256'],
    });
  }

  /**
   * Called after Supabase signature verification succeeds.
   * Returns only the minimum verified identity — no local DB lookup,
   * no role assignment, no user creation.
   */
  async validate(payload: any): Promise<{ sub: string; email: string }> {
    return {
      sub: payload.sub,
      email: payload.email ?? '',
    };
  }
}
