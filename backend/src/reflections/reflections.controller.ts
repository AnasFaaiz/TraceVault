import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Query,
  Patch,
  Delete,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ReflectionsService } from './reflections.service';
import { ThreadsService, ThreadMessageDto } from './threads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('reflections')
export class ReflectionsController {
  constructor(
    private reflectionsService: ReflectionsService,
    private threadsService: ThreadsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReflection(
    @Req() req: { user: { userId: string } },
    @Body()
    body: {
      projectId?: string;
      title: string;
      entryType?: 'reflection' | 'social_post';
      category?: string;
      fields?: Record<string, any>;
      tags?: string[];
      type?: string;
      content?: string;
      impact?: string;
    },
  ) {
    const entryType =
      body.entryType ||
      (body.category?.toLowerCase() === 'social_post' ||
      body.type?.toLowerCase() === 'social_post'
        ? 'social_post'
        : 'reflection');

    let category = body.category || body.type;

    if (entryType === 'social_post') {
      category = 'SOCIAL_POST';
    } else if (!category) {
      throw new BadRequestException(
        'category fallback type descriptor is required',
      );
    }

    return this.reflectionsService.createReflection(
      req.user.userId,
      body.projectId,
      {
        title: body.title,
        category,
        fields: body.fields || {},
        tags: body.tags || [],
        content: body.content,
        impact: body.impact,
      },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('recent')
  getRecent(
    @Req() req: { user: { userId: string } },
    @Query('limit') limit?: string,
  ) {
    return this.reflectionsService.getRecentReflections(
      req.user.userId,
      limit ? parseInt(limit) : 5,
    );
  }

  @Get('feed')
  getFeed(@Query('limit') limit?: string) {
    return this.reflectionsService.getGlobalFeed(limit ? parseInt(limit) : 20);
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId')
  getProjectReflections(
    @Param('projectId') projectId: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.reflectionsService.getProjectReflections(
      req.user.userId,
      projectId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(
    @Req() req: { user: { userId: string } },
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('impact') impact?: string,
    @Query('projectId') projectId?: string,
    @Query('scope') scope: 'personal' | 'global' = 'personal',
  ) {
    return this.reflectionsService.getFilteredReflections({
      userId: scope === 'personal' ? req.user.userId : undefined,
      projectId,
      search: q,
      category: category || type,
      impact,
    });
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('trending')
  getTrending(
    @Req() req: { user?: { userId: string } },
    @Query('period') period: '24h' | '7d' | '30d' = '24h',
    @Query('limit') limit?: string,
  ) {
    return this.reflectionsService.getTrending(
      req.user?.userId,
      period,
      limit ? parseInt(limit) : 5,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getReflection(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId;
    return this.reflectionsService.getReflectionById(userId, id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/related')
  getRelated(
    @Param('id') id: string,
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.userId;
    return this.reflectionsService.getRelatedReflections(
      userId,
      id,
      limit ? parseInt(limit) : 4,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/thread')
  getThread(
    @Param('id') reflectionId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ): Promise<{
    threadId: string;
    reflectionId: string;
    messages: ThreadMessageDto[];
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    return this.threadsService.getThread(
      reflectionId,
      limit ? parseInt(limit) : 30,
      before,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/thread/messages')
  createThreadMessage(
    @Param('id') reflectionId: string,
    @Body() body: { body?: string },
    @Req() req: { user: { userId: string } },
  ): Promise<ThreadMessageDto> {
    const messageBody = body.body?.trim();
    if (!messageBody) {
      throw new BadRequestException('Message body is required');
    }
    return this.threadsService.createMessage(
      reflectionId,
      req.user.userId,
      messageBody,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateReflection(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @Body()
    body: {
      title?: string;
      category?: string;
      fields?: Record<string, any>;
      tags?: string[];
      type?: string;
      content?: string;
      impact?: string;
    },
  ) {
    return this.reflectionsService.updateReflection(req.user.userId, id, {
      title: body.title,
      category: body.category || body.type,
      fields: body.fields,
      tags: body.tags,
      content: body.content,
      impact: body.impact,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteReflection(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.reflectionsService.deleteReflection(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed/personalized')
  async getPersonalizedFeed(
    @Req() req: { user: { userId: string } },
    @Query('view') view: 'for_you' | 'from_your_stack' | 'trending' = 'for_you',
    @Query('tags') tags?: string,
    @Query('template_type') templateTypes?: string,
    @Query('impact') impact?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tagArray = tags ? tags.split(',') : [];
    const templateTypeArray = templateTypes ? templateTypes.split(',') : [];

    return this.reflectionsService.getFeed(
      req.user.userId,
      view,
      {
        tags: tagArray,
        templateTypes: templateTypeArray,
        impact,
      },
      {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      },
    );
  }

  @Get('tags/top')
  async getTopTags(@Query('limit') limit?: string) {
    return this.reflectionsService.getTopTags(limit ? parseInt(limit) : 12);
  }

  @Get('contributors')
  async getTopContributors(
    @Query('period') period: '24h' | '7d' | '30d' | 'all' = '30d',
    @Query('limit') limit?: string,
  ) {
    return this.reflectionsService.getTopContributors(
      period,
      limit ? parseInt(limit) : 6,
    );
  }

  @Get('tags')
  async getTags(@Query('search') search?: string) {
    const allTags = await this.reflectionsService.getAllTags();

    if (search) {
      const searchLower = search.toLowerCase();
      return allTags.filter((tag) => tag.toLowerCase().includes(searchLower));
    }

    return allTags;
  }

  @Get(':id/reactions')
  async getReactions(
    @Param('id') entryId: string,
    @Req() req?: { user?: { userId: string } },
  ) {
    return this.reflectionsService.getReactionCounts(
      entryId,
      req?.user?.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reactions')
  async toggleReaction(
    @Param('id') entryId: string,
    @Body() body: { type: 'UPVOTE' | 'DOWNVOTE' },
    @Req() req: { user: { userId: string } },
  ) {
    return this.reflectionsService.toggleVote(
      entryId,
      req.user.userId,
      body.type as any,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/vault')
  async toggleVault(
    @Param('id') entryId: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.reflectionsService.toggleVault(entryId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/vault-status')
  async getVaultStatus(
    @Param('id') entryId: string,
    @Req() req: { user: { userId: string } },
  ) {
    const vaulted = await this.reflectionsService.getVaultStatus(
      req.user.userId,
      entryId,
    );
    return { vaulted };
  }

  @UseGuards(JwtAuthGuard)
  @Get('vault/list')
  async getVaultedEntries(
    @Req() req: { user: { userId: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reflectionsService.getVaultedEntries(req.user.userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }
}
