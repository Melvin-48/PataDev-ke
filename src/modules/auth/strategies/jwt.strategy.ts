import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../../../prisma/prisma.service';

// Supabase projects created after May 2025 sign JWTs with an asymmetric key
// by default - there's no single shared secret to store. Instead, this fetches
// the public key from Supabase's JWKS endpoint and verifies against that.
// jwks-rsa handles caching (so we're not hitting the endpoint on every request)
// and matches the right key by "kid" if Supabase ever rotates keys.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
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

  // payload.sub is the Supabase auth UUID; every local FK (User.id,
  // ClientProfile.userId, Bid.developerId, ...) points at our own User row.
  // Resolve it once here so guards and services can compare req.user.id
  // against local ids directly, and so role comes from the DB instead of
  // Supabase's constant "authenticated" claim.
  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User account is not provisioned in this app');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}