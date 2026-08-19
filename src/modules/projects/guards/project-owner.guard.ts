import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Only the client who posted a project can edit or cancel it.
@Injectable()
export class ProjectOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const project = await this.prisma.project.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });
    if (!project || project.client.userId !== req.user?.id) {
      throw new ForbiddenException('Not the owner of this project');
    }
    return true;
  }
}
