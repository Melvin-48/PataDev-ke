import { Injectable } from '@nestjs/common';
import { PaymentsRepository } from '../repository/payments.repository';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { calculateCommission } from '../helpers/commission.helper';

@Injectable()
export class PaymentsService {
  constructor(private paymentsRepository: PaymentsRepository) {}

  async initiate(dto: InitiatePaymentDto) {
    // TODO: call Stripe (Connect, hold-then-transfer pattern) or M-Pesa C2B
    // to actually collect the client's payment, then record it.
    return this.paymentsRepository.createLedgerEntry({
      projectBidId: dto.bidId,
      type: 'HELD',
      amount: dto.amount,
      status: 'PENDING',
    });
  }

  async confirmPayout(milestoneId: string, bidId: string, amount: number) {
    const commission = calculateCommission(amount);
    await this.paymentsRepository.createLedgerEntry({
      projectBidId: bidId,
      milestoneId,
      type: 'COMMISSION',
      amount: commission,
      status: 'COMPLETED',
    });
    // TODO: trigger Stripe transfer / M-Pesa B2C payout for (amount - commission)
    return this.paymentsRepository.createLedgerEntry({
      projectBidId: bidId,
      milestoneId,
      type: 'PAYOUT',
      amount: amount - commission,
      status: 'PENDING',
    });
  }

  history(bidId: string) {
    return this.paymentsRepository.findByBid(bidId);
  }
}
