import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BidsRepository } from '../repository/bids.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBidDto } from '../dto/create-bid.dto';
import { EVENTS } from '../../../common/events/event-names';
import { BidAcceptedEvent } from '../../../common/events/domain-events';

@Injectable()
export class BidsService {
  constructor(
    private bidsRepository: BidsRepository,
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

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
    const devProfile = await this.prisma.developerProfile.findUnique({
      where: { userId: developerId },
    });
    if (!devProfile || devProfile.verificationStatus !== 'APPROVED') {
      throw new BadRequestException(
        'Your developer account must be verified before you can bid on projects',
      );
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

  // Authorization is handled by ProjectOwnerGuard on the route; this only
  // guarantees an unknown project id reads as 404 instead of an empty list.
  async listForProject(projectId: string) {
    const project = await this.bidsRepository.findProjectById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.bidsRepository.findByProject(projectId);
  }

  listMine(developerId: string) {
    return this.bidsRepository.findByDeveloper(developerId);
  }

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

    const acceptedBid = await this.bidsRepository.acceptAndMatch(bidId, bid.projectId);

    // Emit event post-commit — notifications and downstream listeners react safely
    this.eventEmitter.emit(
      EVENTS.BID_ACCEPTED,
      new BidAcceptedEvent(
        bid.id,
        bid.projectId,
        bid.developerId,
        bid.project.client.userId,
      ),
    );

    return acceptedBid;
  }

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
