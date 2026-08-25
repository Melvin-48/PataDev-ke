import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// Accepts both ADMIN and SUPER_ADMIN — used for payout confirmation and
// other admin-gated payment operations.
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
