import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  create(userId: string, type: string, payload: any) {
    return this.prisma.notification.create({ data: { userId, type, payload } });
  }

  findForUser(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }
}
