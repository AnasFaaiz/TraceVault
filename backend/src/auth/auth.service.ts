import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const username =
      name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);

    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
      name,
      username,
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
      accessToken: token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Email Not Found');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new BadRequestException('Invalid password');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      message: 'Login successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
      accessToken: token,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    // Return generic response regardless of account existence.
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersService.setPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('CLIENT_URL') ||
      'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, password: string) {
    if (!token || !password) {
      throw new BadRequestException('Token and password are required');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByPasswordResetToken(tokenHash);

    if (!user || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpires.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.usersService.clearPasswordResetToken(user.id);

    return {
      message: 'Password reset successful',
    };
  }

  async getMe(userId: string) {
    let user = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Backfill username if missing
    if (!user.username) {
      const generatedUsername =
        (user.name || 'user').toLowerCase().replace(/\s+/g, '') +
        Math.floor(Math.random() * 1000);
      user = await this.usersService.updateUsername(userId, generatedUsername);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
    };
  }
}
