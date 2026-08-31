import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { MilestoneStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MilestonesRepository } from '../repository/milestones.repository';
import { CreateMilestoneDto } from '../dto/create-milestone.dto';
import { canTransition } from '../helpers/milestone-status.helper';
import { EVENTS } from '../../../common/events/event-names';
import {
  MilestoneSubmittedEvent,
  MilestoneApprovedEvent,
} from '../../../common/events/domain-events';

@Injectable()
export class MilestonesService {
  private readonly TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
    PENDING: ['IN_PROGRESS'],
    IN_PROGRESS: ['SUBMITTED'],
    SUBMITTED: ['APPROVED', 'IN_PROGRESS'], // client can approve or send back for rework
    APPROVED: ['PAID'],
    PAID: [],
  };

  constructor(
    private readonly milestonesRepository: MilestonesRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  create(dto: CreateMilestoneDto) {
    return this.milestonesRepository.create({ ...dto, status: 'PENDING' });
  }

  listForBid(bidId: string) {
    return this.milestonesRepository.findByBid(bidId);
  }

  async transitionStatus(
    milestoneId: string,
    targetStatus: MilestoneStatus,
  ) {
    const milestone = await this.milestonesRepository.findById(milestoneId);
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const allowed = this.TRANSITIONS[milestone.status] ?? [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot move milestone from ${milestone.status} to ${targetStatus}`,
      );
    }

    const updated = await this.milestonesRepository.updateStatus(milestoneId, targetStatus);

    if (targetStatus === 'SUBMITTED' && milestone.bid?.project?.client?.userId) {
      this.eventEmitter.emit(
        EVENTS.MILESTONE_SUBMITTED,
        new MilestoneSubmittedEvent(
          updated.id,
          milestone.bidId,
          milestone.bid.project.client.userId,
        ),
      );
    } else if (targetStatus === 'APPROVED' && milestone.bid?.developerId) {
      this.eventEmitter.emit(
        EVENTS.MILESTONE_APPROVED,
        new MilestoneApprovedEvent(
          updated.id,
          milestone.bidId,
          milestone.bid.developerId,
        ),
      );
    }

    return updated;
  }

  updateStatus(milestoneId: string, targetStatus: MilestoneStatus) {
    return this.transitionStatus(milestoneId, targetStatus);
  }
}
