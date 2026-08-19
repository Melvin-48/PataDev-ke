import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Only the matched client + developer pair (via the milestone's Bid) may view/update it.
@Injectable()
export class MilestoneAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: req.params.id },
      include: { bid: { include: { project: { include: { client: true } } } } },
    });
    if (!milestone) throw new ForbiddenException('Milestone not found');

    const isDeveloper = milestone.bid.developerId === req.user?.id;
    const isClient = milestone.bid.project.client.userId === req.user?.id;
    if (!isDeveloper && !isClient) {
      throw new ForbiddenException('Not part of this engagement');
    }
    return true;
  }
}
