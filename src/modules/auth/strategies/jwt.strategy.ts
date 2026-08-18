import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Verifies the JWT that Supabase Auth issues on sign-in.
// SUPABASE_JWT_SECRET is found in Supabase project settings -> API -> JWT Secret.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // payload.sub is the Supabase user id; map it to your local User row as needed.
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
