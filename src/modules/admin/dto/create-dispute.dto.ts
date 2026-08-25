import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  bidId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  againstId?: string;

  @ApiProperty({ example: 'Milestone work not delivered as agreed' })
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
