import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// A user can only edit their own profile - compares the JWT-verified user id
// against the :id route param.
@Injectable()
export class ProfileOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const { user, params } = req;
    if (user?.id !== params?.id) {
      throw new ForbiddenException('Cannot modify another user\'s profile');
    }
    return true;
  }
}
