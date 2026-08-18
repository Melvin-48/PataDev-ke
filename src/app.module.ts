import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './common/health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BidsModule } from './modules/bids/bids.module';
import { MilestonesModule } from './modules/milestones/milestones.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    BidsModule,
    MilestonesModule,
    MessagesModule,
    PaymentsModule,
    AdminModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
