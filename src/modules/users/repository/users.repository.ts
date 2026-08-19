import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

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

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
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
}
