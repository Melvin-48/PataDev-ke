import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MessagesRepository {
  constructor(private prisma: PrismaService) {}

  create(senderId: string, bidId: string, content: string) {
    return this.prisma.message.create({ data: { senderId, bidId, content } });
  }

  findByBid(bidId: string) {
    return this.prisma.message.findMany({ where: { bidId }, orderBy: { createdAt: 'asc' } });
  }
}
