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
}
