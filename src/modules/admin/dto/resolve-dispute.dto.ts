import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  disputeId: string;

  @ApiProperty({ enum: ['RESOLVED', 'REJECTED'] })
  @IsEnum(['RESOLVED', 'REJECTED'])
  decision: string;

  @ApiProperty()
  @IsString()
  resolutionNote: string;
}
