import { ApiProperty } from '@nestjs/swagger';

export class MilestoneTimelineDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty({ required: false })
  note?: string;

  @ApiProperty({ required: false })
  updatedBy?: string;
}
