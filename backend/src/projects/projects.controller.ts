import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createProject(
    @Body() body: {name: string; description?: string; techStack: string[] },
    @Req() req: any,
  ) {
    const userId = req.user.sub;

    return this.projectsService.createProject(
      userId,
      body.name,
      body.description,
      body.techStack,
    );
  }
}
