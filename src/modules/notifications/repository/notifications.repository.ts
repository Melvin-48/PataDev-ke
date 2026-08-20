import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.notification.create({ data });
  }

  async findMany(where: any, orderBy?: any) {
    return this.prisma.notification.findMany({
      where,
      orderBy: orderBy || { createdAt: 'desc' },
    });
  }

  async findUnique(where: any) {
    return this.prisma.notification.findUnique({ where });
  }

  async update(where: any, data: any) {
    return this.prisma.notification.update({ where, data });
  }

  async updateMany(where: any, data: any) {
    return this.prisma.notification.updateMany({ where, data });
  }

  async delete(where: any) {
    return this.prisma.notification.delete({ where });
  }

  async count(where: any) {
    return this.prisma.notification.count({ where });
  }
}
