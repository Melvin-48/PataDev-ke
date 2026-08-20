import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

// Supabase projects created after May 2025 sign JWTs with an asymmetric key
// by default - there's no single shared secret to store. Instead, this fetches
// the public key from Supabase's JWKS endpoint and verifies against that.
// jwks-rsa handles caching (so we're not hitting the endpoint on every request)
// and matches the right key by "kid" if Supabase ever rotates keys.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}