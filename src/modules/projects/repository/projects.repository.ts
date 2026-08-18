import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ProjectsRepository {
  constructor(private prisma: PrismaService) {}

  create(clientId: string, data: any) {
    return this.prisma.project.create({ data: { ...data, clientId } });
  }

  findMany(filter: any) {
    return this.prisma.project.findMany({ where: filter });
  }

  findById(id: string) {
    return this.prisma.project.findUnique({ where: { id }, include: { bids: true } });
  }
}
