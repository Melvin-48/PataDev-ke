import { Injectable } from '@nestjs/common';
import { LedgerEntryStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsRepository {
  constructor(private prisma: PrismaService) {}

  createLedgerEntry(data: any) {
    return this.prisma.ledgerEntry.create({ data });
  }

  findByBid(bidId: string) {
    return this.prisma.ledgerEntry.findMany({ where: { projectBidId: bidId } });
  }

  updateStatus(id: string, status: LedgerEntryStatus) {
    return this.prisma.ledgerEntry.update({ where: { id }, data: { status } });
  }
}
