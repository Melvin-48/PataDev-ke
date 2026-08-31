import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { EngagementParticipantGuard } from '../../../common/guards/engagement-participant.guard';
import { MilestonesService } from '../service/milestones.service';
import { CreateMilestoneDto } from '../dto/create-milestone.dto';
import { UpdateMilestoneStatusDto } from '../dto/update-milestone-status.dto';

@ApiTags('milestones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  @UseGuards(EngagementParticipantGuard)
  async create(@Body() dto: CreateMilestoneDto) {
    return this.milestonesService.create(dto);
  }

  @Get('bid/:bidId')
  @UseGuards(EngagementParticipantGuard)
  async listForBid(@Param('bidId') bidId: string) {
    return this.milestonesService.listForBid(bidId);
  }

  @Patch(':id/status')
  @UseGuards(EngagementParticipantGuard)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateMilestoneStatusDto) {
    return this.milestonesService.transitionStatus(id, dto.status);
  }
}
