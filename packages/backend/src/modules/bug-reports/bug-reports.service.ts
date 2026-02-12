import { prisma } from '../../config/database';
import logger from '../../config/logger';
import { BugCategory, BugPriority } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface CreateBugReportData {
  title: string;
  description: string;
  priority: BugPriority;
  category?: BugCategory;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  url?: string;
  userAgent?: string;
  browserInfo?: string;
  deviceInfo?: string;
}

export class BugReportsService {
  async create(
    data: CreateBugReportData,
    userId: string,
    organizationId: string
  ) {
    const now = new Date();
    const bugReport = await prisma.bug_reports.create({
      data: {
        id: randomUUID(),
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        stepsToReproduce: data.stepsToReproduce,
        expectedBehavior: data.expectedBehavior,
        actualBehavior: data.actualBehavior,
        url: data.url,
        userAgent: data.userAgent,
        browserInfo: data.browserInfo,
        deviceInfo: data.deviceInfo,
        status: 'OPEN',
        reporterId: userId,
        organizationId,
        createdAt: now,
        updatedAt: now,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info(`Bug report created: ${bugReport.id} by ${userId}`);
    return bugReport;
  }

  async findAll(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};

    return prisma.bug_reports.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.bug_reports.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: string, resolvedById?: string) {
    const data: any = { status, updatedAt: new Date() };

    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
      // Note: resolvedById not in schema, skip it
    }

    return prisma.bug_reports.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.bug_reports.delete({
      where: { id },
    });
  }

  async getStats(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};

    const [total, open, inProgress, resolved, critical, high] = await Promise.all([
      prisma.bug_reports.count({ where }),
      prisma.bug_reports.count({ where: { ...where, status: 'OPEN' } }),
      prisma.bug_reports.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.bug_reports.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.bug_reports.count({ where: { ...where, priority: 'CRITICAL' } }),
      prisma.bug_reports.count({ where: { ...where, priority: 'HIGH' } }),
    ]);

    return {
      total,
      byStatus: {
        open,
        inProgress,
        resolved,
      },
      byPriority: {
        critical,
        high,
      },
    };
  }
}

export const bugReportsService = new BugReportsService();
