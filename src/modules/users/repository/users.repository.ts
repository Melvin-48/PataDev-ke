import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        clientProfile: true,
        developerProfile: true,
      },
    });
  }

  findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({ where: { supabaseId } });
  }

  createClientProfile(userId: string, data: any) {
    return this.prisma.clientProfile.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  createDeveloperProfile(userId: string, data: any) {
    return this.prisma.developerProfile.create({
      data: {
        ...data,
        userId,
      },
    });
  }
}
