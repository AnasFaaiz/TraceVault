import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { validateFields } from './template-definitions';
import type { TemplateType } from './template-definitions';

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

  /**
   * Create a new reflection with structured fields
   */
  async createReflection(
    userId: string,
    projectId: string,
    data: {
      title: string;
      category: string;
      template_type: string;
      impact?: string;
      tags?: string[];
      fields?: Record<string, any>;
      content?: string; // Legacy support
    },
  ) {
    await this.assertProjectOwner(userId, projectId);

    // Validate structured fields if provided
    if (data.fields && data.template_type) {
      const validation = validateFields(
        data.template_type as TemplateType,
        data.fields,
      );
      if (!validation.valid) {
        throw new Error(
          `Missing required fields: ${validation.missingFields.join(', ')}`,
        );
      }
    }

    return this.prisma.reflection.create({
      data: {
        title: data.title,
        category: data.category,
        template_type: data.template_type,
        impact: data.impact || 'minor',
        tags: data.tags || [],
        ...(data.fields !== undefined ? { fields: data.fields } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}), // Legacy support
        projectId,
        userId,
      },
    });
  }

  /**
   * Get recent reflections for a user
   */
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

  /**
   * Get global feed
   */
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

  /**
   * Get reflections for a specific project
   */
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

  /**
   * Get single reflection by ID
   */
  async getReflectionById(userId: string, id: string) {
    const reflection = await this.prisma.reflection.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!reflection) {
      throw new NotFoundException('Reflection not found');
    }

    // Check authorization
    if (reflection.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reflection');
    }

    return reflection;
  }

  /**
   * Get filtered reflections with search, type, impact filters
   */
  async getFilteredReflections(filters: {
    userId?: string;
    projectId?: string;
    search?: string;
    category?: string;
    impact?: string;
    limit?: number;
  }) {
    const { userId, projectId, search, category, impact, limit = 50 } = filters;

    const where: Record<string, any> = {};
    const and: Record<string, any>[] = [];

    if (userId) and.push({ project: { userId } });
    if (projectId) and.push({ projectId });
    if (category) and.push({ category });
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

  /**
   * Update an existing reflection
   */
  async updateReflection(
    userId: string,
    id: string,
    data: {
      title?: string;
      category?: string;
      template_type?: string;
      impact?: string;
      tags?: string[];
      fields?: Record<string, any>;
      content?: string; // Legacy support
    },
  ) {
    await this.assertReflectionOwner(userId, id);

    // Validate structured fields if provided
    if (data.fields && data.template_type) {
      const validation = validateFields(
        data.template_type as TemplateType,
        data.fields,
      );
      if (!validation.valid) {
        throw new Error(
          `Missing required fields: ${validation.missingFields.join(', ')}`,
        );
      }
    }

    return this.prisma.reflection.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a reflection
   */
  async deleteReflection(userId: string, id: string) {
    await this.assertReflectionOwner(userId, id);

    return this.prisma.reflection.delete({
      where: { id },
    });
  }
}
