import { ApiProperty } from '@nestjs/swagger';

export class LedgerEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['HELD', 'COMMISSION', 'PAYOUT', 'REFUND'] })
  type: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['PENDING', 'COMPLETED', 'FAILED'] })
  status: string;
}
