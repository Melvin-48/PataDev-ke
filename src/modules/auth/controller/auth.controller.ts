import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CompleteRegistrationDto } from '../dto/complete-registration.dto';
import { SupabaseVerifiedGuard } from '../guards/supabase-verified.guard';
import { UsersService } from '../../users/service/users.service';
import { toUserResponse } from '../../users/helpers/profile.mapper';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
  ) {}


  /**
   * POST /auth/complete-registration
   *
   * Creates (or returns existing) the local application User record for a
   * Supabase-authenticated user. Must be called once after Supabase sign-up
   * before any JwtAccessGuard-protected routes are accessible.
   *
   * Guard: SupabaseVerifiedGuard — verifies the Supabase JWT cryptographically
   * but does NOT require an existing local User record.
   *
   * Identity (supabaseId, email) is taken exclusively from the verified JWT.
   * The client may only choose their application role (CLIENT or DEVELOPER).
   * ADMIN self-assignment is explicitly forbidden.
   *
   * Idempotent: calling this endpoint again for an already-registered user
   * returns the existing User without modification.
   */
  @Post('complete-registration')
  @UseGuards(SupabaseVerifiedGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create local application account after Supabase sign-up' })
  async completeRegistration(
    @Req() req: any,
    @Body() dto: CompleteRegistrationDto,
  ) {
    // Security: ADMIN cannot be self-assigned regardless of DTO validation.
    if (dto.role === UserRole.ADMIN) {
      throw new ForbiddenException('ADMIN role cannot be self-assigned');
    }

    // Identity comes from the verified Supabase JWT, never from the request body.
    const supabaseId: string = req.user.sub;
    const email: string = req.user.email;

    const user = await this.usersService.syncFromSupabase({
      supabaseId,
      email,
      role: dto.role,
    });

    return toUserResponse(user);
  }
}

