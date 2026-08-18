import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { BidsService } from '../service/bids.service';
import { CreateBidDto } from '../dto/create-bid.dto';

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

  @Get('project/:projectId')
  listForProject(@Param('projectId') projectId: string) {
    return this.bidsService.listForProject(projectId);
  }

  @Post(':id/accept')
  @Roles('CLIENT')
  accept(@Param('id') id: string) {
    return this.bidsService.accept(id);
  }
}
