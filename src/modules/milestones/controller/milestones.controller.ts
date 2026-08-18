import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { MilestoneAccessGuard } from '../guards/milestone-access.guard';
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
  create(@Body() dto: CreateMilestoneDto) {
    return this.milestonesService.create(dto);
  }

  @Get('bid/:bidId')
  listForBid(@Param('bidId') bidId: string) {
    return this.milestonesService.listForBid(bidId);
  }

  @Patch(':id/status')
  @UseGuards(MilestoneAccessGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMilestoneStatusDto) {
    // NOTE: fetch currentStatus from the record before calling service.updateStatus
    // in the real implementation - simplified here for scaffold purposes.
    return this.milestonesService.updateStatus(id, dto.status, 'PENDING');
  }
}
