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
} from '@nestjs/common';
import { ReflectionsService } from './reflections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reflections')
export class ReflectionsController {
  constructor(private reflectionsService: ReflectionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createReflection(
    @Body()
    body: {
      projectId: string;
      title: string;
      type: string;
      content: string;
      impact?: string;
      tools?: string[];
    },
  ) {
    return this.reflectionsService.createReflection(body.projectId, {
      title: body.title,
      type: body.type,
      content: body.content,
      impact: body.impact,
      tools: body.tools
    });
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
  getProjectReflections(@Param('projectId') projectId: string) {
    return this.reflectionsService.getProjectReflections(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(
    @Req() req: { user: { userId: string } },
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('impact') impact?: string,
    @Query('projectId') projectId?: string,
    @Query('scope') scope: 'personal' | 'global' = 'personal',
  ) {
    return this.reflectionsService.getFilteredReflections({
      userId: scope === 'personal' ? req.user.userId : undefined,
      projectId,
      search: q,
      type,
      impact,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateReflection(
    @Param('id') id: string,
    @Body() body: { title?: string; type?: string; content?: string; impact?: string; tools?: string[] },
  ) {
    return this.reflectionsService.updateReflection(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteReflection(@Param('id') id: string) {
    return this.reflectionsService.deleteReflection(id);
  }
}
