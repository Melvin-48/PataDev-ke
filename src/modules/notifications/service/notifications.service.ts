import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationFilterDto } from '../dto/notification-filter.dto';
import { NotificationType } from '../enums/notification-type.enum';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        metadata: dto.metadata || {},
      },
    });
  }

  async findAll(filter: NotificationFilterDto) {
    const { userId, type, isRead, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.findOne(id, userId);
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // ========== Specific Notification Methods ==========

  async notifyNewBid(projectId: string, bidderId: string, clientId: string) {
    return this.create({
      userId: clientId,
      type: NotificationType.NEW_BID_RECEIVED,
      title: 'New Bid Received',
      message: A developer has submitted a bid on your project,
      metadata: { projectId, bidderId },
    });
  }

  async notifyBidAccepted(bidId: string, bidderId: string, clientId: string) {
    return this.create({
      userId: bidderId,
      type: NotificationType.BID_ACCEPTED,
      title: 'Bid Accepted!',
      message: Your bid has been accepted by the client,
      metadata: { bidId, clientId },
    });
  }

  async notifyBidRejected(bidId: string, bidderId: string) {
    return this.create({
      userId: bidderId,
      type: NotificationType.BID_REJECTED,
      title: 'Bid Rejected',
      message: Your bid was not accepted by the client,
      metadata: { bidId },
    });
  }

  async notifyMilestoneSubmitted(milestoneId: string, clientId: string) {
    return this.create({
      userId: clientId,
      type: NotificationType.MILESTONE_SUBMITTED,
      title: 'Milestone Submitted',
      message: A milestone has been submitted for your approval,
      metadata: { milestoneId },
    });
  }

  async notifyMilestoneApproved(milestoneId: string, developerId: string) {
    return this.create({
      userId: developerId,
      type: NotificationType.MILESTONE_APPROVED,
      title: 'Milestone Approved',
      message: Your milestone has been approved by the client,
      metadata: { milestoneId },
    });
  }

  async notifyMilestoneRejected(milestoneId: string, developerId: string) {
    return this.create({
      userId: developerId,
      type: NotificationType.MILESTONE_REJECTED,
      title: 'Milestone Rejected',
      message: Your milestone submission was rejected by the client,
      metadata: { milestoneId },
    });
  }

  async notifyPayoutSent(projectId: string, developerId: string, amount: number) {
    return this.create({
      userId: developerId,
      type: NotificationType.PAYOUT_SENT,
      title: 'Payout Sent!',
      message: A payout of UTF8{amount} has been sent to your account,
      metadata: { projectId, amount },
    });
  }

  async notifyProjectCompleted(projectId: string, clientId: string, developerId: string) {
    const [clientNotif, devNotif] = await Promise.all([
      this.create({
        userId: clientId,
        type: NotificationType.PROJECT_COMPLETED,
        title: 'Project Completed',
        message: Your project has been marked as completed,
        metadata: { projectId },
      }),
      this.create({
        userId: developerId,
        type: NotificationType.PROJECT_COMPLETED,
        title: 'Project Completed',
        message: The project has been completed. Payout is being processed.,
        metadata: { projectId },
      }),
    ]);

    return { clientNotif, devNotif };
  }

  async notifyNewMessage(conversationId: string, recipientId: string, senderName: string) {
    return this.create({
      userId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      message: You have a new message from ,
      metadata: { conversationId },
    });
  }
}
