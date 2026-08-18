import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateMilestoneStatusDto {
  @ApiProperty({ enum: ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED'] })
  @IsEnum(['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED'])
  status: string;
}
