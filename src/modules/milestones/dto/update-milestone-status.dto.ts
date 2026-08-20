import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MilestoneStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export class UpdateMilestoneStatusDto {
  @ApiProperty({ enum: MilestoneStatusEnum })
  @IsEnum(MilestoneStatusEnum)
  status: MilestoneStatusEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
