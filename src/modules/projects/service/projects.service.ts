import { Injectable, BadRequestException } from '@nestjs/common';
import { ProjectsRepository } from '../repository/projects.repository';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ProjectFilterDto } from '../dto/project-filter.dto';
import { canTransition } from '../helpers/project-status.helper';

@Injectable()
export class ProjectsService {
  constructor(private projectsRepository: ProjectsRepository) {}

  create(clientId: string, dto: CreateProjectDto) {
    return this.projectsRepository.create(clientId, { ...dto, status: 'DRAFT' });
  }

  list(filter: ProjectFilterDto) {
    return this.projectsRepository.findMany(filter);
  }

  getById(id: string) {
    return this.projectsRepository.findById(id);
  }

  async updateStatus(id: string, newStatus: string) {
    const project = await this.projectsRepository.findById(id);
    if (!canTransition(project.status, newStatus)) {
      throw new BadRequestException(`Cannot move project from ${project.status} to ${newStatus}`);
    }
    // TODO: persist the transition via Prisma update
  }
}
