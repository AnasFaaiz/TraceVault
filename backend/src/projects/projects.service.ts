import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}
  async createProject(
    userId: string,
    name: string,
    description: string,
    techStack: string[],
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
}
