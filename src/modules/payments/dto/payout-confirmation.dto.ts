import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// MVP scope-down decision: payouts are admin-triggered, not automated,
// to avoid building full automated release logic in the first version.
export class PayoutConfirmationDto {
  @ApiProperty()
  @IsString()
  milestoneId: string;
}
