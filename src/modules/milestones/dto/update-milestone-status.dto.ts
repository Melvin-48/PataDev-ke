import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MilestoneStatus } from '@prisma/client';

export class UpdateMilestoneStatusDto {
  @ApiProperty({ enum: MilestoneStatus })
  @IsEnum(MilestoneStatus)
  status: MilestoneStatus;
}
