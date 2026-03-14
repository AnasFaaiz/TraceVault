import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReflectionsService {
  constructor(private prisma: PrismaService) {}

  async createReflection(
    projectId: string,
    data: { title: string; type: string; content: string },
  ) {
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
}
