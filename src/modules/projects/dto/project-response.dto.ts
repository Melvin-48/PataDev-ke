import { ApiProperty } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ['CRM', 'POS'] })
  systemType: string;

  @ApiProperty({ enum: ['DRAFT', 'OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED'] })
  status: string;
}
