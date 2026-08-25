import { Module } from '@nestjs/common';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './service/admin.service';
import { AdminRepository } from './repository/admin.repository';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminRepository, AuditService],
  exports: [AdminService, AuditService],
})
export class AdminModule {}
