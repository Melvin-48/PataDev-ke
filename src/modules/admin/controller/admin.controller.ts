import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminService } from '../service/admin.service';
import { ApproveAccountDto } from '../dto/approve-account.dto';
import { ModerateListingDto } from '../dto/moderate-listing.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('approve-account')
  approveAccount(@Body() dto: ApproveAccountDto) {
    return this.adminService.approveAccount(dto.userId);
  }

  @Post('moderate-listing')
  moderateListing(@Body() dto: ModerateListingDto) {
    return this.adminService.moderateListing(dto.projectId, dto.action);
  }
}
