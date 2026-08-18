import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateBidDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty()
  @IsNumber()
  proposedAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
