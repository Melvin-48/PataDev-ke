import { Injectable } from '@nestjs/common';
import { SignUpDto } from '../dto/sign-up.dto';
import { SignInDto } from '../dto/sign-in.dto';

@Injectable()
export class AuthService {
  // TODO: call Supabase Auth's REST API (or supabase-js server client) to
  // create/authenticate the user, then mirror a local User row via Prisma
  // with the matching role. Keep Supabase as the source of truth for credentials.

  async signUp(dto: SignUpDto) {
    throw new Error('Not implemented: wire up Supabase Auth sign-up');
  }

  async signIn(dto: SignInDto) {
    throw new Error('Not implemented: wire up Supabase Auth sign-in');
  }
}
