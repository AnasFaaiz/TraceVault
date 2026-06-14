/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReflectionsService } from '../reflections/reflections.service';

type HistoryFilters = {
  userId: string;
  projectId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
};

type HistoryPagination = HistoryFilters & {
  page: number;
  limit: number;
};

// ⚡️ DEFINED: Clear static shape for incoming controller data transfers
export type UpdateProfileInput = {
  name?: string;
  bio?: string;
  username?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
};

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private reflectionsService: ReflectionsService,
  ) {}

  private buildHistoryWhere(filters: HistoryFilters) {
    const where: any = { userId: filters.userId };

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};

      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return where;
  }

  private mapHistoryEntry(reflection: any) {
    return {
      id: reflection.id,
      title: reflection.title,
      template_type: reflection.category, // ⚡️ ALIGNED: Fallback to schema's category field
      category: reflection.category,
      impact: reflection.impact,
      tags: reflection.tags,
      project: reflection.project,
      totalReactions: reflection._count?.votes ?? 0, // ⚡️ FIXED: reactions -> votes
      createdAt: reflection.createdAt.toISOString(),
      relativeDate: this.reflectionsService['formatRelativeDate']
        ? this.reflectionsService['formatRelativeDate'](reflection.createdAt)
        : 'Just now',
    };
  }

  private formatHistoryMarkdown(
    entries: Array<ReturnType<ProfileService['mapHistoryEntry']>>,
  ) {
    const groups = new Map<string, typeof entries>();

    entries.forEach((entry) => {
      const label = new Date(entry.createdAt)
        .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        .toUpperCase();

      const current = groups.get(label) || [];
      current.push(entry);
      groups.set(label, current);
    });

    return Array.from(groups.entries())
      .map(([label, groupEntries]) => {
        const rows = groupEntries
          .map(
            (entry) =>
              `- ${String(entry.category || 'unknown')
                .replace(/_/g, ' ')
                .toUpperCase()} · ${entry.title} · ${entry.impact || 'MINOR'} · ${entry.totalReactions} votes · ${new Date(entry.createdAt).toLocaleDateString()}`,
          )
          .join('\n');

        return `## ${label}\n${rows}`;
      })
      .join('\n\n');
  }

  async getProfileData(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        projects: {
          include: {
            _count: {
              select: { reflections: true },
            },
            reflections: {
              select: {
                impact: true,
                tags: true,
                createdAt: true,
                visibility: true,
              },
            },
          },
        },
        reflections: {
          select: {
            id: true,
            impact: true,
            tags: true,
            createdAt: true,
            category: true, // ⚡️ ALIGNED: template_type removed as it doesn't exist in schema
            fields: true,
            visibility: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOwnProfile = viewerId === user.id;
    const allReflections = user.reflections;

    const visibleReflectionsForBreakdown = isOwnProfile
      ? user.reflections
      : user.reflections.filter((r) => r.visibility === 'public');

    const visibleProjects = user.projects
      .map((p) => ({
        ...p,
        reflections: isOwnProfile
          ? p.reflections
          : p.reflections.filter((r) => r.visibility === 'public'),
      }))
      .filter((p) => p.reflections.length > 0 || isOwnProfile);

    const allTags = visibleReflectionsForBreakdown.flatMap((r) => r.tags);
    const tagCounts = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const topStack = Object.entries(tagCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);

    const identity = {
      displayName: user.name,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      joinedAt: user.createdAt.toISOString(),
      stack: topStack,
    };

    const stats = this.calculateStats(
      allReflections,
      visibleProjects.length,
      isOwnProfile,
    );

    const activity = this.calculateActivityData(allReflections);

    const projects = visibleProjects.map((p) => {
      const pTags = p.reflections.flatMap((r) => r.tags);
      const pTagCounts = pTags.reduce(
        (acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const topTags = Object.entries(pTagCounts)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);

      return {
        id: p.id,
        name: p.name,
        entryCount: p.reflections.length,
        topTags,
        lastActivityAt:
          p.reflections[0]?.createdAt.toISOString() ||
          p.createdAt.toISOString(),
        pivotalCount: p.reflections.filter(
          (r) => r.impact === 'CRITICAL' || r.impact === 'BREAKING', // ⚡️ FIXED ENUMS
        ).length,
      };
    });

    const breakdown = this.calculateEngineeringBreakdown(
      visibleReflectionsForBreakdown,
      allReflections.length,
    );

    return {
      identity,
      stats,
      activity,
      projects,
      breakdown,
      isOwnProfile,
    };
  }

  private calculateStats(
    reflections: any[],
    projectCount: number,
    isOwnProfile: boolean,
  ) {
    const totalEntries = reflections.length;
    const publicReflections = reflections.filter(
      (r) => r.visibility === 'public',
    );
    const privateCount = totalEntries - publicReflections.length;

    // ⚡️ ALIGNED ENUMS: Schema expects MINOR, MODERATE, CRITICAL, BREAKING
    const breakingCount = reflections.filter(
      (r) => r.impact === 'BREAKING',
    ).length;
    const criticalCount = reflections.filter(
      (r) => r.impact === 'CRITICAL',
    ).length;
    const moderateCount = reflections.filter(
      (r) => r.impact === 'MODERATE',
    ).length;
    const minorCount = reflections.filter((r) => r.impact === 'MINOR').length;

    const dates = reflections.map((r) => new Date(r.createdAt).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map((d) => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (uniqueDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkDate = new Date(uniqueDates[0]);
      checkDate.setHours(0, 0, 0, 0);

      const diffMs = today.getTime() - checkDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        currentStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prev = new Date(uniqueDates[i - 1]);
          const curr = new Date(uniqueDates[i]);
          const d = Math.floor(
            (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (d === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      if (uniqueDates.length > 0) {
        tempStreak = 1;
        longestStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prev = new Date(uniqueDates[i - 1]);
          const curr = new Date(uniqueDates[i]);
          const d = Math.floor(
            (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (d === 1) {
            tempStreak++;
          } else {
            break; // Fix: Stop block iteration if gap detected for crisp calculations
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }
    }

    return {
      totalEntries,
      totalProjects: projectCount,
      pivotalCount: breakingCount + criticalCount, // Aggregate for metrics display
      significantCount: moderateCount,
      minorCount,
      currentStreak,
      longestStreak,
      privateCount: !isOwnProfile ? privateCount : 0,
    };
  }

  private calculateActivityData(reflections: any[]) {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const activityMap: Record<string, number> = {};
    let totalLastYear = 0;

    reflections.forEach((r) => {
      const date = new Date(r.createdAt);
      if (date >= oneYearAgo) {
        const dateStr = date.toISOString().split('T')[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
        totalLastYear++;
      }
    });

    const activityData: { date: string; count: number }[] = [];
    const curr = new Date(oneYearAgo);
    while (curr <= now) {
      const dateStr = curr.toISOString().split('T')[0];
      activityData.push({
        date: dateStr,
        count: activityMap[dateStr] || 0,
      });
      curr.setDate(curr.getDate() + 1);
    }

    return {
      activityData,
      totalLastYear,
    };
  }

  private calculateEngineeringBreakdown(
    reflections: any[],
    totalEntries: number,
  ) {
    const templateCounts: Record<string, number> = {};
    const confidenceCounts = {
      yes_fully: 0,
      mostly: 0,
      not_really: 0,
    };
    let totalWithConfidence = 0;

    reflections.forEach((r) => {
      const type = r.category || 'Unknown';
      templateCounts[type] = (templateCounts[type] || 0) + 1;

      if (
        r.fields &&
        (r.category === 'bug_autopsy' || r.category === 'technical_challenge')
      ) {
        const confidence = r.fields.confidence;
        if (confidence) {
          totalWithConfidence++;
          if (String(confidence).toLowerCase().includes('fully'))
            confidenceCounts.yes_fully++;
          else if (String(confidence).toLowerCase().includes('mostly'))
            confidenceCounts.mostly++;
          else if (String(confidence).toLowerCase().includes('not'))
            confidenceCounts.not_really++;
        }
      }
    });

    const templateBreakdown: Record<string, number> = {};
    Object.entries(templateCounts).forEach(([key, val]) => {
      const formattedKey = key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      templateBreakdown[formattedKey] = val;
    });

    const confidenceBreakdown = {
      yes_fully: totalWithConfidence
        ? Math.round((confidenceCounts.yes_fully / totalWithConfidence) * 100)
        : 0,
      mostly: totalWithConfidence
        ? Math.round((confidenceCounts.mostly / totalWithConfidence) * 100)
        : 0,
      not_really: totalWithConfidence
        ? Math.round((confidenceCounts.not_really / totalWithConfidence) * 100)
        : 0,
    };

    return {
      templateBreakdown,
      confidenceBreakdown,
      totalWithConfidence,
      totalEntriesSummary: totalEntries,
    };
  }

  async getProfileEntries(
    username: string,
    viewerId: string | undefined,
    options: { sort: string; page: number; limit: number },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOwnProfile = viewerId === user.id;
    const skip = (options.page - 1) * options.limit;

    let orderBy: any = { createdAt: 'desc' };
    if (options.sort === 'most_reacted') {
      orderBy = { votes: { _count: 'desc' } }; // ⚡️ FIXED: reactions -> votes
    }

    const where: any = { userId: user.id };

    const reflections = await this.prisma.reflection.findMany({
      where,
      include: {
        _count: {
          select: { votes: true }, // ⚡️ FIXED: reactions -> votes
        },
        votes: {
          // ⚡️ FIXED: reactions -> votes
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy,
      skip,
      take: options.limit + 1,
    });

    const hasMore = reflections.length > options.limit;
    const items = reflections.slice(0, options.limit).map((r: any) => {
      const isPrivate = r.visibility === 'private';
      const shouldMask = isPrivate && !isOwnProfile;

      return {
        id: r.id,
        title: shouldMask ? 'Private entry' : r.title,
        template_type: shouldMask ? null : r.category,
        category: shouldMask ? null : r.category,
        impact: shouldMask ? null : r.impact,
        visibility: r.visibility,
        totalReactions: shouldMask ? 0 : r._count.votes, // ⚡️ FIXED: reactions -> votes
        topReactionEmoji: null, // Removed emoji tracking since Vote model only stores numerical values now
        createdAt: r.createdAt.toISOString(),
        relativeDate: this.reflectionsService['formatRelativeDate']
          ? this.reflectionsService['formatRelativeDate'](r.createdAt)
          : 'Just now',
      };
    });

    return {
      entries: items,
      totalEntries: reflections.length,
      hasMore,
    };
  }

  async getHistoryEntries(options: HistoryPagination) {
    const skip = (options.page - 1) * options.limit;
    const where = this.buildHistoryWhere(options);

    const totalEntries = await this.prisma.reflection.count({ where });

    const reflections = await this.prisma.reflection.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        _count: {
          select: { votes: true }, // ⚡️ FIXED: reactions -> votes
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: options.limit + 1,
    });

    const hasMore = reflections.length > options.limit;
    const items = reflections
      .slice(0, options.limit)
      .map((reflection: any) => this.mapHistoryEntry(reflection));

    return {
      entries: items,
      totalEntries,
      hasMore: skip + options.limit < totalEntries && hasMore,
    };
  }

  async getAllHistoryEntries(filters: HistoryFilters) {
    const reflections = await this.prisma.reflection.findMany({
      where: this.buildHistoryWhere(filters),
      include: {
        project: {
          select: { id: true, name: true },
        },
        _count: {
          select: { votes: true }, // ⚡️ FIXED: reactions -> votes
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const entries = reflections.map((reflection: any) =>
      this.mapHistoryEntry(reflection),
    );

    return {
      entries,
      markdown: this.formatHistoryMarkdown(entries),
      totalEntries: entries.length,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    if (data.username) {
      const userWithUsername = await this.prisma.user.findUnique({
        where: { username: data.username },
      });
      if (userWithUsername && userWithUsername.id !== userId) {
        throw new BadRequestException('Username is already taken');
      }
    }

    // ⚡️ ALIGNED: Pull out isPrivate and correctly match schema's 'visibility' enum column mapping
    const { isPrivate, ...rest } = data;
    const updateData: any = { ...rest };
    if (isPrivate !== undefined) {
      updateData.visibility = isPrivate ? 'private' : 'public';
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }
}
