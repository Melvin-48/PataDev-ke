import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Shape of a project as returned to consumers. Not currently enforced by a
// mapper - documented here so Swagger and the frontend contract stay explicit.
export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ['CRM', 'POS'] })
  systemType: string;

  @ApiPropertyOptional()
  budgetMin?: number;

  @ApiPropertyOptional()
  budgetMax?: number;

  @ApiProperty({ enum: ['DRAFT', 'OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED'] })
  status: string;

  @ApiProperty()
  createdAt: string;
}