import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './service/notifications.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<string, string[]> = new Map();

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store socket mapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId).push(client.id);

      client.data.userId = userId;
      this.logger.log(Client connected:  for user );

      // Send unread notifications count
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unread-count', { count: unreadCount });
    } catch (error) {
      this.logger.error(Connection error: );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId).filter(id => id !== client.id);
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, sockets);
      }
    }
    this.logger.log(Client disconnected: );
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(client: Socket, payload: { notificationId: string }) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.notificationsService.markAsRead(payload.notificationId, userId);

    // Update unread count
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    client.emit('unread-count', { count: unreadCount });

    // Notify other devices for same user
    this.emitToUser(userId, 'notification-read', {
      notificationId: payload.notificationId,
    });
  }

  @SubscribeMessage('mark-all-read')
  async handleMarkAllRead(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.notificationsService.markAllAsRead(userId);

    // Update unread count
    client.emit('unread-count', { count: 0 });

    // Notify other devices for same user
    this.emitToUser(userId, 'all-notifications-read', {});
  }

  // Helper method to emit to all sockets of a user
  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.forEach(socketId => {
      this.server.to(socketId).emit(event, data);
    });
  }

  // Method for services to send notifications
  async sendNotification(userId: string, notification: any) {
    // Store in database
    const created = await this.notificationsService.create({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
    });

    // Send real-time
    this.emitToUser(userId, 'new-notification', created);

    // Update unread count
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    this.emitToUser(userId, 'unread-count', { count: unreadCount });

    return created;
  }
}
