import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateReflectionDto {
  title: string;
  category: string;
  template_type: string;
  fields?: Record<string, any>;
  tags?: string[];
  content?: string;
  impact?: string;
  entryType?: 'reflection' | 'social_post';
}

export interface UpdateReflectionDto {
  title?: string;
  category?: string;
  template_type?: string;
  fields?: Record<string, any>;
  tags?: string[];
  content?: string;
  impact?: string;
  entryType?: 'reflection' | 'social_post';
}

@Injectable()
export class ReflectionsService {
  constructor(private prisma: PrismaService) {}

  private mapToFeedEntry(
    record: any,
    currentUserId?: string,
    isVaulted?: boolean | Set<string>,
  ) {
    const usefulReactions =
      record?.reactions?.filter((r: any) => r.type === 'useful') || [];
    const criticalReactions =
      record?.reactions?.filter((r: any) => r.type === 'critical') || [];
    const appliedReactions =
      record?.reactions?.filter((r: any) => r.type === 'applied') || [];

    let vaulted = false;
    if (typeof isVaulted === 'boolean') {
      vaulted = isVaulted;
    } else if (isVaulted instanceof Set) {
      vaulted = isVaulted.has(record?.id);
    }

    return {
      id: record?.id || '',
      title: record?.title || '',
      category: record?.category || '',
      template_type: record?.template_type || '',
      impact: record?.impact || 'minor',
      tags: record?.tags || [],
      content: record?.content || '',
      snippet: record?.content ? record.content.substring(0, 160) + '...' : '',
      readTime: '2 min read',
      confidence: record?.fields?.confidence || null,
      fields: record?.fields || {}, // 👈 ADD THIS: Ensures entry.fields is never undefined!
      createdAt: record?.createdAt
        ? record.createdAt.toISOString()
        : new Date().toISOString(),
      relativeDate: record?.createdAt
        ? this.formatRelativeDate(record.createdAt)
        : 'Just now',
      author: {
        id: record?.user?.id || '',
        username: record?.user?.username || 'Anonymous',
        avatarUrl: record?.user?.avatarUrl || null,
      },
      project: {
        id: record?.project?.id || '',
        name: record?.project?.name || 'Unassigned',
      },
      type:
        record?.category === 'social_post' ||
        record?.template_type === 'social_post'
          ? 'social_post'
          : 'reflection',
      reactions: {
        useful: {
          count: usefulReactions.length,
          reacted: usefulReactions.some((r: any) => r.userId === currentUserId),
        },
        critical: {
          count: criticalReactions.length,
          reacted: criticalReactions.some(
            (r: any) => r.userId === currentUserId,
          ),
        },
        applied: {
          count: appliedReactions.length,
          reacted: appliedReactions.some(
            (r: any) => r.userId === currentUserId,
          ),
        },
      },
      vaulted,
    };
  }

  private formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  async createReflection(
    userId: string,
    projectId: string,
    data: CreateReflectionDto,
  ) {
    return this.prisma.reflection.create({
      data: {
        userId,
        projectId,
        title: data.title,
        category: data.category,
        template_type: data.template_type,
        fields: data.fields || {},
        tags: data.tags || [],
        content: data.content || '',
        impact: data.impact || 'minor',
      },
      include: {
        user: true,
        project: true,
      },
    });
  }

