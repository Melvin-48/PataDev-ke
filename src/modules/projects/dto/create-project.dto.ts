import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Retail POS System' })
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ['CRM', 'POS'] })
  @IsEnum(['CRM', 'POS'])
  systemType: 'CRM' | 'POS';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  budgetMin?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  budgetMax?: number;
}
