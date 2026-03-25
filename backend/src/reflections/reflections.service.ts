import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { validateFields } from './template-definitions';
import type { TemplateType } from './template-definitions';

@Injectable()
export class ReflectionsService {
  constructor(private prisma: PrismaService) {}

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
      fields?: Record<string, any>;
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

    return this.prisma.reflection.create({
      data: {
        title: data.title,
        category: data.category,
        template_type: data.template_type,
        impact: data.impact || 'minor',
        tags: data.tags || [],
        ...(data.fields !== undefined ? { fields: data.fields } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}), // Legacy support
        projectId,
        userId,
      },
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

    const where: Record<string, any> = {};
    const and: Record<string, any>[] = [];

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
      fields?: Record<string, any>;
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

    return this.prisma.reflection.update({
      where: { id },
      data,
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
    const prisma = this.prisma as any;
    const types = ['useful', 'felt_this', 'critical', 'noted'];
    const result: Record<
      string,
      { count: number; reacted: boolean }
    > = {};

    for (const type of types) {
      const count = await prisma.reaction.count({
        where: { entryId, type },
      });

      let reacted = false;
      if (userId) {
        const userReaction = await prisma.reaction.findUnique({
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
    const prisma = this.prisma as any;
    const vaultEntry = await prisma.vaultEntry.findUnique({
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
    fields?: any;
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
      if (fieldName && reflection.fields[fieldName]) {
        snippet = String(reflection.fields[fieldName]);
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
    fields?: any;
    content?: string | null;
  }): string {
    let totalChars = 0;

    if (reflection.fields) {
      Object.values(reflection.fields).forEach((value) => {
        if (typeof value === 'string') {
          totalChars += value.length;
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
      fields?: any;
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
        const vaulted = userId ? await this.getVaultStatus(userId, r.id) : false;

        return {
          id: r.id,
          title: r.title,
          category: r.category,
          template_type: r.template_type,
          impact: r.impact,
          tags: r.tags,
          snippet: this.getSnippet(r),
          readTime: this.calculateReadTime(r),
          confidence:
            (r.template_type === 'bug_autopsy' ||
              r.template_type === 'technical_challenge') &&
            (r.fields as any)?.confidence
              ? (r.fields as any).confidence
              : null,
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
    const prisma = this.prisma as any;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const baseWhere: Record<string, any> = {};

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

    let where: Record<string, any> = baseWhere;
    let orderBy:  any = { createdAt: 'desc' };

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
        // For You: at least one matching tag
        where.tags = { hasSome: userTags };
      } else if (view === 'from_your_stack') {
        // From Your Stack: all entry tags exist in user's tags
        // This requires more complex logic; we'll filter in-memory
      }
    }

    // Fetch reflections with included relations
    const reflections = await prisma.reflection.findMany({
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
        filteredReflections = reflections.filter((r) =>
          r.tags.every((tag) => userTags.includes(tag)),
        );

        // If no strict matches, fall back to for_you logic
        if (
          filteredReflections.length === 0 &&
          filters?.tags === undefined
        ) {
          const forYouReflections = await prisma.reflection.findMany({
            where: {
              ...baseWhere,
              tags: { hasSome: userTags },
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
            },
            orderBy,
            skip,
            take: limit,
          });
          filteredReflections = forYouReflections as any;
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
          const confidence = (r.fields as any)?.confidence;
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
    const response = await this.buildFeedResponse(
      filteredReflections,
      userId,
    );

    // Count total for pagination
    const total = await prisma.reflection.count({
      where: {
        ...where,
        ...(view === 'from_your_stack'
          ? {}
          : {}), // Simplified total count
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
   * Toggle a reaction on an entry (create or delete)
   */
  async toggleReaction(
    entryId: string,
    userId: string,
    type: 'useful' | 'felt_this' | 'critical' | 'noted',
  ) {
    const prisma = this.prisma as any;
    // Check if reaction already exists
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        entryId_userId_type: {
          entryId,
          userId,
          type,
        },
      },
    });

    if (existingReaction) {
      // Delete the reaction (toggle off)
      await prisma.reaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
    } else {
      // Create the reaction (toggle on)
      await prisma.reaction.create({
        data: {
          entryId,
          userId,
          type,
        },
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
    const prisma = this.prisma as any;
    // Check if entry is already vaulted
    const existingVault = await prisma.vaultEntry.findUnique({
      where: {
        userId_entryId: {
          userId,
          entryId,
        },
      },
    });

    if (existingVault) {
      // Remove from vault (toggle off)
      await prisma.vaultEntry.delete({
        where: {
          id: existingVault.id,
        },
      });
    } else {
      // Add to vault (toggle on)
      await prisma.vaultEntry.create({
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
    const prisma = this.prisma as any;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    // Get vaulted entries
    const vaultEntries = await prisma.vaultEntry.findMany({
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
          confidence:
            (ve.entry.template_type === 'bug_autopsy' ||
              ve.entry.template_type === 'technical_challenge') &&
            (ve.entry.fields as any)?.confidence
              ? (ve.entry.fields as any).confidence
              : null,
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

    const total = await prisma.vaultEntry.count({
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
