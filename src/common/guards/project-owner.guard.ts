import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

// Confirms the authenticated user is the CLIENT who owns the project being
// acted on. Shared across modules because the same check is needed with
// different route param names:
//   - Projects routes use :id        (e.g. PATCH /projects/:id)
//   - Bids routes use :projectId     (e.g. GET /bids/project/:projectId)
@Injectable()
export class ProjectOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const projectId = req.params.id ?? req.params.projectId;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    // req.user.id is the local User.id resolved by JwtStrategy from the
    // Supabase sub, so it is comparable to ClientProfile.userId.
    if (project.client.userId !== req.user?.id) {
      throw new ForbiddenException('Only the project owner can perform this action');
    }
    return true;
  }
}
