import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export class ModerateListingDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ enum: ['APPROVE', 'REMOVE'] })
  @IsEnum(['APPROVE', 'REMOVE'])
  action: 'APPROVE' | 'REMOVE';
}
