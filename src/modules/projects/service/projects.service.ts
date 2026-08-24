import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsRepository } from '../repository/projects.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectFilterDto } from '../dto/project-filter.dto';
import { canTransition } from '../helpers/project-status.helper';

@Injectable()
export class ProjectsService {
  constructor(
    private projectsRepository: ProjectsRepository,
    private prisma: PrismaService,
  ) {}

  // A new brief always starts life as DRAFT - the client explicitly publishes it
  // before developers can see or bid on it.
  //
  // Project.clientId is a FK to ClientProfile.id, not User.id, so the caller's
  // user id has to be mapped through their profile row first.
  async create(userId: string, dto: CreateProjectDto) {
    if (
      dto.budgetMin !== undefined &&
      dto.budgetMax !== undefined &&
      dto.budgetMin > dto.budgetMax
    ) {
      throw new BadRequestException('budgetMin cannot be greater than budgetMax');
    }
    const profile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException('Create your client profile before posting projects');
    }
    return this.projectsRepository.create(profile.id, { ...dto, status: 'DRAFT' });
  }

  // Public listing - DRAFT is a private state, so asking for it publicly is an error
  // rather than a silent empty list. The pagination shape is stable for the frontend.
  // When no status filter is given we default to OPEN: the browse feed should show
  // projects developers can actually bid on, not MATCHED/COMPLETED/CANCELLED history.
  async list(filter: ProjectFilterDto) {
    const effective = { ...filter, status: filter.status ?? 'OPEN' };
    if (effective.status === 'DRAFT') {
      throw new BadRequestException('DRAFT projects are not publicly listed');
    }
    const [items, total] = await Promise.all([
      this.projectsRepository.findMany(effective),
      this.projectsRepository.count(effective),
    ]);
    return {
      items,
      total,
      page: effective.page ?? 1,
      pageSize: effective.pageSize ?? 20,
    };
  }

  async getById(id: string, requesterId?: string) {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    // Drafts are only visible to their owner; everyone else gets the same 404
    // as a missing project so private briefs aren't even enumerable.
    if (project.status === 'DRAFT' && project.client.userId !== requesterId) {
      throw new NotFoundException('Project not found');
    }
    return project;
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