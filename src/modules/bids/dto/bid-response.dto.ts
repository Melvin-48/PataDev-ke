import { ApiProperty } from '@nestjs/swagger';

export class BidResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  proposedAmount: number;

  @ApiProperty({ enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'] })
  status: string;
}
