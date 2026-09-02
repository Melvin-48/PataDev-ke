import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Auto-provisions a single demo "counterpart" engagement so a freshly signed-up
 * user can immediately open a working chat room without any seed data.
 *
 * The backend messaging layer is bid-gated (a chat only exists once a Bid is
 * ACCEPTED between two real local Users), and the database starts empty - so
 * this service guarantees every real user has exactly one ACCEPTED engagement
 * against a fixed demo actor of the opposite role:
 *
 *   - A CLIENT user is matched with the shared demo DEVELOPER ("Demo Developer")
 *   - A DEVELOPER user is matched with the shared demo CLIENT ("Demo Client")
 *
 * The match is idempotent (upsert-based) and scoped to the user's persisted role
 * so it cannot create duplicate engagements or cross-role actors.
 */
@Injectable()
export class DemoEngagementService {
  private readonly logger = new Logger(DemoEngagementService.name);

  // A fixed demo DEVELOPER that every new CLIENT is matched against.
  private static readonly DEMO_DEVELOPER = {
    supabaseId: 'demo-developer-00000000-0000-4000-8000-000000000001',
    email: 'demo.developer@patadev.local',
    displayName: 'Demo Developer',
    bio: 'Full-stack developer ready to bring your project to life.',
    techStack: ['React', 'Node.js', 'PostgreSQL'],
  };

  // A fixed demo CLIENT that every new DEVELOPER is matched against.
  private static readonly DEMO_CLIENT = {
    supabaseId: 'demo-client-00000000-0000-4000-8000-000000000002',
    email: 'demo.client@patadev.local',
    businessName: 'Demo Company',
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures the given user has an ACCEPTED engagement against the demo
   * counterpart of the opposite role. Safe to call repeatedly.
   */
  async ensureForUser(userId: string, role: UserRole) {
    try {
      const existingEngagement = await this.prisma.bid.findFirst({
        where: {
          status: 'ACCEPTED',
          OR: [{ developerId: userId }, { project: { client: { userId } } }],
        },
      });

      if (existingEngagement) {
        return;
      }

      if (role === UserRole.CLIENT) {
        await this.ensureClientEngagement(userId);
      } else if (role === UserRole.DEVELOPER) {
        await this.ensureDeveloperEngagement(userId);
      }
    } catch (err) {
      // Demo provisioning must never break the auth flow - log and continue.
      this.logger.error(`Demo engagement provisioning failed for user ${userId}`, err.stack);
    }
  }

  private async ensureClientEngagement(clientUserId: string) {
    const dev = DemoEngagementService.DEMO_DEVELOPER;
    const developerUser = await this.prisma.user.upsert({
      where: { supabaseId: dev.supabaseId },
      update: {},
      include: { developerProfile: true },
      create: {
        supabaseId: dev.supabaseId,
        email: dev.email,
        role: UserRole.DEVELOPER,
      },
    });

    if (!developerUser.developerProfile) {
      await this.prisma.developerProfile.upsert({
        where: { userId: developerUser.id },
        update: {},
        create: {
          userId: developerUser.id,
          displayName: dev.displayName,
          bio: dev.bio,
          techStack: dev.techStack,
          verificationStatus: 'APPROVED',
        },
      });
    }

    await this.linkAcceptedBid({
      clientUserId,
      developerUserId: developerUser.id,
      title: 'Build a custom business platform',
      description:
        'A demo project workspace so you can start messaging right away. This is an example engagement with the PataDev demo developer.',
      systemType: 'CRM',
      proposedAmount: 150000,
    });
  }

  private async ensureDeveloperEngagement(developerUserId: string) {
    const client = DemoEngagementService.DEMO_CLIENT;
    const clientUser = await this.prisma.user.upsert({
      where: { supabaseId: client.supabaseId },
      update: {},
      include: { clientProfile: true },
      create: {
        supabaseId: client.supabaseId,
        email: client.email,
        role: UserRole.CLIENT,
      },
    });

    if (!clientUser.clientProfile) {
      await this.prisma.clientProfile.upsert({
        where: { userId: clientUser.id },
        update: {},
        create: {
          userId: clientUser.id,
          businessName: client.businessName,
        },
      });
    }

    await this.linkAcceptedBid({
      clientUserId: clientUser.id,
      developerUserId,
      title: 'Demo client engagement',
      description:
        'A demo project workspace so you can start messaging right away. This is an example engagement with the PataDev demo client.',
      systemType: 'POS',
      proposedAmount: 120000,
    });
  }

  private async linkAcceptedBid(params: {
    clientUserId: string;
    developerUserId: string;
    title: string;
    description: string;
    systemType: 'CRM' | 'POS';
    proposedAmount: number;
  }) {
    const { clientUserId, developerUserId, title, description, systemType, proposedAmount } = params;

    const clientProfile = await this.prisma.clientProfile.upsert({
      where: { userId: clientUserId },
      update: {},
      create: {
        userId: clientUserId,
        businessName: 'My Business',
      },
    });

    const project = await this.prisma.project.create({
      data: {
        clientId: clientProfile.id,
        title,
        description,
        systemType,
        budgetMin: proposedAmount,
        budgetMax: proposedAmount,
        status: 'MATCHED',
      },
    });

    await this.prisma.bid.create({
      data: {
        projectId: project.id,
        developerId: developerUserId,
        proposedAmount,
        status: 'ACCEPTED',
      },
    });

    this.logger.log(
      `Provisioned demo engagement: project=${project.id} developer=${developerUserId} client=${clientUserId}`,
    );
  }
}
