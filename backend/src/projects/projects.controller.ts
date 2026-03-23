import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createProject(
    @Body() body: { name: string; description?: string; techStack: string[] },
    @Req() req: { user: { userId: string } },
  ) {
    const userId = req.user.userId;

    return this.projectsService.createProject(
      userId,
      body.name,
      body.techStack,
      body.description,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getProjects(@Req() req: { user: { userId: string } }) {
    return this.projectsService.getUserProjects(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateProject(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; techStack?: string[] },
    @Req() req: { user: { userId: string } },
  ) {
    return this.projectsService.updateProject(req.user.userId, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteProject(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.projectsService.deleteProject(req.user.userId, id);
  }
}
