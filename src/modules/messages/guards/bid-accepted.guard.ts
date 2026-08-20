import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Team decision: messaging only opens once the linked Bid has been accepted
// by the client - not when the project is created, not while a bid is pending.
// This is also what "closes" a declined bid's conversation: a REJECTED bid
// never passes this guard, so the thread between client and developer is dead.
@Injectable()
export class BidAcceptedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const bidId = req.body?.bidId || req.params?.bidId;
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { project: { include: { client: true } } },
    });

    if (!bid || bid.status !== 'ACCEPTED') {
      throw new ForbiddenException('Messaging opens only after the bid is accepted');
    }

    const isDeveloper = bid.developerId === req.user?.id;
    const isClient = bid.project.client.userId === req.user?.id;
    if (!isDeveloper && !isClient) {
      throw new ForbiddenException('Not part of this engagement');
    }
    return true;
  }
}
