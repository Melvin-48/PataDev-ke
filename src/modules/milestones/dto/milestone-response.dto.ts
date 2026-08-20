import { ApiProperty } from '@nestjs/swagger';

export class MilestoneResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  developerId: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  comments: any[];

  @ApiProperty()
  submittedAt: Date;

  @ApiProperty()
  approvedAt: Date;

  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
