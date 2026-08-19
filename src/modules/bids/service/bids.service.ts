import { Injectable, NotFoundException } from '@nestjs/common';
import { BidsRepository } from '../repository/bids.repository';
import { CreateBidDto } from '../dto/create-bid.dto';

@Injectable()
export class BidsService {
  constructor(private bidsRepository: BidsRepository) {}

  create(developerId: string, dto: CreateBidDto) {
    return this.bidsRepository.create(developerId, dto);
  }

  listForProject(projectId: string) {
    return this.bidsRepository.findByProject(projectId);
  }

  async accept(bidId: string) {
    const bid = await this.bidsRepository.findById(bidId);
    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    const accepted = await this.bidsRepository.updateStatus(bidId, 'ACCEPTED');
    await this.bidsRepository.rejectOthers(bid.projectId, bidId);
    // TODO: also transition the parent Project to MATCHED status
    return accepted;
  }
}
