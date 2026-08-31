import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../service/notifications.service';
import { EVENTS } from '../../../common/events/event-names';
import {
  BidAcceptedEvent,
  MilestoneSubmittedEvent,
  MilestoneApprovedEvent,
  PayoutCompletedEvent,
} from '../../../common/events/domain-events';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(EVENTS.BID_ACCEPTED)
  async onBidAccepted(event: BidAcceptedEvent) {
    await this.safeNotify(event.developerId, 'BID_ACCEPTED', 'Your bid was accepted.');
  }

  @OnEvent(EVENTS.MILESTONE_SUBMITTED)
  async onMilestoneSubmitted(event: MilestoneSubmittedEvent) {
    await this.safeNotify(event.clientId, 'MILESTONE_SUBMITTED', 'A milestone was submitted for review.');
  }

  @OnEvent(EVENTS.MILESTONE_APPROVED)
  async onMilestoneApproved(event: MilestoneApprovedEvent) {
    await this.safeNotify(event.developerId, 'MILESTONE_APPROVED', 'Your milestone was approved.');
  }

  @OnEvent(EVENTS.PAYOUT_COMPLETED)
  async onPayoutCompleted(event: PayoutCompletedEvent) {
    await this.safeNotify(event.developerId, 'PAYOUT_COMPLETED', `Payout of ${event.amount} was processed.`);
  }

  // Notification failures must never bubble — the underlying transaction already committed
  private async safeNotify(userId: string, type: string, message: string) {
    try {
      await this.notificationsService.create({ userId, type, message });
    } catch (err: any) {
      this.logger.error(`Failed to create notification (${type}) for user ${userId}: ${err.message}`);
    }
  }
}
