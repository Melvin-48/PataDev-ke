import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class AdjustUserStatusDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] })
  @IsEnum(['ACTIVE', 'SUSPENDED', 'BANNED'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
