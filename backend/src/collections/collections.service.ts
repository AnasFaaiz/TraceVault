import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function formatRelativeTime(date: string | Date | null) {
  if (!date) return 'never';
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const intervals = { y: 31536000, mo: 2592000, d: 86400, h: 3600, m: 60 };
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) return `${interval}${unit} ago`;
  }
  return 'just now';
}

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async getCollections(userId: string) {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      include: {
        entries: {
          include: {
            entry: {
              select: { title: true },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      collections: collections.map((col) => ({
        id: col.id,
        name: col.name,
        description: col.description,
        visibility: col.visibility,
        entryCount: col.entries.length,
        updatedAt: col.updatedAt,
        relativeDate: formatRelativeTime(col.updatedAt),
        previewTitles: col.entries.slice(0, 3).map((e) => e.entry.title),
      })),
      totalCollections: collections.length,
    };
  }

  async createCollection(
    userId: string,
    data: { name: string; description?: string; visibility?: string },
  ) {
    return this.prisma.collection.create({
      data: {
        ...data,
        visibility: data.visibility || 'private',
        userId,
      },
    });
  }

  async getCollectionDetail(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            entry: {
              include: {
                project: { select: { name: true } },
                reactions: true,
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.userId !== userId && collection.visibility !== 'public') {
      throw new ForbiddenException('You do not have access to this collection');
    }

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      visibility: collection.visibility as 'private' | 'public',
      entryCount: collection.entries.length,
      updatedAt: collection.updatedAt,
      entries: collection.entries.map((ce) => ({
        id: ce.entry.id,
        title: ce.entry.title,
        template_type: ce.entry.template_type,
        impact: ce.entry.impact,
        projectName: ce.entry.project.name,
        topReactionEmoji: ce.entry.reactions[0]?.type || null,
        createdAt: ce.entry.createdAt,
        relativeDate: formatRelativeTime(ce.entry.createdAt),
        addedAt: ce.addedAt,
      })),
    };
  }

  async updateCollection(
    userId: string,
    id: string,
    data: { name?: string; description?: string; visibility?: string },
  ) {
    await this.assertOwner(userId, id);
    return this.prisma.collection.update({
      where: { id },
      data,
    });
  }

  async deleteCollection(userId: string, id: string) {
    await this.assertOwner(userId, id);
    return this.prisma.collection.delete({ where: { id } });
  }

  async toggleEntry(userId: string, id: string, entryId: string) {
    await this.assertOwner(userId, id);

    const existing = await this.prisma.collectionEntry.findUnique({
      where: {
        collectionId_entryId: {
          collectionId: id,
          entryId,
        },
      },
    });

    if (existing) {
      await this.prisma.collectionEntry.delete({
        where: { id: existing.id },
      });
      return { removed: true };
    } else {
      await this.prisma.collectionEntry.create({
        data: {
          collectionId: id,
          entryId,
        },
      });
      return { added: true };
    }
  }

  async getCollectionsForEntry(userId: string, entryId: string) {
    const allCollections = await this.prisma.collection.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        entries: {
          where: { entryId },
          select: { id: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      collections: allCollections.map((c) => ({
        id: c.id,
        name: c.name,
        isMember: c.entries.length > 0,
      })),
    };
  }

  private async assertOwner(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!collection) throw new NotFoundException();
    if (collection.userId !== userId) throw new ForbiddenException();
  }
}
