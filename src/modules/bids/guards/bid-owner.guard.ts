import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BidOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const bid = await this.prisma.bid.findUnique({ where: { id: req.params.id } });
    if (!bid || bid.developerId !== req.user?.id) {
      throw new ForbiddenException('Not the owner of this bid');
    }
    return true;
  }
}
