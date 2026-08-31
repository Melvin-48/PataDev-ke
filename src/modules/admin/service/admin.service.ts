import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdminRepository } from '../repository/admin.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../../common/services/audit.service';
import { ListUsersDto } from '../dto/list-users.dto';
import { AdjustUserStatusDto } from '../dto/adjust-user-status.dto';
import { VerifyDeveloperDto } from '../dto/verify-developer.dto';
import { ResolveDisputeDto } from '../dto/resolve-dispute.dto';
import { PromoteAdminDto } from '../dto/promote-admin.dto';
import { SetPlatformFeeDto } from '../dto/set-platform-fee.dto';
import { CreateDisputeDto } from '../dto/create-dispute.dto';
import { EVENTS } from '../../../common/events/event-names';
import { PayoutCompletedEvent } from '../../../common/events/domain-events';

@Injectable()
export class AdminService {
  constructor(
    private adminRepo: AdminRepository,
    private audit: AuditService,
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ── User management ──────────────────────────────────────────────

  async listUsers(dto: ListUsersDto) {
    const page = dto.page ?? 1;
    const pageSize = Math.min(dto.pageSize ?? 20, 100);
    const where: any = {};
    if (dto.role) where.role = dto.role;
    if (dto.status) where.status = dto.status;
    if (dto.search) {
      where.OR = [
        { email: { contains: dto.search, mode: 'insensitive' } },
        { clientProfile: { businessName: { contains: dto.search, mode: 'insensitive' } } },
        { developerProfile: { displayName: { contains: dto.search, mode: 'insensitive' } } },
      ];
    }
    const [items, total] = await Promise.all([
      this.adminRepo.findAllUsers({ where, skip: (page - 1) * pageSize, take: pageSize }),
      this.adminRepo.countUsers(where),
    ]);
    return { items, total, page, pageSize };
  }

  async getUser(id: string) {
    const user = await this.adminRepo.findUserById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async adjustStatus(adminId: string, dto: AdjustUserStatusDto) {
    if (dto.userId === adminId) {
      throw new BadRequestException('You cannot change your own status');
    }
    const user = await this.adminRepo.findUserById(dto.userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Cannot modify a Super Admin');
    }
    await this.adminRepo.updateStatus(dto.userId, dto.status);
    await this.audit.log(adminId, 'USER_STATUS_CHANGE', 'User', dto.userId, {
      previousStatus: user.status,
      newStatus: dto.status,
      reason: dto.reason,
    });
    return { message: `User status set to ${dto.status}` };
  }

  // ── Developer verification ───────────────────────────────────────

  async verifyDeveloper(adminId: string, dto: VerifyDeveloperDto) {
    const user = await this.adminRepo.findUserById(dto.userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.developerProfile) {
      throw new BadRequestException('User does not have a developer profile');
    }
    if (dto.decision === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting');
    }
    if (dto.decision === 'APPROVED') {
      await this.adminRepo.approveDeveloper(dto.userId);
    } else {
      await this.adminRepo.rejectDeveloper(dto.userId, dto.rejectionReason!);
    }
    await this.audit.log(adminId, 'DEVELOPER_VERIFICATION', 'DeveloperProfile', dto.userId, {
      decision: dto.decision,
      rejectionReason: dto.rejectionReason,
    });
    return { message: `Developer ${dto.decision.toLowerCase()}` };
  }

  // ── Listing moderation ───────────────────────────────────────────

  async moderateListing(adminId: string, projectId: string, action: 'APPROVE' | 'REMOVE') {
    const project = await this.adminRepo.findProjectById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (action === 'REMOVE') {
      await this.adminRepo.removeProject(projectId);
    } else if (action === 'APPROVE') {
      // Approving a listing ensures it is OPEN for bidding
      await this.adminRepo.updateProjectStatus(projectId, ProjectStatus.OPEN);
    }

    await this.audit.log(adminId, 'LISTING_MODERATION', 'Project', projectId, {
      action,
      previousStatus: project.status,
      newStatus: action === 'REMOVE' ? ProjectStatus.REMOVED : ProjectStatus.OPEN,
    });

    return { message: `Project ${action === 'REMOVE' ? 'removed' : 'approved'}` };
  }

  // ── Admin management (super-only) ────────────────────────────────

  async promoteAdmin(adminId: string, dto: PromoteAdminDto) {
    if (dto.userId === adminId) {
      throw new BadRequestException('Use a separate session to modify your own role');
    }
    const user = await this.adminRepo.findUserById(dto.userId);
    if (!user) throw new NotFoundException('User not found');
    await this.adminRepo.updateRole(dto.userId, dto.role);
    await this.audit.log(adminId, 'ADMIN_ROLE_CHANGE', 'User', dto.userId, {
      previousRole: user.role,
      newRole: dto.role,
    });
    return { message: `User role set to ${dto.role}` };
  }

  // ── Disputes ─────────────────────────────────────────────────────

  async raiseDispute(raiserId: string, dto: CreateDisputeDto) {
    return this.adminRepo.createDispute({
      bid: { connect: { id: dto.bidId } },
      raisedBy: { connect: { id: raiserId } },
      against: dto.againstId ? { connect: { id: dto.againstId } } : undefined,
      reason: dto.reason,
      description: dto.description,
    });
  }

  async listDisputes(dto: { page?: number; pageSize?: number; status?: string }) {
    const page = dto.page ?? 1;
    const pageSize = Math.min(dto.pageSize ?? 20, 100);
    const where: any = {};
    if (dto.status) where.status = dto.status;
    const [items, total] = await Promise.all([
      this.adminRepo.findDisputes({ where, skip: (page - 1) * pageSize, take: pageSize }),
      this.adminRepo.countDisputes(where),
    ]);
    return { items, total, page, pageSize };
  }

  async getDispute(id: string) {
    const dispute = await this.adminRepo.findDisputeById(id);
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  async resolveDispute(adminId: string, dto: ResolveDisputeDto) {
    const disputeId = dto.disputeId;
    if (!disputeId) {
      throw new BadRequestException('disputeId is required');
    }

    const dispute = await this.adminRepo.findDisputeById(disputeId);
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Dispute has already been resolved');
    }

    const decision = dto.decision;
    const resolutionNote = dto.resolutionNote || dto.resolution || decision;

    // Handle simple rejection
    if (decision === 'REJECTED') {
      await this.adminRepo.updateDispute(disputeId, {
        status: 'REJECTED',
        resolutionNote,
        resolvedBy: { connect: { id: adminId } },
        resolvedAt: new Date(),
      });
      await this.audit.log(adminId, 'DISPUTE_REJECTED', 'DisputeReport', disputeId, {
        decision,
        resolutionNote,
      });
      return { message: 'Dispute rejected', status: 'REJECTED' };
    }

    // Handle standard note-only resolution
    if (decision === 'RESOLVED') {
      await this.adminRepo.updateDispute(disputeId, {
        status: 'RESOLVED',
        resolutionNote,
        resolvedBy: { connect: { id: adminId } },
        resolvedAt: new Date(),
      });
      await this.audit.log(adminId, 'DISPUTE_RESOLVED', 'DisputeReport', disputeId, {
        decision,
        resolutionNote,
      });
      return { message: 'Dispute resolved', status: 'RESOLVED' };
    }

    // For REFUND_CLIENT or PAYOUT_DEVELOPER, verify held escrow funds
    const heldEntries = dispute.bid.ledgerEntries.filter(
      (e) => e.type === 'HELD' && (e.status === 'COMPLETED' || e.status === 'PENDING'),
    );
    const totalHeldAmount = heldEntries.reduce((sum, e) => sum + Number(e.amount), 0);

    if (totalHeldAmount <= 0) {
      throw new BadRequestException('No held escrow funds available to settle for this dispute');
    }

    let payoutEventToEmit: PayoutCompletedEvent | null = null;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedDispute = await tx.disputeReport.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolutionNote,
          resolvedById: adminId,
          resolvedAt: new Date(),
        },
      });

