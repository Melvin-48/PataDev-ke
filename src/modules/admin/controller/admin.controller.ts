import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminService } from '../service/admin.service';
import { ListUsersDto } from '../dto/list-users.dto';
import { AdjustUserStatusDto } from '../dto/adjust-user-status.dto';
import { VerifyDeveloperDto } from '../dto/verify-developer.dto';
import { ModerateListingDto } from '../dto/moderate-listing.dto';
import { CreateDisputeDto } from '../dto/create-dispute.dto';
import { ResolveDisputeDto } from '../dto/resolve-dispute.dto';
import { PromoteAdminDto } from '../dto/promote-admin.dto';
import { SetPlatformFeeDto } from '../dto/set-platform-fee.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── User management ──────────────────────────────────────────────

  @Get('users')
  @Roles('ADMIN', 'SUPER_ADMIN')
  listUsers(@Query() dto: ListUsersDto) {
    return this.adminService.listUsers(dto);
  }

  @Get('users/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/status')
  @Roles('SUPER_ADMIN')
  adjustStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AdjustUserStatusDto,
  ) {
    return this.adminService.adjustStatus(user.id, { ...dto, userId: id });
  }

  // ── Developer verification ───────────────────────────────────────

  @Post('verify-developer')
  @Roles('ADMIN', 'SUPER_ADMIN')
  verifyDeveloper(@CurrentUser() user: any, @Body() dto: VerifyDeveloperDto) {
    return this.adminService.verifyDeveloper(user.id, dto);
  }

  // ── Listing moderation ───────────────────────────────────────────

  @Post('moderate-listing')
  @Roles('ADMIN', 'SUPER_ADMIN')
  moderateListing(@CurrentUser() user: any, @Body() dto: ModerateListingDto) {
    return this.adminService.moderateListing(user.id, dto.projectId, dto.action);
  }

  // ── Disputes ─────────────────────────────────────────────────────

  @Post('disputes')
  @Roles('CLIENT', 'DEVELOPER', 'ADMIN', 'SUPER_ADMIN')
  raiseDispute(@CurrentUser() user: any, @Body() dto: CreateDisputeDto) {
    return this.adminService.raiseDispute(user.id, dto);
  }

  @Get('disputes')
  @Roles('ADMIN', 'SUPER_ADMIN')
  listDisputes(@Query() dto: { page?: number; pageSize?: number; status?: string }) {
    return this.adminService.listDisputes(dto);
  }

  @Get('disputes/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getDispute(@Param('id') id: string) {
    return this.adminService.getDispute(id);
  }

  @Patch('disputes/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  resolveDispute(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Omit<ResolveDisputeDto, 'disputeId'>,
  ) {
    return this.adminService.resolveDispute(user.id, { ...dto, disputeId: id });
  }

  // ── Admin management (super-only) ────────────────────────────────

  @Post('promote')
  @Roles('SUPER_ADMIN')
  promoteAdmin(@CurrentUser() user: any, @Body() dto: PromoteAdminDto) {
    return this.adminService.promoteAdmin(user.id, dto);
  }

  // ── Financial reports ────────────────────────────────────────────

  @Get('financial-report')
  @Roles('SUPER_ADMIN')
  financialReport() {
    return this.adminService.financialReport();
  }

  // ── Platform fees (super-only) ───────────────────────────────────

  @Get('settings/fee')
  @Roles('SUPER_ADMIN')
  getFee() {
    return this.adminService.getFee();
  }

  @Patch('settings/fee')
  @Roles('SUPER_ADMIN')
  setFee(@CurrentUser() user: any, @Body() dto: SetPlatformFeeDto) {
    return this.adminService.setFee(user.id, dto);
  }

  // ── Audit logs ───────────────────────────────────────────────────

  @Get('audit-logs')
  @Roles('SUPER_ADMIN')
  listAuditLogs(
    @Query() dto: { page?: number; pageSize?: number; adminId?: string },
  ) {
    return this.adminService.listAuditLogs(dto);
  }
}
