import type {
  User,
  ClientProfile,
  DeveloperProfile,
} from '@prisma/client';
import type { UserResponseDto } from '../dto/user-response.dto';

type UserWithProfiles = User & {
  clientProfile: ClientProfile | null;
  developerProfile: DeveloperProfile | null;
};

export function toUserResponse(user: UserWithProfiles): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    clientProfile: user.clientProfile
      ? {
          id: user.clientProfile.id,
          businessName: user.clientProfile.businessName,
          businessType: user.clientProfile.businessType,
          phone: user.clientProfile.phone,
        }
      : null,
    developerProfile: user.developerProfile
      ? {
          id: user.developerProfile.id,
          displayName: user.developerProfile.displayName,
          bio: user.developerProfile.bio,
          techStack: user.developerProfile.techStack,
          portfolioUrl: user.developerProfile.portfolioUrl,
          listingTier: user.developerProfile.listingTier,
        }
      : null,
  };
}

