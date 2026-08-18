import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

// Client pays into the platform against a specific bid/project - held until
// the linked milestone is approved (see MVP scope-down notes in ledger.helper.ts).
export class InitiatePaymentDto {
  @ApiProperty()
  @IsString()
  bidId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}
