import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class EngagementParticipantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id || req.user?.localUserId;

    if (!userId) {
      throw new ForbiddenException('User authentication required');
    }

    const bidId =
      req.body?.bidId ||
      req.params?.bidId ||
      (await this.resolveBidIdFromMilestone(req.params?.id));

    if (!bidId) {
      throw new BadRequestException('bidId is required');
    }

    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        project: {
          include: { client: true },
        },
      },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    // Milestones and engagement operations are strictly gated to ACCEPTED bids
    if (bid.status !== 'ACCEPTED') {
      throw new ForbiddenException('Engagement must be ACCEPTED before managing milestones');
    }

    const isDeveloper = bid.developerId === userId;
    const isClient = bid.project?.client?.userId === userId;

    if (!isDeveloper && !isClient) {
      throw new ForbiddenException('You are not a participant in this engagement');
    }

    // Attach verified engagement details to request for downstream handlers
    req.engagement = {
      bidId: bid.id,
      projectId: bid.projectId,
      developerId: bid.developerId,
      clientId: bid.project.client.userId,
      isDeveloper,
      isClient,
    };

    return true;
  }

  private async resolveBidIdFromMilestone(milestoneId?: string): Promise<string | null> {
    if (!milestoneId) return null;
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: { bidId: true },
    });
    return milestone?.bidId ?? null;
  }
}
