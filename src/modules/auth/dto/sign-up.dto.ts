import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: 'client@business.co.ke' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['CLIENT', 'DEVELOPER'] })
  @IsEnum(['CLIENT', 'DEVELOPER'])
  role: 'CLIENT' | 'DEVELOPER';
}
