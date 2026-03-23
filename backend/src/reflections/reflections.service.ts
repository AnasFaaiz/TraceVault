import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReflectionsService {
  constructor(private prisma: PrismaService) {}

  private async assertProjectOwner(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private async assertReflectionOwner(userId: string, reflectionId: string) {
    const reflection = await this.prisma.reflection.findUnique({
      where: { id: reflectionId },
      select: {
        id: true,
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!reflection) {
      throw new NotFoundException('Reflection not found');
    }

    if (reflection.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reflection');
    }
  }

  async createReflection(
    userId: string,
    projectId: string,
    data: {
      title: string;
      type: string;
      content: string;
      impact?: string;
      tools?: string[];
    },
  ) {
    await this.assertProjectOwner(userId, projectId);

    return this.prisma.reflection.create({
      data: {
        ...data,
        projectId,
      },
    });
  }

  async getRecentReflections(userId: string, limit: number = 5) {
    return this.prisma.reflection.findMany({
      where: {
        project: {
          userId,
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getGlobalFeed(limit: number = 20) {
    return this.prisma.reflection.findMany({
      include: {
        project: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getProjectReflections(userId: string, projectId: string) {
    await this.assertProjectOwner(userId, projectId);

    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        reflections: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { reflections: true },
        },
      },
    });
  }

  async getFilteredReflections(filters: {
    userId?: string;
    projectId?: string;
    search?: string;
    type?: string;
    impact?: string;
    limit?: number;
  }) {
    const { userId, projectId, search, type, impact, limit = 50 } = filters;

    const where: Record<string, any> = {};
    const and: Record<string, any>[] = [];

    if (userId) and.push({ project: { userId } });
    if (projectId) and.push({ projectId });
    if (type) and.push({ type });
    if (impact) and.push({ impact });
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (and.length > 0) where.AND = and;

    return this.prisma.reflection.findMany({
      where,
      include: {
        project: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async updateReflection(
    userId: string,
    id: string,
    data: {
      title?: string;
      type?: string;
      content?: string;
      impact?: string;
      tools?: string[];
    },
  ) {
    await this.assertReflectionOwner(userId, id);

    return this.prisma.reflection.update({
      where: { id },
      data,
    });
  }

  async deleteReflection(userId: string, id: string) {
    await this.assertReflectionOwner(userId, id);

    return this.prisma.reflection.delete({
      where: { id },
    });
  }
}
