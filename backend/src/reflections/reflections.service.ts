import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { validateFields } from './template-definitions';
import type { TemplateType } from './template-definitions';

type TrendingPeriod = '24h' | '7d' | '30d';

export interface TrendingTraceCard {
  id: string;
  title: string;
  category: 'Technical Challenge' | 'Design Decision' | 'Lesson Learned';
  severity: 'Minor' | 'Significant' | 'Pivotal';
  tags: string[];
  insightStrength: number;
  learningMomentum: number;
  contributors: {
    avatars: string[];
    count: number;
  };
  activityCount: number;
  trendStartedAt: string;
}

@Injectable()
export class ReflectionsService {
  constructor(private prisma: PrismaService) {}

  private getFieldsObject(
    fields: Prisma.JsonValue | null | undefined,
  ): Record<string, unknown> {
    if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
      return fields as Record<string, unknown>;
    }

    return {};
  }

  private getFieldString(
    fields: Prisma.JsonValue | null | undefined,
    fieldName: string,
  ): string | undefined {
    const value = this.getFieldsObject(fields)[fieldName];
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private getConfidenceFromReflection(reflection: {
    template_type?: string | null;
    fields?: Prisma.JsonValue | null;
  }): string | null {
    if (
      reflection.template_type !== 'bug_autopsy' &&
      reflection.template_type !== 'technical_challenge'
    ) {
      return null;
    }

    return this.getFieldString(reflection.fields, 'confidence') ?? null;
  }

  private getTrendingWindow(period: TrendingPeriod) {
    const now = Date.now();
    const durationMs =
      period === '24h'
        ? 24 * 60 * 60 * 1000
        : period === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

    return {
      currentStart: new Date(now - durationMs),
      previousStart: new Date(now - 2 * durationMs),
      durationMs,
    };
  }

  private mapCategory(category?: string | null): TrendingTraceCard['category'] {
    const raw = String(category || '').toLowerCase();

    if (raw === 'design_decision' || raw === 'design decision') {
      return 'Design Decision';
    }

    if (raw === 'lesson_learned' || raw === 'lesson learned') {
      return 'Lesson Learned';
    }

    return 'Technical Challenge';
  }

  private mapSeverity(impact?: string | null): TrendingTraceCard['severity'] {
    const raw = String(impact || '').toLowerCase();
    if (raw === 'pivotal') return 'Pivotal';
    if (raw === 'minor') return 'Minor';
    return 'Significant';
  }

  private computeWeightedActivity(
    reactions: Array<{ type: string }>,
    vaultCount: number,
  ) {
    let useful = 0;
    let critical = 0;
    let applied = 0;

    reactions.forEach((reaction) => {
      if (reaction.type === 'useful') useful += 1;
      if (reaction.type === 'critical') critical += 1;
      if (reaction.type === 'applied') applied += 1;
    });

    const weighted =
      useful * 2.2 + critical * 2.6 + applied * 1.8 + vaultCount * 2.8;

    return {
      weighted,
      useful,
      critical,
      applied,
      vaultCount,
    };
  }

  private computeInsightStrength(
    reactions: Array<{ type: string }>,
    vaultCount: number,
  ): number {
    const weighted = this.computeWeightedActivity(
      reactions,
      vaultCount,
    ).weighted;
    return Math.max(0, Math.min(100, Math.round(weighted * 8)));
  }

  private computeLearningMomentum(
    currentWeighted: number,
    previousWeighted: number,
  ): number {
    if (currentWeighted <= 0) return 0;
    if (previousWeighted <= 0) return 100;

    const pct = ((currentWeighted - previousWeighted) / previousWeighted) * 100;
    return Math.max(-100, Math.min(400, Math.round(pct)));
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

  private async assertReflectionOwner(userId: string, reflectionId: string) {
    const reflection = await this.prisma.reflection.findUnique({
      where: { id: reflectionId },
      select: {
        id: true,
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!reflection) {
      throw new NotFoundException('Reflection not found');
    }

    if (reflection.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reflection');
    }
  }

  /**
   * Create a new reflection with structured fields
   */
  async createReflection(
    userId: string,
    projectId: string,
    data: {
      title: string;
      category: string;
      template_type: string;
      impact?: string;
      tags?: string[];
      fields?: Record<string, unknown>;
      content?: string; // Legacy support
    },
  ) {
    await this.assertProjectOwner(userId, projectId);

    // Validate structured fields if provided
    if (data.fields && data.template_type) {
      const validation = validateFields(
        data.template_type as TemplateType,
        data.fields,
      );
      if (!validation.valid) {
        throw new Error(
          `Missing required fields: ${validation.missingFields.join(', ')}`,
        );
      }
    }

    const createData: Prisma.ReflectionUncheckedCreateInput = {
      title: data.title,
      category: data.category,
      template_type: data.template_type,
      impact: data.impact || 'minor',
      tags: data.tags || [],
      projectId,
      userId,
    };

    if (data.fields !== undefined) {
      createData.fields = data.fields as Prisma.InputJsonValue;
    }

    if (data.content !== undefined) {
      createData.content = data.content;
    }

    return this.prisma.reflection.create({
      data: createData,
    });
  }

  /**
   * Get recent reflections for a user
   */
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

  /**
   * Get global feed
   */
  async getGlobalFeed(limit: number = 20) {
    return this.prisma.reflection.findMany({
      include: {
        project: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get reflections for a specific project
   */
  async getProjectReflections(userId: string, projectId: string) {
    await this.assertProjectOwner(userId, projectId);

    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        reflections: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { reflections: true },
        },
      },
    });
  }

  /**
   * Get single reflection by ID
   */
  async getReflectionById(userId: string, id: string) {
    const reflection = await this.prisma.reflection.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!reflection) {
      throw new NotFoundException('Reflection not found');
    }

    // Check authorization
    if (reflection.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reflection');
    }

    return reflection;
  }

  /**
   * Get filtered reflections with search, type, impact filters
   */
  async getFilteredReflections(filters: {
    userId?: string;
    projectId?: string;
    search?: string;
    category?: string;
    impact?: string;
    limit?: number;
  }) {
    const { userId, projectId, search, category, impact, limit = 50 } = filters;

    const where: Prisma.ReflectionWhereInput = {};
    const and: Prisma.ReflectionWhereInput[] = [];

    if (userId) and.push({ project: { userId } });
    if (projectId) and.push({ projectId });
    if (category) and.push({ category });
    if (impact) and.push({ impact });
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (and.length > 0) where.AND = and;

    return this.prisma.reflection.findMany({
      where,
      include: {
        project: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Update an existing reflection
   */
  async updateReflection(
    userId: string,
    id: string,
    data: {
      title?: string;
      category?: string;
      template_type?: string;
      impact?: string;
      tags?: string[];
      fields?: Record<string, unknown>;
      content?: string; // Legacy support
    },
  ) {
    await this.assertReflectionOwner(userId, id);

    // Validate structured fields if provided
    if (data.fields && data.template_type) {
      const validation = validateFields(
        data.template_type as TemplateType,
        data.fields,
      );
      if (!validation.valid) {
        throw new Error(
          `Missing required fields: ${validation.missingFields.join(', ')}`,
        );
      }
    }

    const updateData: Prisma.ReflectionUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.template_type !== undefined) {
      updateData.template_type = data.template_type;
    }
    if (data.impact !== undefined) updateData.impact = data.impact;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.fields !== undefined) {
      updateData.fields = data.fields as Prisma.InputJsonValue;
    }
    if (data.content !== undefined) updateData.content = data.content;

    return this.prisma.reflection.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a reflection
   */
  async deleteReflection(userId: string, id: string) {
    await this.assertReflectionOwner(userId, id);

    return this.prisma.reflection.delete({
      where: { id },
    });
  }

  /**
   * Get user's tag history (all unique tags from their reflections)
   */
  async getUserTagHistory(userId: string): Promise<string[]> {
    const reflections = await this.prisma.reflection.findMany({
      where: {
        project: {
          userId,
        },
      },
      select: {
        tags: true,
      },
    });

    const uniqueTags = new Set<string>();
    reflections.forEach((r) => {
      r.tags?.forEach((tag) => uniqueTags.add(tag));
    });

    return Array.from(uniqueTags);
  }

  /**
   * Get reaction counts and user's reaction status for an entry
   */
  async getReactionCounts(entryId: string, userId?: string) {
    const types = ['useful', 'critical', 'applied'];
    const result: Record<string, { count: number; reacted: boolean }> = {};

    for (const type of types) {
      const count = await this.prisma.reaction.count({
        where: { entryId, type },
      });

      let reacted = false;
      if (userId) {
        const userReaction = await this.prisma.reaction.findUnique({
          where: {
            entryId_userId_type: {
              entryId,
              userId,
              type,
            },
          },
        });
        reacted = !!userReaction;
      }

      result[type] = { count, reacted };
    }

    return result;
  }

  /**
   * Check if entry is vaulted by user
   */
  async getVaultStatus(userId: string, entryId: string): Promise<boolean> {
    const vaultEntry = await this.prisma.vaultEntry.findUnique({
      where: {
        userId_entryId: {
          userId,
          entryId,
        },
      },
    });

    return !!vaultEntry;
  }

  /**
   * Extract snippet from reflection based on template type
   */
  private getSnippet(reflection: {
    template_type?: string | null;
    fields?: Prisma.JsonValue | null;
    content?: string | null;
  }): string {
    const MAX_SNIPPET_LENGTH = 100;

    let snippet = '';

    // Determine which field to use based on template type
    if (reflection.template_type && reflection.fields) {
      const fieldMap: Record<string, string> = {
        bug_autopsy: 'symptoms',
        technical_challenge: 'what_broke',
        design_decision: 'what_triggered',
        tradeoff: 'gained',
        lesson_learned: 'what_happened',
        integration_note: 'the_gotcha',
      };

      const fieldName = fieldMap[reflection.template_type];
      const fieldValue = fieldName
        ? this.getFieldString(reflection.fields, fieldName)
        : undefined;
      if (fieldValue) {
        snippet = fieldValue;
      }
    }

    // Fallback to content field for legacy entries
    if (!snippet && reflection.content) {
      snippet = reflection.content;
    }

    // Truncate with ellipsis if needed
    if (snippet.length > MAX_SNIPPET_LENGTH) {
      return snippet.substring(0, MAX_SNIPPET_LENGTH) + '...';
    }

    return snippet;
  }

  /**
   * Calculate read time in minutes
   */
  private calculateReadTime(reflection: {
    template_type?: string | null;
    fields?: Prisma.JsonValue | null;
    content?: string | null;
  }): string {
    let totalChars = 0;

    if (reflection.fields) {
      const fieldValues = Object.values(
        this.getFieldsObject(reflection.fields),
      );
      fieldValues.forEach((value) => {
        if (typeof value === 'string') {
          totalChars += value.length;
        } else if (Array.isArray(value)) {
          totalChars += value
            .filter((item): item is string => typeof item === 'string')
            .join(' ').length;
        }
      });
    }

    if (reflection.content) {
      totalChars += reflection.content.length;
    }

    // Assume 160 words/min, ~5 chars/word = 800 chars/min
    const minutes = Math.max(1, Math.ceil(totalChars / 800));
    return `${minutes} min read`;
  }

  /**
   * Format relative date (e.g., "2 days ago")
   */
  private getRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Build feed response with all required fields
   */
  private async buildFeedResponse(
    reflections: Array<{
      id: string;
      title: string;
      category: string;
      template_type?: string | null;
      impact: string;
      tags: string[];
      fields?: Prisma.JsonValue | null;
      content?: string | null;
      createdAt: Date;
      userId: string;
      projectId: string;
      project: {
        id: string;
        name: string;
        user: {
          id: string;
          name: string;
        };
      };
    }>,
    userId?: string,
  ) {
    return Promise.all(
      reflections.map(async (r) => {
        const reactions = await this.getReactionCounts(r.id, userId);
        const vaulted = userId
          ? await this.getVaultStatus(userId, r.id)
          : false;

        return {
          id: r.id,
          title: r.title,
          category: r.category,
          template_type: r.template_type,
          impact: r.impact,
          tags: r.tags,
          snippet: this.getSnippet(r),
          readTime: this.calculateReadTime(r),
          confidence: this.getConfidenceFromReflection(r),
          createdAt: r.createdAt,
          relativeDate: this.getRelativeDate(r.createdAt),
          author: {
            id: r.userId,
            username: r.project.user.name,
            avatarUrl: null, // To be added later if avatar support is added
          },
          project: {
            id: r.projectId,
            name: r.project.name,
          },
          reactions,
          vaulted,
        };
      }),
    );
  }

  /**
   * Get feed with view logic (For You, From Your Stack, or Trending)
   */
  async getFeed(
    userId: string,
    view: 'for_you' | 'from_your_stack' | 'trending' = 'for_you',
    filters?: {
      tags?: string[];
      templateTypes?: string[];
      impact?: string;
      confidence?: string;
    },
    pagination?: {
      page?: number;
      limit?: number;
    },
  ) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const baseWhere: Prisma.ReflectionWhereInput = {};

    // Apply filters
    if (filters?.tags && filters.tags.length > 0) {
      baseWhere.tags = { hasSome: filters.tags };
    }
    if (filters?.templateTypes && filters.templateTypes.length > 0) {
      baseWhere.template_type = { in: filters.templateTypes };
    }
    if (filters?.impact) {
      baseWhere.impact = filters.impact;
    }

    const where: Prisma.ReflectionWhereInput = { ...baseWhere };
    const orderBy: Prisma.ReflectionOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    const hasExplicitTagFilter = !!(filters?.tags && filters.tags.length > 0);

    if (view === 'trending') {
      // Trending: most reactions in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: thirtyDaysAgo };
      // Note: Deep ordering by relation count requires raw query
      // For now, we'll fetch and sort in-memory
    } else {
      // For You and From Your Stack: personalized by user's tags
      const userTags = await this.getUserTagHistory(userId);

      if (userTags.length === 0) {
        // No tags in user's history: return trending
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: thirtyDaysAgo };
      } else if (view === 'for_you') {
        // For You: at least one matching tag, plus always include user's own entries
        // when no explicit tag filter is applied.
        if (hasExplicitTagFilter) {
          where.tags = { hasSome: userTags };
        } else {
          where.OR = [
            { tags: { hasSome: userTags } },
            { project: { userId } },
          ];
        }
      } else if (view === 'from_your_stack') {
        // From Your Stack: all entry tags exist in user's tags
        // This requires more complex logic; we'll filter in-memory
      }
    }

    // Fetch reflections with included relations
    const reflections = await this.prisma.reflection.findMany({
      where,
      include: {
        project: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        reactions: {
          select: {
            id: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Handle from_your_stack strict matching in-memory
    let filteredReflections = reflections;
    if (view === 'from_your_stack') {
      const userTags = await this.getUserTagHistory(userId);
      if (userTags.length > 0) {
        filteredReflections = reflections.filter(
          (r) =>
            r.project.user.id === userId ||
            r.tags.every((tag) => userTags.includes(tag)),
        );

        // If no strict matches, fall back to for_you logic
        if (filteredReflections.length === 0 && !hasExplicitTagFilter) {
          const forYouReflections = await this.prisma.reflection.findMany({
            where: {
              ...baseWhere,
              OR: [{ tags: { hasSome: userTags } }, { project: { userId } }],
            },
            include: {
              project: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              reactions: {
                select: {
                  id: true,
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          });
          filteredReflections = forYouReflections;
        }
      }
    }

    // Apply confidence filter if provided
    if (filters?.confidence && filters.confidence !== 'any') {
      filteredReflections = filteredReflections.filter((r) => {
        if (
          r.template_type === 'bug_autopsy' ||
          r.template_type === 'technical_challenge'
        ) {
          const confidence = this.getFieldString(r.fields, 'confidence');
          return confidence === filters.confidence;
        }
        return false;
      });
    }

    // Sort by reaction count for trending view
    if (view === 'trending') {
      filteredReflections.sort((a, b) => {
        const countB = b.reactions?.length || 0;
        const countA = a.reactions?.length || 0;
        if (countB !== countA) return countB - countA;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    // Build response
    const response = await this.buildFeedResponse(filteredReflections, userId);

    // Count total for pagination
    const total = await this.prisma.reflection.count({
      where: {
        ...where,
        ...(view === 'from_your_stack' ? {} : {}), // Simplified total count
      },
    });

    return {
      entries: response,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Get dynamic trending entries for a period window.
   */
  async getTrending(
    userId: string,
    period: TrendingPeriod = '24h',
    limit: number = 5,
  ) {
    if (!['24h', '7d', '30d'].includes(period)) {
      throw new BadRequestException('Invalid period. Use 24h, 7d, or 30d');
    }

    const safeLimit = Math.min(Math.max(limit || 5, 3), 5);
    const { currentStart, previousStart } = this.getTrendingWindow(period);

    const reflections = await this.prisma.reflection.findMany({
      where: {
        OR: [
          { reactions: { some: { createdAt: { gte: currentStart } } } },
          { vaultedBy: { some: { vaultedAt: { gte: currentStart } } } },
        ],
      },
      include: {
        reactions: {
          where: { createdAt: { gte: previousStart } },
          select: {
            createdAt: true,
            type: true,
            userId: true,
          },
        },
        vaultedBy: {
          where: { vaultedAt: { gte: previousStart } },
          select: {
            vaultedAt: true,
            userId: true,
          },
        },
      },
      take: 150,
    });

    const ranked = reflections
      .map((reflection) => {
        const currentReactions = reflection.reactions.filter(
          (r) => r.createdAt >= currentStart,
        );
        const previousReactions = reflection.reactions.filter(
          (r) => r.createdAt >= previousStart && r.createdAt < currentStart,
        );

        const currentVaults = reflection.vaultedBy.filter(
          (v) => v.vaultedAt >= currentStart,
        );
        const previousVaults = reflection.vaultedBy.filter(
          (v) => v.vaultedAt >= previousStart && v.vaultedAt < currentStart,
        );

        const activityCount = currentReactions.length + currentVaults.length;
        if (activityCount === 0) return null;

        const currentWeighted = this.computeWeightedActivity(
          currentReactions,
          currentVaults.length,
        ).weighted;
        const previousWeighted = this.computeWeightedActivity(
          previousReactions,
          previousVaults.length,
        ).weighted;

        const insightStrength = this.computeInsightStrength(
          currentReactions,
          currentVaults.length,
        );
        const learningMomentum = this.computeLearningMomentum(
          currentWeighted,
          previousWeighted,
        );

        const contributorIds = new Set<string>([
          ...currentReactions.map((reaction) => reaction.userId),
          ...currentVaults.map((vault) => vault.userId),
        ]);

        const startedAt = [
          ...currentReactions.map((reaction) => reaction.createdAt.getTime()),
          ...currentVaults.map((vault) => vault.vaultedAt.getTime()),
        ].sort((a, b) => a - b)[0];

        const rankScore =
          learningMomentum * 0.55 +
          insightStrength * 0.3 +
          Math.min(100, activityCount * 9) * 0.15;

        const trendingItem: TrendingTraceCard = {
          id: reflection.id,
          title: reflection.title,
          category: this.mapCategory(
            reflection.template_type || reflection.category,
          ),
          severity: this.mapSeverity(reflection.impact),
          tags: reflection.tags || [],
          insightStrength,
          learningMomentum,
          contributors: {
            avatars: [],
            count: contributorIds.size,
          },
          activityCount,
          trendStartedAt: new Date(
            startedAt || reflection.createdAt.getTime(),
          ).toISOString(),
        };

        return {
          rankScore,
          createdAt: reflection.createdAt.getTime(),
          item: trendingItem,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          rankScore: number;
          createdAt: number;
          item: TrendingTraceCard;
        } => entry !== null,
      )
      .sort((a, b) => {
        if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
        if (b.item.activityCount !== a.item.activityCount) {
          return b.item.activityCount - a.item.activityCount;
        }
        return b.createdAt - a.createdAt;
      })
      .slice(0, safeLimit)
      .map((entry) => entry.item);

    return {
      period,
      entries: ranked,
    };
  }

  /**
   * Toggle a reaction on an entry (create or delete)
   */
  async toggleReaction(
    entryId: string,
    userId: string,
    type: 'useful' | 'critical' | 'applied',
  ) {
    // Check if reaction already exists
    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        entryId_userId_type: {
          entryId,
          userId,
          type,
        },
      },
    });

    if (existingReaction) {
      // Toggle off: clear reactions for this entry/user to enforce single-selection model.
      await this.prisma.reaction.deleteMany({
        where: {
          entryId,
          userId,
        },
      });
    } else {
      // Toggle on: replace any prior reaction with the new one.
      await this.prisma.$transaction(async (tx) => {
        await tx.reaction.deleteMany({
          where: {
            entryId,
            userId,
          },
        });

        await tx.reaction.create({
          data: {
            entryId,
            userId,
            type,
          },
        });
      });
    }

    // Return updated counts
    const counts = await this.getReactionCounts(entryId, userId);
    return {
      type,
      count: counts[type].count,
      reacted: counts[type].reacted,
    };
  }

  /**
   * Toggle vault for an entry (add or remove from vault)
   */
  async toggleVault(entryId: string, userId: string) {
    // Check if entry is already vaulted
    const existingVault = await this.prisma.vaultEntry.findUnique({
      where: {
        userId_entryId: {
          userId,
          entryId,
        },
      },
    });

    if (existingVault) {
      // Remove from vault (toggle off)
      await this.prisma.vaultEntry.delete({
        where: {
          id: existingVault.id,
        },
      });
    } else {
      // Add to vault (toggle on)
      await this.prisma.vaultEntry.create({
        data: {
          userId,
          entryId,
        },
      });
    }

    const vaulted = await this.getVaultStatus(userId, entryId);
    return { vaulted };
  }

  /**
   * Get user's vaulted entries with pagination
   */
  async getVaultedEntries(
    userId: string,
    pagination?: { page?: number; limit?: number },
  ) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    // Get vaulted entries
    const vaultEntries = await this.prisma.vaultEntry.findMany({
      where: { userId },
      include: {
        entry: {
          include: {
            project: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { vaultedAt: 'desc' },
      skip,
      take: limit,
    });

    // Format response
    const entries = await Promise.all(
      vaultEntries.map(async (ve) => {
        const reactions = await this.getReactionCounts(ve.entry.id, userId);
        return {
          id: ve.entry.id,
          title: ve.entry.title,
          category: ve.entry.category,
          template_type: ve.entry.template_type,
          impact: ve.entry.impact,
          tags: ve.entry.tags,
          snippet: this.getSnippet(ve.entry),
          readTime: this.calculateReadTime(ve.entry),
          confidence: this.getConfidenceFromReflection(ve.entry),
          createdAt: ve.entry.createdAt,
          relativeDate: this.getRelativeDate(ve.entry.createdAt),
          author: {
            id: ve.entry.userId,
            username: ve.entry.project.user.name,
            avatarUrl: null,
          },
          project: {
            id: ve.entry.projectId,
            name: ve.entry.project.name,
          },
          reactions,
          vaulted: true,
        };
      }),
    );

    const total = await this.prisma.vaultEntry.count({
      where: { userId },
    });

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Get all unique tags from public reflections
   */
  async getAllTags(): Promise<string[]> {
    const reflections = await this.prisma.reflection.findMany({
      select: {
        tags: true,
      },
      distinct: ['tags'],
    });

    const uniqueTags = new Set<string>();
    reflections.forEach((r) => {
      r.tags?.forEach((tag) => uniqueTags.add(tag));
    });

    return Array.from(uniqueTags).sort();
  }
}
