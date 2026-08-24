import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { BidsService } from '../service/bids.service';
import { CreateBidDto } from '../dto/create-bid.dto';
import { BidProjectClientGuard } from '../guards/bid-project-client.guard';
import { ProjectOwnerGuard } from '../../../common/guards/project-owner.guard';

@ApiTags('bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @Roles('DEVELOPER')
  create(@CurrentUser() user, @Body() dto: CreateBidDto) {
    return this.bidsService.create(user.id, dto);
  }

  // Developer's own bid list, across all projects. Registered before any
  // future GET /bids/:id route - NestJS/Express match routes in registration
  // order, so a literal path like "mine" must come before a param route like
  // ":id" or requests to /bids/mine would be swallowed as id="mine" instead.
  @Get('mine')
  @Roles('DEVELOPER')
  listMine(@CurrentUser() user) {
    return this.bidsService.listMine(user.id);
  }

  // Client-only: viewing the full bid list on a project is restricted to the
  // client who owns it, so competing developers can't see each other's bids.
  @Get('project/:projectId')
  @UseGuards(ProjectOwnerGuard)
  @Roles('CLIENT')
  listForProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.bidsService.listForProject(projectId);
  }

  @Post(':id/accept')
  @UseGuards(BidProjectClientGuard)
  @Roles('CLIENT')
  accept(@Param('id', ParseUUIDPipe) id: string) {
    return this.bidsService.accept(id);
  }

  @Post(':id/decline')
  @UseGuards(BidProjectClientGuard)
  @Roles('CLIENT')
  decline(@Param('id', ParseUUIDPipe) id: string) {
    return this.bidsService.decline(id);
  }
}