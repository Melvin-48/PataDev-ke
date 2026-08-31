import { Module } from '@nestjs/common';
import { NotificationsController } from './controller/notifications.controller';
import { NotificationsService } from './service/notifications.service';
import { NotificationsRepository } from './repository/notifications.repository';
import { NotificationsListener } from './listeners/notifications.listener';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, NotificationsListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
