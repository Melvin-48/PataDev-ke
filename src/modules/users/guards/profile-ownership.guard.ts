import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class ProfileOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const { user, params } = req;

    // ADMIN may access any profile
    if (user?.role === UserRole.ADMIN) {
      return true;
    }

    // The route param is :userId; fall back to :id if the route uses that name
    const targetId = params?.userId ?? params?.id;
    if (user?.localUserId !== targetId) {
      throw new ForbiddenException("Cannot access another user's profile");
    }
    return true;
  }
}
