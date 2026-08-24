import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Only the client who owns the bid's project can accept or decline that bid.
// Roles('CLIENT') alone is not enough - any client could otherwise act on any
// project's bids.
@Injectable()
export class BidProjectClientGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const bid = await this.prisma.bid.findUnique({
      where: { id: req.params.id },
      include: { project: { include: { client: true } } },
    });
    if (!bid || bid.project.client.userId !== req.user?.id) {
      throw new ForbiddenException('Not the client of this project');
    }
    return true;
  }
}