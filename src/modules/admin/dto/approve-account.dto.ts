import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ApproveAccountDto {
  @ApiProperty()
  @IsString()
  userId: string;
}
