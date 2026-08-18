import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Verifies the Supabase-issued JWT on every protected route.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
