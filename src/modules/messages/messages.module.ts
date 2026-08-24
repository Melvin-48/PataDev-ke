import { Module } from '@nestjs/common';
import { MessagesController } from './controller/messages.controller';
import { MessagesService } from './service/messages.service';
import { MessagesRepository } from './repository/messages.repository';
import { MessagesGateway } from './gateway/messages.gateway';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
