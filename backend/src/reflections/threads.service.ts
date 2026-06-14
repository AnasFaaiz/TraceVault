import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ThreadsGateway } from './threads.gateway';

export interface ThreadMessageDto {
  id: string;
  reflectionId: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

@Injectable()
export class ThreadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ThreadsGateway,
  ) {}

  async getThread(reflectionId: string, limit = 30, before?: string) {
    const reflection = await this.prisma.reflection.findUnique({
      where: { id: reflectionId },
      select: { id: true },
    });

    if (!reflection) {
      throw new NotFoundException('Reflection not found');
    }

    const thread = await this.ensureThread(reflectionId);

    const whereClause: { threadId: string; createdAt?: { lt: Date } } = {
      threadId: thread.id,
    };

    if (before) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) {
        whereClause.createdAt = { lt: beforeDate };
      }
    }

    const messages = await this.prisma.threadMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const trimmed = messages.slice(0, limit).reverse();
    const nextCursor = trimmed[0]?.createdAt?.toISOString() ?? null;

    return {
      threadId: thread.id,
      reflectionId,
      messages: trimmed.map((message) => this.mapMessage(reflectionId, message)),
      hasMore,
      nextCursor: hasMore ? nextCursor : null,
    };
  }

  async createMessage(reflectionId: string, userId: string, body: string) {
    const reflection = await this.prisma.reflection.findUnique({
      where: { id: reflectionId },
      select: { id: true },
    });

    if (!reflection) {
      throw new NotFoundException('Reflection not found');
    }

    const thread = await this.ensureThread(reflectionId);

    const message = await this.prisma.threadMessage.create({
      data: {
        threadId: thread.id,
        userId,
        body,
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    const payload = this.mapMessage(reflectionId, message);
    this.gateway.emitMessage(payload);

    return payload;
  }

  private async ensureThread(reflectionId: string) {
    const existing = await this.prisma.reflectionThread.findUnique({
      where: { reflectionId },
    });

    if (existing) return existing;

    return this.prisma.reflectionThread.create({
      data: { reflectionId },
    });
  }

  private mapMessage(reflectionId: string, message: {
    id: string;
    body: string;
    createdAt: Date;
    user: { id: string; username: string | null; avatarUrl: string | null };
  }): ThreadMessageDto {
    return {
      id: message.id,
      reflectionId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      author: {
        id: message.user.id,
        username: message.user.username || 'Anonymous',
        avatarUrl: message.user.avatarUrl || null,
      },
    };
  }
}
