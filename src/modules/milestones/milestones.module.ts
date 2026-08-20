import { Module } from '@nestjs/common';
import { MilestonesController } from './controller/milestones.controller';
import { MilestonesService } from './service/milestones.service';
import { MilestonesRepository } from './repository/milestones.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [MilestonesController],
  providers: [MilestonesService, MilestonesRepository],
  exports: [MilestonesService],
})
export class MilestonesModule {}
