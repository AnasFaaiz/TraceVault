/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReflectionsService } from '../reflections/reflections.service';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private reflectionsService: ReflectionsService,
  ) {}

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
            template_type: true,
            category: true,
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

    // Heatmap and Total Stats should usually show all activity for an "honest" footprint
    const allReflections = user.reflections;

    // For specific lists/showcases, we filter
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

    // 1. Identity Header
    const allTags = visibleReflectionsForBreakdown.flatMap((r) => r.tags);
    const tagCounts = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const topStack = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
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

    // 2. Stats
    const stats = this.calculateStats(
      allReflections,
      visibleProjects.length,
      isOwnProfile,
    );

    // 3. Activity Heatmap
    const activity = this.calculateActivityData(allReflections);

    // 4. Projects Showcase
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
        .sort((a, b) => b[1] - a[1])
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
          (r) => r.impact.toLowerCase() === 'pivotal',
        ).length,
      };
    });

    // 5. Engineering Breakdown
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

    const pivotalCount = reflections.filter(
      (r) => r.impact.toLowerCase() === 'pivotal',
    ).length;
    const significantCount = reflections.filter(
      (r) => r.impact.toLowerCase() === 'significant',
    ).length;
    const minorCount = reflections.filter(
      (r) => r.impact.toLowerCase() === 'minor',
    ).length;

    // Streak calculation
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

      // Current streak if most recent entry is today or yesterday
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

      // Longest streak
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
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }
    }

    return {
      totalEntries,
      totalProjects: projectCount,
      pivotalCount,
      significantCount,
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
      const type = r.category || r.template_type || 'Unknown';
      templateCounts[type] = (templateCounts[type] || 0) + 1;

      // Extract confidence from fields if available
      if (
        r.fields &&
        (r.template_type === 'bug_autopsy' ||
          r.template_type === 'technical_challenge')
      ) {
        const confidence = r.fields.confidence;
        if (confidence) {
          totalWithConfidence++;
          if (confidence.toLowerCase().includes('fully'))
            confidenceCounts.yes_fully++;
          else if (confidence.toLowerCase().includes('mostly'))
            confidenceCounts.mostly++;
          else if (confidence.toLowerCase().includes('not'))
            confidenceCounts.not_really++;
        }
      }
    });

    // Formatting template names for display
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
      totalEntriesSummary: totalEntries, // Include total for the subtext
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
      orderBy = { reactions: { _count: 'desc' } };
    }

    const where: any = {
      userId: user.id,
    };

    // We fetch all entries but will mask private ones for visitors
    const reflections = await this.prisma.reflection.findMany({
      where,
      include: {
        _count: {
          select: { reactions: true },
        },
        reactions: {
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

      // Find top emoji if any from the 10 fetched reactions
      let topEmoji: string | null = null;
      if (!shouldMask && r.reactions && r.reactions.length > 0) {
        const counts: Record<string, number> = {};
        r.reactions.forEach((re: any) => {
          counts[re.emoji] = (counts[re.emoji] || 0) + 1;
        });
        topEmoji = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      }

      return {
        id: r.id,
        title: shouldMask ? 'Private entry' : r.title,
        template_type: shouldMask ? null : r.template_type,
        category: shouldMask ? null : r.category,
        impact: shouldMask ? null : r.impact,
        visibility: r.visibility,
        totalReactions: shouldMask ? 0 : r._count.reactions,
        topReactionEmoji: topEmoji,
        createdAt: r.createdAt.toISOString(),
        relativeDate: this.reflectionsService['getRelativeDate'](r.createdAt),
      };
    });

    return {
      entries: items,
      totalEntries: reflections.length, // This is just the page count, real total would need a count query
      hasMore,
    };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      bio?: string;
      username?: string;
      avatarUrl?: string;
      isPrivate?: boolean;
    },
  ) {
    if (data.username) {
      const userWithUsername = await this.prisma.user.findUnique({
        where: { username: data.username },
      });
      if (userWithUsername && userWithUsername.id !== userId) {
        throw new BadRequestException('Username is already taken');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }
}
