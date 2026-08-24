import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class CreateBidDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  projectId: string;

  // Positive-only: zero and negative amounts would poison the ledger once
  // payments start flowing off accepted bids.
  @ApiProperty({ example: 45000 })
  @IsNumber()
  @IsPositive()
  proposedAmount: number;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
