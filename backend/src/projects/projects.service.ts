import { Injectable } from '@nestjs/common';
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

  async updateProject(id: string, data: { name?: string; description?: string; techStack?: string[] }) {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async deleteProject(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
