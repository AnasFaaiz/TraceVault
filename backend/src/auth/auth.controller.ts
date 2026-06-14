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
import * as express from 'express';

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
    @Res() res: express.Response,
  ) {
    const result = await this.authService.register(
      body.email,
      body.password,
      body.name,
      res,
    );
    // Explicit return to satisfy express passthrough constraints safely
    return res.json(result);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const result = await this.authService.login(body, req, res);
    return res.json(result);
  }

  @Post('mfa-email-otp')
  async sendEmailMfaOtp(
    @Body() body: { mfaSessionToken?: string; token?: string; email?: string },
    @Res() res: express.Response,
  ) {
    // ⚡️ FIXED: Fallback logic handles standard login MFA flows AND recovery tracking check-ins
    const targetToken = body.mfaSessionToken || body.token || '';

    const result = await this.authService.sendMfaEmailOtp(targetToken);
    return res.json(result);
  }

  @Post('verify-mfa-challenge')
  async verifyMfaChallenge(
    @Body()
    body: { mfaSessionToken: string; code: string; method: 'totp' | 'email' },
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const result = await this.authService.verifyMfaChallenge(body, req, res);
    return res.json(result);
  }

  @Post('refresh')
  async refresh(@Req() req: express.Request, @Res() res: express.Response) {
    const result = await this.authService.refreshToken(req, res);
    return res.json(result);
  }

  @Post('logout')
  async logout(@Req() req: express.Request, @Res() res: express.Response) {
    const result = await this.authService.logout(req, res);
    return res.json(result);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { token: string; password: string },
    @Res() res: express.Response,
  ) {
    const result = await this.authService.resetPassword(
      body.token,
      body.password,
    );
    return res.json(result);
  }
}
