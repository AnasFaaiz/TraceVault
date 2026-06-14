import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}
  async createProject(
    userId: string,
    name: string,
    techStack: string[],
    description?: string,
  ) {
    return this.prisma.project.create({
      data: {
        name,
        description,
        techStack,
        userId,
      },
    });
  }

  async getUserProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        reflections: {
          select: {
            id: true,
            createdAt: true,
            category: true,
            impact: true,
            tags: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedProjects = projects.map((project) => {
      const reflections = project.reflections || [];
      const entryCount = reflections.length;

      // Last activity
      const lastActivityAt =
        reflections.length > 0
          ? reflections.reduce((latest, current) =>
              new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest,
            ).createdAt
          : null;

      // Category Breakdown
      const categoryMap: Record<string, number> = {};
      reflections.forEach((r) => {
        const type = r.category || 'general';
        categoryMap[type] = (categoryMap[type] || 0) + 1;
      });

      // Optimized
      const categoryBreakdown = Object.entries(categoryMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Impact Summary
      const impactSummary = {
        minorCount: reflections.filter((r) => r.impact === 'MINOR').length,
        moderateCount: reflections.filter((r) => r.impact === 'MODERATE')
          .length,
        criticalCount: reflections.filter((r) => r.impact === 'CRITICAL')
          .length,
        breakingCount: reflections.filter((r) => r.impact === 'BREAKING')
          .length,
      };

      // Top Tags
      const tagCounts: Record<string, number> = {};
      reflections.forEach((r) => {
        (r.tags || []).forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([tag]) => tag);

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        lastActivityAt,
        entryCount,
        categoryBreakdown,
        topTags,
        impactSummary,
      };
    });

    return {
      projects: enrichedProjects,
      totalProjects: projects.length,
    };
  }

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

  async updateProject(
    userId: string,
    id: string,
    data: { name?: string; description?: string; techStack?: string[] },
  ) {
    await this.assertProjectOwner(userId, id);

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async deleteProject(userId: string, id: string) {
    await this.assertProjectOwner(userId, id);

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
