import { ConflictException, Injectable } from '@nestjs/common';
import { BidStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BidsRepository {
  constructor(private prisma: PrismaService) {}

  create(developerId: string, data: any) {
    return this.prisma.bid.create({
      data: { ...data, developerId, status: "PENDING" },
    });
  }

  findByProject(projectId: string) {
    return this.prisma.bid.findMany({
      where: { projectId },
      include: { developer: true },
    });
  }

  // Developer's own bid list - project included so they can see what each
  // bid was for and its current status without a second round-trip.
  findByDeveloper(developerId: string) {
    return this.prisma.bid.findMany({
      where: { developerId },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.bid.findUnique({
      where: { id },
      include: { project: { include: { client: true } }, developer: true },
    });
  }

  findProjectById(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true },
    });
  }

  findPendingByDeveloper(projectId: string, developerId: string) {
    return this.prisma.bid.findFirst({
      where: { projectId, developerId, status: 'PENDING' },
    });
  }

  updateStatus(id: string, status: BidStatus) {
    return this.prisma.bid.update({ where: { id }, data: { status } });
  }

  // Race-safe by construction: each step's WHERE clause re-checks the state
  // it depends on, not just the id. If a concurrent request already changed
  // the bid or project, count === 0 and we throw - the whole transaction
  // rolls back, including anything this call already wrote.
  async acceptAndMatch(bidId: string, projectId: string) {
    return this.prisma.$transaction(async (tx) => {
      const claimedBid = await tx.bid.updateMany({
        where: { id: bidId, status: 'PENDING' },
        data: { status: 'ACCEPTED' },
      });
      if (claimedBid.count === 0) {
        throw new ConflictException(
          'This bid is no longer pending - it may already have been accepted or declined',
        );
      }

      const claimedProject = await tx.project.updateMany({
        where: { id: projectId, status: 'OPEN' },
        data: { status: 'MATCHED' },
      });
      if (claimedProject.count === 0) {
        throw new ConflictException(
          'This project is no longer open - another bid may already have been accepted',
        );
      }

      await tx.bid.updateMany({
        where: { projectId, id: { not: bidId }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      });

      return tx.bid.findUnique({ where: { id: bidId } });
    });
  }
}