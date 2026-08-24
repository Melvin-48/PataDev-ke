import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientProfile, DeveloperProfile, Prisma, User } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { clientProfile: true, developerProfile: true },
    });
  }

  findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({
      where: { supabaseId },
      include: { clientProfile: true, developerProfile: true },
    });
  }

  create(
    data: Prisma.UserCreateInput,
  ): Promise<User & { clientProfile: ClientProfile | null; developerProfile: DeveloperProfile | null }> {
    return this.prisma.user.create({
      data,
      include: { clientProfile: true, developerProfile: true },
    });
  }

  createClientProfile(
    userId: string,
    data: Prisma.ClientProfileCreateWithoutUserInput,
  ) {
    return this.prisma.clientProfile.create({
      data: { ...data, user: { connect: { id: userId } } },
    });
  }

  createDeveloperProfile(
    userId: string,
    data: Prisma.DeveloperProfileCreateWithoutUserInput,
  ) {
    return this.prisma.developerProfile.create({
      data: { ...data, user: { connect: { id: userId } } },
    });
  }

  updateClientProfile(
    userId: string,
    data: Prisma.ClientProfileUpdateWithoutUserInput,
  ) {
    return this.prisma.clientProfile.update({
      where: { userId },
      data,
    });
  }

  updateDeveloperProfile(
    userId: string,
    data: Prisma.DeveloperProfileUpdateWithoutUserInput,
  ) {
    return this.prisma.developerProfile.update({
      where: { userId },
      data,
    });
  }
}

