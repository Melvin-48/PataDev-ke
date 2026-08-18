import { Injectable } from '@nestjs/common';

// Admin is mostly a thin orchestration layer over Users/Projects/Payments -
// it doesn't own new data of its own, so no repository here.
@Injectable()
export class AdminService {
  approveAccount(userId: string) {
    // TODO: delegate to UsersService
    throw new Error('Not implemented');
  }

  moderateListing(projectId: string, action: 'APPROVE' | 'REMOVE') {
    // TODO: delegate to ProjectsService
    throw new Error('Not implemented');
  }
}
