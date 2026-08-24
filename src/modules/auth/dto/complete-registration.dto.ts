import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

/**
 * CompleteRegistrationDto — the only fields the client is allowed to choose
 * during account creation.
 *
 * Identity fields (supabaseId, email) are taken exclusively from the
 * verified Supabase JWT claims (req.user.sub / req.user.email) and are
 * never accepted from the request body.
 *
 * ADMIN cannot be self-assigned via this endpoint; the controller enforces
 * that restriction independently of DTO validation.
 */
export class CompleteRegistrationDto {
  @ApiProperty({
    enum: [UserRole.CLIENT, UserRole.DEVELOPER],
    description: 'Application role. ADMIN cannot be self-assigned.',
    example: UserRole.CLIENT,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
