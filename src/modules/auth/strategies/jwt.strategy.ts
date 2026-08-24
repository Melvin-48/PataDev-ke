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

  async validate(payload: any) {
    const user = await this.usersService.findBySupabaseId(payload.sub);
    if (!user) {
      throw new UnauthorizedException(
        "User account not found. Please complete registration.",
      );
    }

    return {
      sub: payload.sub,
      email: payload.email,
      localUserId: user.id,
      role: user.role,
    };
  }
}
