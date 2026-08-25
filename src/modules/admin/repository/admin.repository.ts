import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminRepository {
  constructor(private prisma: PrismaService) {}

  findAllUsers(args: { where?: Prisma.UserWhereInput; skip?: number; take?: number }) {
    return this.prisma.user.findMany({
      ...args,
      include: { clientProfile: true, developerProfile: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  countUsers(where?: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { clientProfile: true, developerProfile: true },
    });
  }

  updateRole(id: string, role: string) {
    return this.prisma.user.update({ where: { id }, data: { role: role as any } });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.user.update({ where: { id }, data: { status: status as any } });
  }

  approveDeveloper(userId: string) {
    return this.prisma.developerProfile.update({
      where: { userId },
      data: { verificationStatus: 'APPROVED', verifiedAt: new Date() },
    });
  }

  rejectDeveloper(userId: string, reason: string) {
    return this.prisma.developerProfile.update({
      where: { userId },
      data: { verificationStatus: 'REJECTED', rejectionReason: reason },
    });
  }

  removeProject(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: 'REMOVED' as any },
    });
  }

  findDisputes(args: { where?: Prisma.DisputeReportWhereInput; skip?: number; take?: number }) {
    return this.prisma.disputeReport.findMany({
      ...args,
      include: { bid: { include: { project: true } }, raisedBy: true, against: true, resolvedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  countDisputes(where?: Prisma.DisputeReportWhereInput) {
    return this.prisma.disputeReport.count({ where });
  }

  findDisputeById(id: string) {
    return this.prisma.disputeReport.findUnique({
      where: { id },
      include: { bid: { include: { project: { include: { client: true } }, developer: true } }, raisedBy: true, against: true },
    });
  }

  updateDispute(id: string, data: Prisma.DisputeReportUpdateInput) {
    return this.prisma.disputeReport.update({ where: { id }, data });
  }

  createDispute(data: Prisma.DisputeReportCreateInput) {
    return this.prisma.disputeReport.create({ data });
  }

  financialSummary() {
    return this.prisma.ledgerEntry.groupBy({
      by: ['type', 'status'],
      _sum: { amount: true },
      _count: true,
    });
  }

  findAuditLogs(args: { where?: Prisma.AuditLogWhereInput; skip?: number; take?: number }) {
    return this.prisma.auditLog.findMany({
      ...args,
      include: { admin: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  countAuditLogs(where?: Prisma.AuditLogWhereInput) {
    return this.prisma.auditLog.count({ where });
  }

  getSetting(key: string) {
    return this.prisma.platformSetting.findUnique({ where: { key } });
  }

  upsertSetting(key: string, value: string) {
    return this.prisma.platformSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
