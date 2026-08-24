import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Retail POS System' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ enum: ['CRM', 'POS'] })
  @IsEnum(['CRM', 'POS'])
  systemType: 'CRM' | 'POS';

  // budgetMin <= budgetMax is enforced cross-field in ProjectsService.create
  // (class-validator alone can't compare two fields).
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;
}
