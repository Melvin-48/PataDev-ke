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
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProjectsService } from '../service/projects.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectFilterDto } from '../dto/project-filter.dto';
import { ProjectOwnerGuard } from '../guards/project-owner.guard';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Clients create briefs as DRAFT; they publish later once they're happy with it.
  @Post()
  @Roles('CLIENT')
  create(@CurrentUser() user, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  // Public browse list for developers - DRAFT projects never appear here.
  @Get()
  list(@Query() filter: ProjectFilterDto) {
    return this.projectsService.list(filter);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.projectsService.getById(id);
  }

  // Only the owning client can edit; edits are frozen once the project is MATCHED
  // (or worse) so both sides can rely on what was agreed.
  @Patch(':id')
  @UseGuards(ProjectOwnerGuard)
  @Roles('CLIENT')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  // Publish moves DRAFT -> OPEN and makes the brief visible to developers.
  @Post(':id/publish')
  @UseGuards(ProjectOwnerGuard)
  @Roles('CLIENT')
  publish(@Param('id') id: string) {
    return this.projectsService.publish(id);
  }

  // Cancelling takes the project out of circulation; developers stop seeing it.
  @Post(':id/cancel')
  @UseGuards(ProjectOwnerGuard)
  @Roles('CLIENT')
  cancel(@Param('id') id: string) {
    return this.projectsService.cancel(id);
  }
}