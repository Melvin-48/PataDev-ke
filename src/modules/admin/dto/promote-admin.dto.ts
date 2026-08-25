import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID } from 'class-validator';

export class PromoteAdminDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: ['ADMIN', 'SUPER_ADMIN'] })
  @IsEnum(['ADMIN', 'SUPER_ADMIN'])
  role: string;
}
