import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: { user: { userId: string; email: string } }) {
    return this.authService.getMe(req.user.userId);
  }

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string },
    @Res() res: Response,
  ) {
    const result = await this.authService.register(
      body.email,
      body.password,
      body.name,
      res,
    );
    res.json(result);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password, res);
    res.json(result);
  }
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.refreshToken(req, res);
    res.json(result);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.logout(req, res);
    res.json(result);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
