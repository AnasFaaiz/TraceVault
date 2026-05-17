/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  Patch,
  Body,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('users')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':username/profile')
  async getProfile(@Param('username') username: string, @Req() req: any) {
    const viewerId = req.user?.userId;
    return this.profileService.getProfileData(username, viewerId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':username/entries')
  async getEntries(
    @Param('username') username: string,
    @Query('sort') sort: string = 'recent',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Req() req: any,
  ) {
    const viewerId = req.user?.userId;
    return this.profileService.getProfileEntries(username, viewerId, {
      sort,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/history')
  async getHistory(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('projectId') projectId?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.profileService.getHistoryEntries({
      userId: req.user.userId,
      page: parseInt(page),
      limit: parseInt(limit),
      projectId,
      category,
      startDate,
      endDate,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/history/export')
  async exportHistory(
    @Req() req: any,
    @Res() res: any,
    @Query('format') format: 'json' | 'markdown' = 'json',
    @Query('projectId') projectId?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const history = await this.profileService.getAllHistoryEntries({
      userId: req.user.userId,
      projectId,
      category,
      startDate,
      endDate,
    });

    const fileBaseName = `tracevault-history-${new Date()
      .toISOString()
      .slice(0, 10)}`;

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileBaseName}.md"`,
      );
      return res.send(
        history.markdown || '# TraceVault History\n\nNo entries found.',
      );
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileBaseName}.json"`,
    );
    return res.json(history.entries);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: any,
    @Body()
    body: {
      name?: string;
      bio?: string;
      username?: string;
      avatarUrl?: string;
      isPrivate?: boolean;
    },
  ) {
    return this.profileService.updateProfile(req.user.userId, body);
  }

  @Get('check-username/:username')
  async checkUsername(@Param('username') username: string) {
    const user = await this.profileService.findByUsername(username);
    return { available: !user };
  }

  @Post('avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadAvatar(@UploadedFile() file: any, @Req() req: any) {
    const avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/${file.filename}`;
    await this.profileService.updateProfile(req.user.userId, { avatarUrl });
    return { avatarUrl };
  }
}
