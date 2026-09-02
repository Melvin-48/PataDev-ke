import { Module } from '@nestjs/common';
import { UsersController } from './controller/users.controller';
import { UsersService } from './service/users.service';
import { UsersRepository } from './repository/users.repository';

import { RolesGuard } from '../../common/guards/roles.guard';
import { ProfileOwnershipGuard } from './guards/profile-ownership.guard';
import { DemoEngagementService } from '../demo/demo-engagement.service';

@Module({

  controllers: [UsersController],
  providers: [UsersService, UsersRepository, RolesGuard, ProfileOwnershipGuard, DemoEngagementService],
  exports: [UsersService],
})
export class UsersModule {}

