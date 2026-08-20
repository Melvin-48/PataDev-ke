import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProjectFilterDto } from '../dto/project-filter.dto';

@Injectable()
export class ProjectsRepository {
  constructor(private prisma: PrismaService) {}

  // Status is always forced to DRAFT here; callers can't accidentally publish
  // through create - publishing has to go through the explicit service flow.
  create(clientId: string, data: any) {
    return this.prisma.project.create({ data: { ...data, clientId } });
  }

  // client is included so the frontend can render the business name without a
  // second round-trip. Ordering is newest-first for the browse experience.
  findMany(filter: ProjectFilterDto) {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    return this.prisma.project.findMany({
      where: this.buildWhere(filter),
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { client: true },
    });
  }

  // Count uses the exact same filter as findMany so pagination stays consistent.
  count(filter: ProjectFilterDto) {
    return this.prisma.project.count({ where: this.buildWhere(filter) });
  }

  findById(id: string) {
    return this.prisma.project.findUnique({ where: { id }, include: { bids: true } });
  }

  update(id: string, data: any) {
    return this.prisma.project.update({ where: { id }, data });
  }

  // Builds a single where clause shared by findMany and count so the two can
  // never drift apart. Budget filtering treats the range as overlapping intervals
  // (project [min,max] vs filter [min,max]) rather than exact matches.
  private buildWhere(filter: ProjectFilterDto): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {};

    if (filter.status) {
      where.status = filter.status as ProjectStatus;
    }

    if (filter.systemType) {
      where.systemType = filter.systemType;
    }

    const and: Prisma.ProjectWhereInput[] = [];

    // Case-insensitive contains on title/description - good enough for MVP
    // search; a full-text index is a later optimization.
    if (filter.search) {
      and.push({
        OR: [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ],
      });
    }

    // Range overlap: a project matches the filter if the project's budget band
    // intersects the filter's band. Both fields are nullable, so each clause
    // checks either end of the project's range.
    if (filter.budgetMin !== undefined) {
      and.push({
        OR: [
          { budgetMax: { gte: filter.budgetMin } },
          { budgetMin: { gte: filter.budgetMin } },
        ],
      });
    }

    if (filter.budgetMax !== undefined) {
      and.push({
        OR: [
          { budgetMin: { lte: filter.budgetMax } },
          { budgetMax: { lte: filter.budgetMax } },
        ],
      });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    return where;
  }
}