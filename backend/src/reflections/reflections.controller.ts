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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reflections')
export class ReflectionsController {
  constructor(private reflectionsService: ReflectionsService) {}

  /**
   * Create a new reflection with structured fields
   * Supports both new format (category/fields) and legacy format (type/content)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createReflection(
    @Req() req: { user: { userId: string } },
    @Body()
    body: {
      projectId: string;
      title: string;
      category?: string; // New format
      template_type?: string; // New format
      fields?: Record<string, any>; // New format
      tags?: string[]; // New format
      type?: string; // Legacy format
      content?: string; // Legacy format
      impact?: string;
      tools?: string[];
    },
  ) {
    // Support both new and legacy formats
    const category = body.category || body.type;
    const template_type = body.template_type || body.category || body.type;

    if (!category || !template_type) {
      throw new BadRequestException('category and template_type are required');
    }

    return this.reflectionsService.createReflection(
      req.user.userId,
      body.projectId,
      {
        title: body.title,
        category,
        template_type,
        fields: body.fields,
        tags: body.tags || [],
        content: body.content, // Legacy
        impact: body.impact || 'minor',
      },
    );
  }

  /**
   * Get recent reflections for the current user
   */
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

  /**
   * Get global feed of all reflections
   */
  @Get('feed')
  getFeed(@Query('limit') limit?: string) {
    return this.reflectionsService.getGlobalFeed(limit ? parseInt(limit) : 20);
  }

  /**
   * Get reflections for a specific project
   */
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

  /**
   * Search reflections with filters
   * Supports both 'type' (legacy) and 'category' (new) query params
   */
  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(
    @Req() req: { user: { userId: string } },
    @Query('q') q?: string,
    @Query('type') type?: string, // Legacy
    @Query('category') category?: string, // New
    @Query('impact') impact?: string,
    @Query('projectId') projectId?: string,
    @Query('scope') scope: 'personal' | 'global' = 'personal',
  ) {
    const filterCategory = category || type;

    return this.reflectionsService.getFilteredReflections({
      userId: scope === 'personal' ? req.user.userId : undefined,
      projectId,
      search: q,
      category: filterCategory,
      impact,
    });
  }

  /**
   * Get single reflection by ID
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getReflection(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.reflectionsService.getReflectionById(req.user.userId, id);
  }

  /**
   * Update an existing reflection
   * Supports both new format (category/fields) and legacy format (type/content)
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateReflection(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @Body()
    body: {
      title?: string;
      category?: string; // New format
      template_type?: string; // New format
      fields?: Record<string, any>; // New format
      tags?: string[]; // New format
      type?: string; // Legacy format
      content?: string; // Legacy format
      impact?: string;
      tools?: string[];
    },
  ) {
    return this.reflectionsService.updateReflection(req.user.userId, id, {
      title: body.title,
      category: body.category || body.type,
      template_type: body.template_type,
      fields: body.fields,
      tags: body.tags,
      content: body.content,
      impact: body.impact,
    });
  }

  /**
   * Delete a reflection
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteReflection(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.reflectionsService.deleteReflection(req.user.userId, id);
  }
}
