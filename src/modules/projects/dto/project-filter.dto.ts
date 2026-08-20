import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

// Query DTO for GET /projects. Validation happens here so the repository can
// trust the shape it receives; numbers arrive as strings from the URL and are
// coerced by @Type (the global ValidationPipe has transform: true).
export class ProjectFilterDto {
  @ApiPropertyOptional({ enum: ['CRM', 'POS'] })
  @IsOptional()
  @IsEnum(['CRM', 'POS'])
  systemType?: 'CRM' | 'POS';

  @ApiPropertyOptional({ enum: ['DRAFT', 'OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Free-text search on title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lower bound of the project budget range' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budgetMin?: number;

  @ApiPropertyOptional({ description: 'Upper bound of the project budget range' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budgetMax?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  // pageSize is capped at 50 so a client can't force an unbounded query.
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;
}