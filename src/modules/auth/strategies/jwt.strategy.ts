import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";
import { UsersService } from "../../users/service/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const supabaseUrl = configService
      .getOrThrow<string>("SUPABASE_URL")
      .replace(/\/$/, "");

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
      algorithms: ["ES256"],
    });
  }

  // payload.sub is the Supabase auth UUID; every local FK (User.id,
  // ClientProfile.userId, Bid.developerId, ...) points at our own User row.
  // Resolve it once here so guards and services can compare req.user.id
  // against local ids directly, and so role comes from the DB instead of
  // Supabase's constant "authenticated" claim.
  async validate(payload: any) {
    const user = await this.usersService.findBySupabaseId(payload.sub);
    if (!user) {
      throw new UnauthorizedException(
        "User account not found. Please complete registration.",
      );
    }

    // Immediate enforcement: banned/suspended users lose access on the
    // very next request without waiting for the JWT to expire.
    if (user.status === 'BANNED') {
      throw new UnauthorizedException('This account has been banned');
    }
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('This account has been suspended');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      localUserId: user.id,
      id: user.id, // For compatibility with development branch modules
      role: user.role,
    };
  }
}