import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProjectsService } from '../service/projects.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ProjectFilterDto } from '../dto/project-filter.dto';

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
  getById(@Param('id') id: string) {
    return this.projectsService.getById(id);
  }
}
