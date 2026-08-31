import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID, IsOptional } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({ format: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  disputeId?: string;

  @ApiProperty({ enum: ['RESOLVED', 'REJECTED', 'REFUND_CLIENT', 'PAYOUT_DEVELOPER'] })
  @IsEnum(['RESOLVED', 'REJECTED', 'REFUND_CLIENT', 'PAYOUT_DEVELOPER'])
  decision: 'RESOLVED' | 'REJECTED' | 'REFUND_CLIENT' | 'PAYOUT_DEVELOPER';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resolutionNote?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resolution?: string;
}
