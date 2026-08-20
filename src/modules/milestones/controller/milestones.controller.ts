import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MilestonesService } from './service/milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { UpdateMilestoneStatusDto } from './dto/update-milestone-status.dto';
import { MilestoneResponseDto } from './dto/milestone-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('milestones')
@ApiBearerAuth()
@Controller('projects/:projectId/milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a milestone for a project' })
  @ApiResponse({ status: HttpStatus.CREATED, type: MilestoneResponseDto })
  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
    @Req() req,
  ) {
    dto.projectId = projectId;
    return this.milestonesService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all milestones for a project' })
  @ApiResponse({ status: HttpStatus.OK, type: [MilestoneResponseDto] })
  async findAll(@Param('projectId') projectId: string, @Req() req) {
    return this.milestonesService.findAll(projectId, req.user.id);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get milestone progress for a project' })
  async getProgress(@Param('projectId') projectId: string, @Req() req) {
    return this.milestonesService.getProgress(projectId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific milestone' })
  @ApiResponse({ status: HttpStatus.OK, type: MilestoneResponseDto })
  async findOne(@Param('id') id: string, @Req() req) {
    return this.milestonesService.findOne(id, req.user.id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get milestone timeline' })
  async getTimeline(@Param('id') id: string, @Req() req) {
    return this.milestonesService.getTimeline(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update milestone details' })
  @ApiResponse({ status: HttpStatus.OK, type: MilestoneResponseDto })
  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto,
    @Req() req,
  ) {
    return this.milestonesService.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update milestone status' })
  @ApiResponse({ status: HttpStatus.OK, type: MilestoneResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneStatusDto,
    @Req() req,
  ) {
    return this.milestonesService.updateStatus(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a milestone' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  async delete(@Param('id') id: string, @Req() req) {
    await this.milestonesService.delete(id, req.user.id);
    return { message: 'Milestone deleted successfully' };
  }
}
