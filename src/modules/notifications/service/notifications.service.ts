import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repository/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private notificationsRepository: NotificationsRepository) {}

  create(userId: string, type: string, payload: any) {
    return this.notificationsRepository.create(userId, type, payload);
  }

  listForUser(userId: string) {
    return this.notificationsRepository.findForUser(userId);
  }
}
