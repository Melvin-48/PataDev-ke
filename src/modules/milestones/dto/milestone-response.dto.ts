import { ApiProperty } from '@nestjs/swagger';

export class MilestoneResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED'] })
  status: string;

  @ApiProperty()
  amount: number;
}
