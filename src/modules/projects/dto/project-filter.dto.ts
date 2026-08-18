import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class ProjectFilterDto {
  @ApiPropertyOptional({ enum: ['CRM', 'POS'] })
  @IsOptional()
  @IsEnum(['CRM', 'POS'])
  systemType?: 'CRM' | 'POS';

  @ApiPropertyOptional({ enum: ['DRAFT', 'OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED'])
  status?: string;
}
