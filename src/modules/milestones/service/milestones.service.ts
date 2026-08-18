import { Injectable, BadRequestException } from '@nestjs/common';
import { MilestonesRepository } from '../repository/milestones.repository';
import { CreateMilestoneDto } from '../dto/create-milestone.dto';
import { canTransition } from '../helpers/milestone-status.helper';

@Injectable()
export class MilestonesService {
  constructor(private milestonesRepository: MilestonesRepository) {}

  create(dto: CreateMilestoneDto) {
    return this.milestonesRepository.create({ ...dto, status: 'PENDING' });
  }

  listForBid(bidId: string) {
    return this.milestonesRepository.findByBid(bidId);
  }

  async updateStatus(id: string, newStatus: string, currentStatus: string) {
    if (!canTransition(currentStatus, newStatus)) {
      throw new BadRequestException(`Cannot move milestone from ${currentStatus} to ${newStatus}`);
    }
    const updated = await this.milestonesRepository.updateStatus(id, newStatus);
    // TODO: when newStatus === 'APPROVED', emit an event the Payments module
    // listens for to create the payout LedgerEntry (admin then confirms it - see payments module).
    return updated;
  }
}
