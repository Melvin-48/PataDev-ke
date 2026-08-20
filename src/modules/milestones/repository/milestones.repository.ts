import { Injectable } from '@nestjs/common';
import { MilestoneStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MilestonesRepository {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.milestone.create({ data });
  }

  findByBid(bidId: string) {
    return this.prisma.milestone.findMany({ where: { bidId } });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.milestone.update({ where: { id }, data: { status: status as MilestoneStatus } });
  }
}
