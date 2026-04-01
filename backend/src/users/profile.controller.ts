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
