import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repository/notifications.repository';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  message?: string;
  payload?: any;
}

@Injectable()
export class NotificationsService {
  constructor(private notificationsRepository: NotificationsRepository) {}

  create(
    userIdOrInput: string | CreateNotificationInput,
    type?: string,
    payload?: any,
  ) {
    if (typeof userIdOrInput === 'object') {
      const { userId, type: notifType, message, payload: notifPayload } = userIdOrInput;
      const effectivePayload = notifPayload ?? (message ? { message } : null);
      return this.notificationsRepository.create(userId, notifType, effectivePayload);
    }
    return this.notificationsRepository.create(userIdOrInput, type!, payload);
  }

  listForUser(userId: string) {
    return this.notificationsRepository.findForUser(userId);
  }
}
