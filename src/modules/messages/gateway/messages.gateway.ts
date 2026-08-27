import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../service/messages.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessagesGateway.name);
  private jwksClient: JwksClient;

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
    this.jwksClient = new JwksClient({
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    });
  }

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(`Disconnecting client ${client.id}: No token provided`);
      client.disconnect();
      return;
    }

    try {
      const decoded = await this.verifyToken(token);
      
      const user = await this.prisma.user.findUnique({
        where: { supabaseId: decoded.sub },
      });

      if (!user) {
        this.logger.warn(`Disconnecting client ${client.id}: Local user not found for supabaseId ${decoded.sub}`);
        client.disconnect();
        return;
      }

      if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
        this.logger.warn(`Disconnecting client ${client.id}: User status is ${user.status}`);
        client.disconnect();
        return;
      }

      // Attach the verified user details to the socket instance
      (client as any).user = {
        id: user.id, // Local application User UUID
        email: user.email,
        role: user.role,
        supabaseId: decoded.sub,
      };
      this.logger.log(`Client authenticated: ${client.id} (User: ${user.email}, Local ID: ${user.id})`);
    } catch (err) {
      this.logger.error(`Disconnecting client ${client.id}: Token validation failed`, err.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { bidId: string },
  ) {
    const user = (client as any).user;
    if (!user) {
      client.emit('error', 'Unauthorized');
      return;
    }

    const { bidId } = payload;
    if (!bidId) {
      client.emit('error', 'Invalid room identifier');
      return;
    }

    const isAuthorized = await this.validateBidAccess(user.id, bidId);
    if (!isAuthorized) {
      this.logger.warn(`Unauthorized joinRoom request by ${user.email} for Bid ${bidId}`);
      client.emit('error', 'Unauthorized access to engagement chat');
      return;
    }

    client.join(bidId);
    this.logger.log(`User ${user.email} joined room ${bidId}`);
    client.emit('joinedRoom', { bidId });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { bidId: string; content: string },
  ) {
    const user = (client as any).user;
    if (!user) {
      client.emit('error', 'Unauthorized');
      return;
    }

    const { bidId, content } = payload;
    if (!bidId || !content || content.trim() === '') {
      client.emit('error', 'Invalid payload');
      return;
    }

    const isAuthorized = await this.validateBidAccess(user.id, bidId);
    if (!isAuthorized) {
      client.emit('error', 'Unauthorized access to engagement chat');
      return;
    }

    // Persist the message in the database
    const savedMessage = await this.messagesService.send(user.id, bidId, content);

    // Broadcast the message to everyone in the room (including the sender)
    this.server.to(bidId).emit('message', savedMessage);
    this.logger.log(`Message broadcasted in room ${bidId} by ${user.email}`);
  }

  private extractToken(client: Socket): string | null {
    // 1. Check auth payload
    const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return authHeader;
    }
    // 2. Check query parameter
    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }
    return null;
  }

  private async verifyToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          this.jwksClient.getSigningKey(header.kid, (err, key) => {
            if (err) {
              callback(err);
            } else {
              callback(null, key?.getPublicKey());
            }
          });
        },
        {},
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        },
      );
    });
  }

  private async validateBidAccess(userId: string, bidId: string): Promise<boolean> {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { project: { include: { client: true } } },
    });

    if (!bid || bid.status !== 'ACCEPTED') {
      return false;
    }

    const isDeveloper = bid.developerId === userId;
    const isClient = bid.project.client.userId === userId;
    return isDeveloper || isClient;
  }
}
