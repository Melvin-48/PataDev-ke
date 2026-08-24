import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProjectsService } from '../service/projects.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectFilterDto } from '../dto/project-filter.dto';
import { ProjectOwnerGuard } from '../../../common/guards/project-owner.guard';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('CLIENT')
  create(@CurrentUser() user, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  list(@Query() filter: ProjectFilterDto) {
    return this.projectsService.list(filter);
  }

  @Get(':id')
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ) {
    return this.projectsService.getById(id, user?.id);
  }

  @Patch(':id')
  @UseGuards(ProjectOwnerGuard)
  @Roles('CLIENT')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Post(':id/publish')
  @UseGuards(ProjectOwnerGuard)
  @Roles('CLIENT')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.publish(id);
  }

  @Post(':id/cancel')
  @UseGuards(ProjectOwnerGuard)
  @Roles('CLIENT')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.cancel(id);
  }
}