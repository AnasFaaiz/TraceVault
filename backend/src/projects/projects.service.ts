import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: { reflections: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
