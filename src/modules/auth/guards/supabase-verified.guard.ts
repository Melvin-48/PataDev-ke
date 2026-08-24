import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * SupabaseVerifiedGuard — guards routes that require a cryptographically
 * valid Supabase JWT but do NOT require an existing local User record.
 *
 * Use this guard exclusively for the registration bootstrap endpoint.
 * For all other protected routes, use JwtAuthGuard which additionally
 * enforces that a local User account exists.
 */
@Injectable()
export class SupabaseVerifiedGuard extends AuthGuard('supabase-verified') {}
