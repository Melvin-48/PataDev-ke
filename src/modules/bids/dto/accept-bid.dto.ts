import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AcceptBidDto {
  @ApiProperty()
  @IsString()
  bidId: string;
}
