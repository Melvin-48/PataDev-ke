import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BidsRepository } from '../repository/bids.repository';
import { CreateBidDto } from '../dto/create-bid.dto';

@Injectable()
export class BidsService {
  constructor(private bidsRepository: BidsRepository) {}

  // Bidding rules enforced here, in one place:
  //   - the project must exist and still be OPEN (no bidding on drafts or
  //     projects that are already matched/cancelled)
  //   - a developer can't bid on their own project
  //   - one PENDING bid per developer per project
  async create(developerId: string, dto: CreateBidDto) {
    const project = await this.bidsRepository.findProjectById(dto.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.status !== 'OPEN') {
      throw new BadRequestException('Bids are only accepted while the project is OPEN');
    }
    if (project.client.userId === developerId) {
      throw new BadRequestException('You cannot bid on your own project');
    }
    const existing = await this.bidsRepository.findPendingByDeveloper(
      dto.projectId,
      developerId,
    );
    if (existing) {
      throw new BadRequestException('You already have a pending bid on this project');
    }
    return this.bidsRepository.create(developerId, dto);
  }

  listForProject(projectId: string) {
    return this.bidsRepository.findByProject(projectId);
  }

  // Accepting closes the bidding round: this bid becomes ACCEPTED, every other
  // pending bid is rejected, and the project moves to MATCHED - atomically.
  async accept(bidId: string) {
    const bid = await this.bidsRepository.findById(bidId);
    if (!bid) {
      throw new NotFoundException('Bid not found');
    }
    if (bid.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING bids can be accepted');
    }
    if (bid.project.status !== 'OPEN') {
      throw new BadRequestException('The project is no longer open for bidding');
    }
    return this.bidsRepository.acceptAndMatch(bidId, bid.projectId);
  }

  // Declining is the polite rejection: the bid is closed (REJECTED) so it can
  // never be accepted later, and its message thread stays closed - the
  // BidAcceptedGuard only lets ACCEPTED bids message.
  async decline(bidId: string) {
    const bid = await this.bidsRepository.findById(bidId);
    if (!bid) {
      throw new NotFoundException('Bid not found');
    }
    if (bid.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING bids can be declined');
    }
    return this.bidsRepository.updateStatus(bidId, 'REJECTED');
  }
}