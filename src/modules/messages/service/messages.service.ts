import { Injectable } from '@nestjs/common';
import { MessagesRepository } from '../repository/messages.repository';

const DEMO_PARTNER_SUPABASE_IDS = [
  'demo-developer-00000000-0000-4000-8000-000000000001',
  'demo-client-00000000-0000-4000-8000-000000000002',
];

const CANNED_REPLIES = [
  'Got it. I will look into that right away.',
  'Thanks for the update. Let me check on that.',
  'Understood. I will get back to you shortly with more details.',
  'Great point. I will incorporate that into the plan.',
  'On it - I will prepare a draft outline and share it soon.',
];

@Injectable()
export class MessagesService {
  constructor(private messagesRepository: MessagesRepository) {}

  send(senderId: string, bidId: string, content: string) {
    return this.messagesRepository.create(senderId, bidId, content);
  }

  history(bidId: string) {
    return this.messagesRepository.findByBid(bidId);
  }

  /**
   * Chat-list payloads for the current user (either role). Each entry is one
   * ACCEPTED engagement the user participates in, prepared for display in the
   * conversations UI.
   */
  async conversations(userId: string) {
    const bids = await this.messagesRepository.findConversations(userId);
    return bids.map((bid) => {
      const client = bid.project?.client;
      const developer = bid.developer;
      const lastMessage = bid.messages?.[0] ?? null;
      const requesterIsClient = client?.userId === userId;

      return {
        bidId: bid.id,
        projectId: bid.projectId,
        projectTitle: bid.project?.title ?? 'Project',
        systemType: bid.project?.systemType ?? 'CRM',
        counterpartId: requesterIsClient ? developer?.id : client?.userId,
        counterpartName: requesterIsClient
          ? developer?.developerProfile?.displayName ?? developer?.email ?? 'Developer'
          : client?.businessName ?? client?.user?.email ?? 'Client',
        counterpartRole: requesterIsClient ? 'DEVELOPER' : 'CLIENT',
        proposedAmount: Number(bid.proposedAmount),
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
            }
          : null,
        createdAt: bid.createdAt,
      };
    });
  }

  /**
   * If the conversation's counterpart is the shared demo actor (a first-time
   * user's auto-provisioned chat room), create a canned reply on its behalf so
   * the room feels alive. Returns the auto-reply message, or null when there
   * is no demo counterpart.
   */
  async autoReply(senderId: string, bidId: string) {
    const participants = await this.messagesRepository.findBidParticipants(bidId);
    if (!participants || participants.status !== 'ACCEPTED') return null;

    const clientUserId = participants.project?.client?.userId;
    const developerId = participants.developerId;
    if (!clientUserId || !developerId) return null;

    const counterpartId = senderId === developerId ? clientUserId : developerId;
    if (senderId !== clientUserId && senderId !== developerId) return null;

    const isDemo = await this.isDemoActor(counterpartId);
    if (!isDemo) return null;

    const reply =
      CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];

    try {
      return await this.messagesRepository.create(counterpartId, bidId, reply);
    } catch {
      return null;
    }
  }

  private async isDemoActor(userId: string | undefined | null): Promise<boolean> {
    if (!userId) return false;
    const user = await this.messagesRepository.findUserById(userId);
    return user ? DEMO_PARTNER_SUPABASE_IDS.includes(user.supabaseId) : false;
  }
}
