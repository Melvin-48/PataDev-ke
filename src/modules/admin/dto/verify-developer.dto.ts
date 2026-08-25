import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class VerifyDeveloperDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  decision: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
