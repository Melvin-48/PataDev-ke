import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  bidId: string;

  @ApiProperty()
  @IsString()
  content: string;
}
