import { Injectable } from '@nestjs/common';
import { MessagesRepository } from '../repository/messages.repository';

@Injectable()
export class MessagesService {
  constructor(private messagesRepository: MessagesRepository) {}

  send(senderId: string, bidId: string, content: string) {
    return this.messagesRepository.create(senderId, bidId, content);
  }

  history(bidId: string) {
    return this.messagesRepository.findByBid(bidId);
  }
}
