import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentsRepository } from '../repository/payments.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { calculateCommission } from '../helpers/commission.helper';
import { EVENTS } from '../../../common/events/event-names';
import { PayoutCompletedEvent } from '../../../common/events/domain-events';

@Injectable()
export class PaymentsService {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async initiate(dto: InitiatePaymentDto) {
    return this.paymentsRepository.createLedgerEntry({
      projectBidId: dto.bidId,
      type: 'HELD',
      amount: dto.amount,
      status: 'PENDING',
    });
  }

  // Admin-triggered payout for an approved milestone. The service itself
  // resolves bidId and amount from the milestone so the controller never
  // passes fabricated values. IdempotencyKey prevents double-disbursal
  // if the same request is retried.
  async confirmPayout(milestoneId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    if (milestone.status !== 'APPROVED') {
      throw new BadRequestException(
        `Milestone must be APPROVED before payout (current status: ${milestone.status})`,
      );
    }

    const rateSetting = await this.prisma.platformSetting.findUnique({
      where: { key: 'commission_rate' },
    });
    const rate = rateSetting ? parseFloat(rateSetting.value) : 0.1;
    const commission = calculateCommission(Number(milestone.amount), rate);
    const payoutAmount = Number(milestone.amount) - commission;

    // Both ledger writes run inside a single transaction so partial
    // failure can't leave an orphaned COMMISSION row.
    const result = await this.prisma.$transaction(async (tx) => {
      const commissionEntry = await tx.ledgerEntry.create({
        data: {
          projectBidId: milestone.bidId,
          milestoneId,
          type: 'COMMISSION',
          amount: commission,
          status: 'COMPLETED',
          idempotencyKey: `${milestoneId}:COMMISSION`,
        },
      });

      const payoutEntry = await tx.ledgerEntry.create({
        data: {
          projectBidId: milestone.bidId,
          milestoneId,
          type: 'PAYOUT',
          amount: payoutAmount,
          status: 'PENDING',
          idempotencyKey: `${milestoneId}:PAYOUT`,
        },
      });

      await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: 'PAID' },
      });

      return { commission: commissionEntry, payout: payoutEntry };
    });

    // Fetch developer ID from the bid to notify developer post-commit
    const bid = await this.prisma.bid.findUnique({
      where: { id: milestone.bidId },
      select: { developerId: true },
    });

    if (bid?.developerId) {
      this.eventEmitter.emit(
        EVENTS.PAYOUT_COMPLETED,
        new PayoutCompletedEvent(
          result.payout.id,
          milestone.bidId,
          bid.developerId,
          payoutAmount,
        ),
      );
    }

    return result;
  }

  history(bidId: string) {
    return this.paymentsRepository.findByBid(bidId);
  }
}
