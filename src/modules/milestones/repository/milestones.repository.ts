import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MilestoneStatus } from '@prisma/client';

@Injectable()
export class MilestonesRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.milestone.create({ data });
  }

  async findMany(where: any, include?: any) {
    return this.prisma.milestone.findMany({ where, include });
  }

  async findUnique(where: any, include?: any) {
    return this.prisma.milestone.findUnique({ where, include });
  }

  async update(where: any, data: any) {
    return this.prisma.milestone.update({ where, data });
  }

  // Get milestones for a specific bid (matches your schema: Milestone has bidId)
  async getBidMilestones(bidId: string) {
    return this.prisma.milestone.findMany({
      where: { bidId },
      orderBy: { dueDate: 'asc' },
      include: {
        bid: {
          include: {
            project: {
              include: {
                client: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            developer: true,
          },
        },
        ledgerEntries: true,
      },
    });
  }

  // Get milestone statistics for a bid
  async getMilestoneStatistics(bidId: string) {
    const milestones = await this.prisma.milestone.findMany({
      where: { bidId },
    });

    // Use only statuses that exist in your schema
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED'];

    return {
      total: milestones.length,
      pending: milestones.filter((m) => m.status === 'PENDING').length,
      inProgress: milestones.filter((m) => m.status === 'IN_PROGRESS').length,
      submitted: milestones.filter((m) => m.status === 'SUBMITTED').length,
      approved: milestones.filter((m) => m.status === 'APPROVED').length,
      totalBudget: milestones.reduce((sum, m) => sum + Number(m.amount), 0),
      approvedBudget: milestones
        .filter((m) => m.status === 'APPROVED')
        .reduce((sum, m) => sum + Number(m.amount), 0),
    };
  }
}
