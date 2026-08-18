import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// Payout confirmation is admin-only for MVP - no automated release.
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }
    return true;
  }
}
