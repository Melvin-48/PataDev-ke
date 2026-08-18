import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Usage: @Roles('admin') or @Roles('client', 'developer')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