      if (decision === 'REFUND_CLIENT') {
        await tx.ledgerEntry.create({
          data: {
            projectBidId: dispute.bidId,
            type: 'REFUND',
            amount: totalHeldAmount,
            status: 'COMPLETED',
            idempotencyKey: `dispute:${disputeId}:REFUND`,
          },
        });
      } else if (decision === 'PAYOUT_DEVELOPER') {
        const rateSetting = await tx.platformSetting.findUnique({
          where: { key: 'commission_rate' },
        });
        const rate = rateSetting ? parseFloat(rateSetting.value) : 0.10;
        const commission = totalHeldAmount * rate;
        const payoutAmount = totalHeldAmount - commission;

        await tx.ledgerEntry.create({
          data: {
            projectBidId: dispute.bidId,
            type: 'COMMISSION',
            amount: commission,
            status: 'COMPLETED',
            idempotencyKey: `dispute:${disputeId}:COMMISSION`,
          },
        });

        const payoutEntry = await tx.ledgerEntry.create({
          data: {
            projectBidId: dispute.bidId,
            type: 'PAYOUT',
            amount: payoutAmount,
            status: 'PENDING',
            idempotencyKey: `dispute:${disputeId}:PAYOUT`,
          },
        });

        payoutEventToEmit = new PayoutCompletedEvent(
          payoutEntry.id,
          dispute.bidId,
          dispute.bid.developerId,
          payoutAmount,
        );
      }

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'DISPUTE_RESOLVED_WITH_SETTLEMENT',
          targetType: 'DisputeReport',
          targetId: disputeId,
          meta: { decision, resolutionNote, settledAmount: totalHeldAmount },
        },
      });

      return updatedDispute;
    });

    // Emit event post-commit — never emit inside active transaction
    if (payoutEventToEmit) {
      this.eventEmitter.emit(EVENTS.PAYOUT_COMPLETED, payoutEventToEmit);
    }

    return {
      message: `Dispute resolved with action: ${decision}`,
      status: 'RESOLVED',
      decision,
      dispute: result,
    };
  }

  // ── Financial reports ────────────────────────────────────────────

  async financialReport() {
    return this.adminRepo.financialSummary();
  }

  // ── Platform fee ─────────────────────────────────────────────────

  async getFee() {
    const setting = await this.adminRepo.getSetting('commission_rate');
    return setting ? { rate: parseFloat(setting.value) } : { rate: 0.1 };
  }

  async setFee(adminId: string, dto: SetPlatformFeeDto) {
    if (dto.rate <= 0 || dto.rate >= 1) {
      throw new BadRequestException('Rate must be between 0 and 1 (exclusive)');
    }
    await this.adminRepo.upsertSetting('commission_rate', dto.rate.toString());
    await this.audit.log(adminId, 'FEE_CHANGE', 'PlatformSetting', undefined, {
      previousRate: (await this.getFee()).rate,
      newRate: dto.rate,
    });
    return { message: `Commission rate set to ${dto.rate}` };
  }

  // ── Audit logs ───────────────────────────────────────────────────

  async listAuditLogs(dto: { page?: number; pageSize?: number; adminId?: string }) {
    const page = dto.page ?? 1;
    const pageSize = Math.min(dto.pageSize ?? 50, 100);
    const where: any = {};
    if (dto.adminId) where.adminId = dto.adminId;
    const [items, total] = await Promise.all([
      this.adminRepo.findAuditLogs({ where, skip: (page - 1) * pageSize, take: pageSize }),
      this.adminRepo.countAuditLogs(where),
    ]);
    return { items, total, page, pageSize };
  }
}
