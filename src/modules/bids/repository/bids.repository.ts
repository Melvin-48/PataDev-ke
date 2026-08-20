import { Injectable } from '@nestjs/common';
import { BidStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BidsRepository {
  constructor(private prisma: PrismaService) {}

  // Status always starts PENDING here; it only changes via accept/decline flows.
  create(developerId: string, data: any) {
    return this.prisma.bid.create({ data: { ...data, developerId, status: 'PENDING' } });
  }

  // Developer details are included so the client can see who is bidding.
  findByProject(projectId: string) {
    return this.prisma.bid.findMany({
      where: { projectId },
      include: { developer: true },
    });
  }

  // project + client + developer are pulled in for the bidding rules:
  // can the developer bid at all, is it their own project, is a bid pending.
  findById(id: string) {
    return this.prisma.bid.findUnique({
      where: { id },
      include: { project: { include: { client: true } }, developer: true },
    });
  }

  // The project a developer wants to bid on - client included so the service
  // can reject bids on your own project.
  findProjectById(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true },
    });
  }

  // Guards the one-bid-per-developer-per-project rule.
  findPendingByDeveloper(projectId: string, developerId: string) {
    return this.prisma.bid.findFirst({
      where: { projectId, developerId, status: 'PENDING' },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.bid.update({ where: { id }, data: { status: status as BidStatus } });
  }

  // The whole accept flow runs in one transaction so a crash can't leave the
  // project MATCHED with a pending bid, or a bid accepted on an open project:
  //   1. every other PENDING bid on the project -> REJECTED
  //   2. this bid -> ACCEPTED
  //   3. parent project -> MATCHED (visible to developers no more)
  acceptAndMatch(bidId: string, projectId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.bid.updateMany({
        where: { projectId, id: { not: bidId }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      });
      const accepted = await tx.bid.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED' },
      });
      await tx.project.update({
        where: { id: projectId },
        data: { status: 'MATCHED' },
      });
      return accepted;
    });
  }
}