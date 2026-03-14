import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Query,
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
    },
  ) {
    return this.reflectionsService.createReflection(body.projectId, {
      title: body.title,
      type: body.type,
      content: body.content,
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
}
