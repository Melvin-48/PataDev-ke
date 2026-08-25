import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class SetPlatformFeeDto {
  @ApiProperty({ description: 'Commission rate as decimal fraction (e.g. 0.10 for 10%)', example: 0.10 })
  @IsNumber()
  @IsPositive()
  rate: number;
}
