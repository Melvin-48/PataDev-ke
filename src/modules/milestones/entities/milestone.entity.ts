import { ApiProperty } from '@nestjs/swagger';
import { MilestoneStatus } from '../enums/milestone-status.enum';

export class MilestoneEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ enum: MilestoneStatus })
  status: MilestoneStatus;

  @ApiProperty()
  dueDate?: Date;

  @ApiProperty()
  startedAt?: Date;

  @ApiProperty()
  completedAt?: Date;

  @ApiProperty()
  submittedAt?: Date;

  @ApiProperty()
  approvedAt?: Date;

  @ApiProperty()
  rejectionReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
