import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsRepository } from '../repository/projects.repository';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectFilterDto } from '../dto/project-filter.dto';
import { canTransition } from '../helpers/project-status.helper';

@Injectable()
export class ProjectsService {
  constructor(private projectsRepository: ProjectsRepository) {}

  // A new brief always starts life as DRAFT - the client explicitly publishes it
  // before developers can see or bid on it.
  create(clientId: string, dto: CreateProjectDto) {
    return this.projectsRepository.create(clientId, { ...dto, status: 'DRAFT' });
  }

  // Public listing - DRAFT is a private state, so asking for it publicly is an error
  // rather than a silent empty list. The pagination shape is stable for the frontend.
  async list(filter: ProjectFilterDto) {
    if (filter.status === 'DRAFT') {
      throw new BadRequestException('DRAFT projects are not publicly listed');
    }
    const [items, total] = await Promise.all([
      this.projectsRepository.findMany(filter),
      this.projectsRepository.count(filter),
    ]);
    return {
      items,
      total,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 20,
    };
  }

  getById(id: string) {
    return this.projectsRepository.findById(id);
  }

  // Edits are allowed while the brief is still being shaped (DRAFT/OPEN).
  // Once a bid is accepted the project is MATCHED and the terms are locked in -
  // changing them after that would undermine the developer's acceptance.
  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.status !== 'DRAFT' && project.status !== 'OPEN') {
      throw new BadRequestException('Project can only be edited while DRAFT or OPEN');
    }
    return this.projectsRepository.update(id, dto);
  }

  publish(id: string) {
    return this.updateStatus(id, 'OPEN');
  }

  cancel(id: string) {
    return this.updateStatus(id, 'CANCELLED');
  }

  // All status changes flow through the state machine in project-status.helper.ts,
  // so illegal transitions are rejected in one place instead of scattered checks.
  async updateStatus(id: string, newStatus: string) {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (!canTransition(project.status, newStatus)) {
      throw new BadRequestException(
        `Cannot move project from ${project.status} to ${newStatus}`,
      );
    }
    return this.projectsRepository.update(id, { status: newStatus });
  }
}