  async getRecentReflections(userId: string, limit: number) {
    const [records, vaults] = await Promise.all([
      this.prisma.reflection.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, project: true, reactions: true },
      }),
      this.prisma.vaultEntry.findMany({
        where: { userId },
        select: { entryId: true },
      }),
    ]);
    const vaultedSet = new Set(vaults.map((v) => v.entryId));
    return records.map((r) => this.mapToFeedEntry(r, userId, vaultedSet));
  }

  async getGlobalFeed(limit: number) {
    const records = await this.prisma.reflection.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: true, project: true, reactions: true },
    });
    return records.map((r) => this.mapToFeedEntry(r));
  }

  async getProjectReflections(userId: string, projectId: string) {
    const [records, vaults] = await Promise.all([
      this.prisma.reflection.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: { user: true, project: true, reactions: true },
      }),
      this.prisma.vaultEntry.findMany({
        where: { userId },
        select: { entryId: true },
      }),
    ]);
    const vaultedSet = new Set(vaults.map((v) => v.entryId));
    return records.map((r) => this.mapToFeedEntry(r, userId, vaultedSet));
  }

  async getFilteredReflections(filters: {
    userId?: string;
    projectId?: string;
    search?: string;
    category?: string;
    impact?: string;
  }) {
    const whereClause: any = {};
    if (filters.userId) whereClause.userId = filters.userId;
    if (filters.projectId) whereClause.projectId = filters.projectId;
    if (filters.category) whereClause.category = filters.category;
    if (filters.impact) whereClause.impact = filters.impact;
    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [records, vaults] = await Promise.all([
      this.prisma.reflection.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: { user: true, project: true, reactions: true },
      }),
      filters.userId
        ? this.prisma.vaultEntry.findMany({
            where: { userId: filters.userId },
            select: { entryId: true },
          })
        : Promise.resolve([]),
    ]);
    const vaultedSet = new Set(vaults.map((v) => v.entryId));
    return records.map((r) =>
      this.mapToFeedEntry(r, filters.userId, vaultedSet),
    );
  }

  async getTrending(
    userId: string | undefined,
    period: '24h' | '7d' | '30d',
    limit: number,
  ) {
    const timeLimit = new Date();
    if (period === '24h') timeLimit.setDate(timeLimit.getDate() - 1);
    if (period === '7d') timeLimit.setDate(timeLimit.getDate() - 7);
    if (period === '30d') timeLimit.setDate(timeLimit.getDate() - 30);

    const [records, vaults] = await Promise.all([
      this.prisma.reflection.findMany({
        where: { createdAt: { gte: timeLimit }, visibility: 'public' },
        take: limit,
        include: { user: true, project: true, reactions: true },
      }),
      userId
        ? this.prisma.vaultEntry.findMany({
            where: { userId },
            select: { entryId: true },
          })
        : Promise.resolve([]),
    ]);

    const vaultedSet = new Set(vaults.map((v) => v.entryId));
    return records
      .map((r) => this.mapToFeedEntry(r, userId, vaultedSet))
      .sort(
        (a, b) =>
          b.reactions.useful.count +
          b.reactions.applied.count -
          (a.reactions.useful.count + a.reactions.applied.count),
      );
  }

  async getTopTags(limit: number) {
    const records = await this.prisma.reflection.findMany({
      select: { tags: true },
      where: { visibility: 'public' },
    });

    const counts = new Map<string, number>();
    records.forEach((record) => {
      record.tags?.forEach((tag) => {
        const normalized = tag.trim();
        if (!normalized) return;
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  async getTopContributors(
    period: '24h' | '7d' | '30d' | 'all',
    limit: number,
  ) {
    let timeLimit: Date | null = null;
    if (period !== 'all') {
      timeLimit = new Date();
      if (period === '24h') timeLimit.setDate(timeLimit.getDate() - 1);
      if (period === '7d') timeLimit.setDate(timeLimit.getDate() - 7);
      if (period === '30d') timeLimit.setDate(timeLimit.getDate() - 30);
    }

    const whereClause: any = { visibility: 'public' };
    if (timeLimit) {
      whereClause.createdAt = { gte: timeLimit };
    }

    const grouped = await this.prisma.reflection.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: grouped.map((row) => row.userId) },
        isPrivate: false,
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    return grouped
      .filter((row) => userMap.has(row.userId))
      .map((row) => {
        const user = userMap.get(row.userId);
        return {
          id: row.userId,
          username: user?.username || user?.name || 'Anonymous',
          avatarUrl: user?.avatarUrl || null,
          reflections: row._count?.id ?? 0,
        };
      });
  }

  async getReflectionById(userId: string | undefined, id: string) {
    const [record, vault] = await Promise.all([
      this.prisma.reflection.findUnique({
        where: { id },
        include: { user: true, project: true, reactions: true },
      }),
      userId
        ? this.prisma.vaultEntry.findFirst({
            where: { entryId: id, userId },
          })
        : Promise.resolve(null),
    ]);

    if (!record) throw new NotFoundException('Reflection not found');
    return this.mapToFeedEntry(record, userId, !!vault);
  }

  async getRelatedReflections(
    userId: string | undefined,
    id: string,
    limit: number,
  ) {
    const target = await this.prisma.reflection.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Reflection not found');

    const [records, vaults] = await Promise.all([
      this.prisma.reflection.findMany({
        where: { projectId: target.projectId, NOT: { id } },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, project: true, reactions: true },
      }),
      userId
        ? this.prisma.vaultEntry.findMany({
            where: { userId },
            select: { entryId: true },
          })
        : Promise.resolve([]),
    ]);

    const vaultedSet = new Set(vaults.map((v) => v.entryId));
    return records.map((r) => this.mapToFeedEntry(r, userId, vaultedSet));
  }

  async updateReflection(
    userId: string,
    id: string,
    data: UpdateReflectionDto,
  ) {
    const record = await this.prisma.reflection.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Reflection not found');
    if (record.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.reflection.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        template_type: data.template_type,
        fields: data.fields,
        tags: data.tags,
        content: data.content,
        impact: data.impact,
      },
    });
  }

  async deleteReflection(userId: string, id: string) {
    const record = await this.prisma.reflection.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Reflection not found');
    if (record.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.reflection.delete({ where: { id } });
    return { success: true };
  }

  async getFeed(
    userId: string,
    view: string,
    filters: any,
    pagination: { page: number; limit: number },
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const whereClause: any = {};

    if (filters.tags?.length) whereClause.tags = { hasSome: filters.tags };
    if (filters.templateTypes?.length)
      whereClause.template_type = { in: filters.templateTypes };
    if (filters.impact) whereClause.impact = filters.impact;

    if (view === 'from_your_stack') {
      whereClause.project = { users: { some: { id: userId } } };
    }

    const [records, total, vaults] = await Promise.all([
      this.prisma.reflection.findMany({
        where: whereClause,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, project: true, reactions: true },
      }),
      this.prisma.reflection.count({ where: whereClause }),
      this.prisma.vaultEntry.findMany({
        where: { userId },
        select: { entryId: true },
      }),
    ]);

    const vaultedSet = new Set(vaults.map((v) => v.entryId));
    return {
      entries: records.map((r) => this.mapToFeedEntry(r, userId, vaultedSet)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        hasMore: skip + records.length < total,
      },
    };
  }

  async getAllTags(): Promise<string[]> {
    const records = await this.prisma.reflection.findMany({
      select: { tags: true },
    });
    const tagsSet = new Set<string>();
    records.forEach((r) => r.tags?.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }

  async getReactionCounts(entryId: string, userId?: string) {
    const reactions = await this.prisma.reaction.findMany({
      where: { entryId },
    });
    return {
      useful: {
        count: reactions.filter((r) => r.type === 'useful').length,
        reacted: reactions.some(
          (r) => r.type === 'useful' && r.userId === userId,
        ),
      },
      critical: {
        count: reactions.filter((r) => r.type === 'critical').length,
        reacted: reactions.some(
          (r) => r.type === 'critical' && r.userId === userId,
        ),
      },
      applied: {
        count: reactions.filter((r) => r.type === 'applied').length,
        reacted: reactions.some(
          (r) => r.type === 'applied' && r.userId === userId,
        ),
      },
    };
  }

  async toggleReaction(
    entryId: string,
    userId: string,
    type: 'useful' | 'critical' | 'applied',
  ) {
    const existing = await this.prisma.reaction.findFirst({
      where: { entryId, userId, type },
    });
    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { reacted: false };
    } else {
      await this.prisma.reaction.create({ data: { entryId, userId, type } });
      return { reacted: true };
    }
  }

  async toggleVault(entryId: string, userId: string) {
    const existing = await this.prisma.vaultEntry.findFirst({
      where: { entryId, userId },
    });
    if (existing) {
      await this.prisma.vaultEntry.delete({ where: { id: existing.id } });
      return { vaulted: false };
    } else {
      await this.prisma.vaultEntry.create({ data: { entryId, userId } });
      return { vaulted: true };
    }
  }

  async getVaultStatus(userId: string, entryId: string): Promise<boolean> {
    const vault = await this.prisma.vaultEntry.findFirst({
      where: { entryId, userId },
    });
    return !!vault;
  }

  async getVaultedEntries(
    userId: string,
    pagination: { page: number; limit: number },
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const [vaults, total] = await Promise.all([
      this.prisma.vaultEntry.findMany({
        where: { userId },
        skip,
        take: pagination.limit,
        include: {
          entry: { include: { user: true, project: true, reactions: true } },
        },
      }),
      this.prisma.vaultEntry.count({ where: { userId } }),
    ]);

    return {
      entries: vaults.map((v) =>
        this.mapToFeedEntry((v as any).entry, userId, true),
      ),
      pagination: { page: pagination.page, limit: pagination.limit, total },
    };
  }
}
