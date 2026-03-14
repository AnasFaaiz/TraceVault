import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: { user: { userId: string; email: string } }) {
    return req.user;
  }

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string },
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.name,
    );
  }

  @Post('login')
  async login(
    @Body() body: {email: string, password: string },
  ) {
    return this.authService.login(
      body.email,
      body.password,
    );
  }
}
