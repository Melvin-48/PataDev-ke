import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMilestoneDto } from '../dto/create-milestone.dto';
import { UpdateMilestoneDto } from '../dto/update-milestone.dto';
import { UpdateMilestoneStatusDto } from '../dto/update-milestone-status.dto';
import { MilestoneStatus, MilestoneTransitions } from '../enums/milestone-status.enum';

@Injectable()
export class MilestonesService {
  private readonly logger = new Logger(MilestonesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMilestoneDto, userId: string) {
    // Verify project exists and user is client
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { clientId: true, status: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.clientId !== userId) {
      throw new ForbiddenException('Only the project client can create milestones');
    }

    // Get the highest order for this project
    const maxOrder = await this.prisma.milestone.aggregate({
      where: { projectId: dto.projectId },
      _max: { order: true },
    });

    const order = dto.order ?? (maxOrder._max.order ?? -1) + 1;

    return this.prisma.milestone.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        order,
        status: MilestoneStatus.PENDING,
      },
    });
  }

  async findAll(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, developerId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user is part of the project
    if (project.clientId !== userId && project.developerId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            clientId: true,
            developerId: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Check access
    if (
      milestone.project.clientId !== userId &&
      milestone.project.developerId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this milestone');
    }

    return milestone;
  }

  async update(id: string, dto: UpdateMilestoneDto, userId: string) {
    const milestone = await this.findOne(id, userId);

    // Only client can update milestone details
    if (milestone.project.clientId !== userId) {
      throw new ForbiddenException('Only the client can update milestone details');
    }

    return this.prisma.milestone.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        order: dto.order,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateMilestoneStatusDto, userId: string) {
    const milestone = await this.findOne(id, userId);
    const { status, note } = dto;
    const currentStatus = milestone.status;

    // Check if transition is allowed
    const allowedTransitions = MilestoneTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(status)) {
      throw new BadRequestException(
        Cannot transition from  to ,
      );
    }

    // Check permissions based on role
    const isClient = milestone.project.clientId === userId;
    const isDeveloper = milestone.project.developerId === userId;

    // Developer can: NOT_STARTED -> IN_PROGRESS -> SUBMITTED
    // Client can: SUBMITTED -> APPROVED | REJECTED
    if (isDeveloper) {
      const developerAllowed = [
        MilestoneStatus.IN_PROGRESS,
        MilestoneStatus.SUBMITTED,
      ];
      if (!developerAllowed.includes(status)) {
        throw new ForbiddenException(
          'Developer can only set status to IN_PROGRESS or SUBMITTED',
        );
      }
    } else if (isClient) {
      const clientAllowed = [MilestoneStatus.APPROVED, MilestoneStatus.REJECTED];
      if (!clientAllowed.includes(status)) {
        throw new ForbiddenException(
          'Client can only set status to APPROVED or REJECTED',
        );
      }
    } else {
      throw new ForbiddenException('You are not part of this project');
    }

    // Build update data with timestamps
    const data: any = { status };
    if (note) data.rejectionReason = note;

    switch (status) {
      case MilestoneStatus.IN_PROGRESS:
        data.startedAt = new Date();
        break;
      case MilestoneStatus.SUBMITTED:
        data.submittedAt = new Date();
        break;
      case MilestoneStatus.APPROVED:
        data.approvedAt = new Date();
        data.completedAt = new Date();
        break;
      case MilestoneStatus.REJECTED:
        data.rejectionReason = note || 'No reason provided';
        break;
    }

    const updated = await this.prisma.milestone.update({
      where: { id },
      data,
    });

    // Add to timeline (if you have a timeline table)
    await this.prisma.milestoneTimeline.create({
      data: {
        milestoneId: id,
        status,
        note: note || undefined,
        updatedBy: userId,
      },
    });

    // Check if all milestones are approved -> auto-complete project
    if (status === MilestoneStatus.APPROVED) {
      const allMilestones = await this.prisma.milestone.findMany({
        where: { projectId: milestone.projectId },
      });

      const allApproved = allMilestones.every(
        m => m.status === MilestoneStatus.APPROVED,
      );

      if (allApproved) {
        await this.prisma.project.update({
          where: { id: milestone.projectId },
          data: { status: 'COMPLETED' },
        });
      }
    }

    return updated;
  }

  async delete(id: string, userId: string) {
    const milestone = await this.findOne(id, userId);

    if (milestone.project.clientId !== userId) {
      throw new ForbiddenException('Only the client can delete milestones');
    }

    if (milestone.status !== MilestoneStatus.PENDING) {
      throw new BadRequestException('Cannot delete a milestone that is not pending');
    }

    return this.prisma.milestone.delete({ where: { id } });
  }

  async getTimeline(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.milestoneTimeline.findMany({
      where: { milestoneId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        updatedByUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async getProgress(projectId: string, userId: string) {
    const milestones = await this.findAll(projectId, userId);

    const total = milestones.length;
    const completed = milestones.filter(
      m => m.status === MilestoneStatus.APPROVED,
    ).length;
    const inProgress = milestones.filter(
      m => m.status === MilestoneStatus.IN_PROGRESS || m.status === MilestoneStatus.SUBMITTED,
    ).length;

    return {
      total,
      completed,
      inProgress,
      pending: total - completed - inProgress,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      milestones,
    };
  }
}
