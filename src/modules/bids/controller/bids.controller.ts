import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { BidsService } from '../service/bids.service';
import { CreateBidDto } from '../dto/create-bid.dto';
import { BidProjectClientGuard } from '../guards/bid-project-client.guard';

@ApiTags('bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  // Only developers bid; the service enforces project-OPEN, not-own-project
  // and one-pending-bid-per-developer rules.
  @Post()
  @Roles('DEVELOPER')
  create(@CurrentUser() user, @Body() dto: CreateBidDto) {
    return this.bidsService.create(user.id, dto);
  }

  @Get('project/:projectId')
  listForProject(@Param('projectId') projectId: string) {
    return this.bidsService.listForProject(projectId);
  }

  // Accepting one bid closes the round: bid -> ACCEPTED, others -> REJECTED,
  // project -> MATCHED. Guarded by project ownership, not just the CLIENT role.
  @Post(':id/accept')
  @UseGuards(BidProjectClientGuard)
  @Roles('CLIENT')
  accept(@Param('id') id: string) {
    return this.bidsService.accept(id);
  }

  // Decline is the client's explicit rejection of a single bid. The bid's
  // message thread stays closed (only ACCEPTED bids can message).
  @Post(':id/decline')
  @UseGuards(BidProjectClientGuard)
  @Roles('CLIENT')
  decline(@Param('id') id: string) {
    return this.bidsService.decline(id);
  }
}