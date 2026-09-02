import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesRepository {
  constructor(private prisma: PrismaService) {}

  create(senderId: string, bidId: string, content: string) {
    return this.prisma.message.create({ data: { senderId, bidId, content } });
  }

  findByBid(bidId: string) {
    return this.prisma.message.findMany({ where: { bidId }, orderBy: { createdAt: 'asc' } });
  }

  findBidParticipants(bidId: string) {
    return this.prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        project: { include: { client: true } },
        developer: true,
      },
    });
  }

  findUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // Every ACCEPTED engagement the user belongs to (as client or as winning
  // developer), with the counterpart details and latest message for the chat
  // list, newest engagement first.
  findConversations(userId: string) {
    return this.prisma.bid.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ developerId: userId }, { project: { client: { userId } } }],
      },
      include: {
        project: { include: { client: { include: { user: true } } } },
        developer: { include: { developerProfile: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
