import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ['CLIENT', 'DEVELOPER', 'ADMIN'] })
  role: string;
}
