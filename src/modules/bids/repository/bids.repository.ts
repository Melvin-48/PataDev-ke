import { Injectable } from "@nestjs/common";
import { BidStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BidsRepository {
  constructor(private prisma: PrismaService) {}

  create(developerId: string, data: any) {
    return this.prisma.bid.create({
      data: { ...data, developerId, status: "PENDING" },
    });
  }

  findByProject(projectId: string) {
    return this.prisma.bid.findMany({ where: { projectId } });
  }

  findById(id: string) {
    return this.prisma.bid.findUnique({ where: { id } });
  }

  updateStatus(id: string, status: BidStatus) {
    return this.prisma.bid.update({ where: { id }, data: { status } });
  }

  rejectOthers(projectId: string, acceptedBidId: string) {
    return this.prisma.bid.updateMany({
      where: { projectId, id: { not: acceptedBidId }, status: "PENDING" },
      data: { status: "REJECTED" },
    });
  }
}
