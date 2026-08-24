import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class ClientProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  businessName!: string;

  @ApiProperty({ required: false, nullable: true })
  businessType?: string | null;

  @ApiProperty({ required: false, nullable: true })
  phone?: string | null;
}

export class DeveloperProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ required: false, nullable: true })
  bio?: string | null;

  @ApiProperty({ type: [String] })
  techStack!: string[];

  @ApiProperty({ required: false, nullable: true })
  portfolioUrl?: string | null;

  @ApiProperty({ required: false, nullable: true })
  listingTier?: string | null;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ type: () => ClientProfileResponseDto, required: false, nullable: true })
  clientProfile?: ClientProfileResponseDto | null;

  @ApiProperty({ type: () => DeveloperProfileResponseDto, required: false, nullable: true })
  developerProfile?: DeveloperProfileResponseDto | null;
}

