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

    if (
      !user ||
      typeof user !== 'object' ||
      !('id' in user) ||
      !('email' in user) ||
      !('name' in user) ||
      !('username' in user)
    ) {
      throw new BadRequestException('User creation failed');
    }

    const {
      id,
      email: userEmail,
      name: userName,
      username: userUsername,
    } = user as { id: string; email: string; name: string; username: string };
    const token = this.jwtService.sign({
      sub: id,
      email: userEmail,
    });

    return {
      message: 'User registered successfully',
      user: {
        id,
        email: userEmail,
        name: userName,
        username: userUsername,
      },
      accessToken: token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || typeof user !== 'object' || !('password' in user)) {
      throw new BadRequestException('Email Not Found');
    }

    const {
      id,
      email: userEmail,
      name: userName,
      username: userUsername,
      password: userPassword,
    } = user as {
      id: string;
      email: string;
      name: string;
      username: string;
      password: string;
    };
    const passwordMatch = await bcrypt.compare(password, userPassword);

    if (!passwordMatch) {
      throw new BadRequestException('Invalid password');
    }

    const token = this.jwtService.sign({
      sub: id,
      email: userEmail,
    });

    return {
      message: 'Login successfully',
      user: {
        id,
        email: userEmail,
        name: userName,
        username: userUsername,
      },
      accessToken: token,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    // Return generic response regardless of account existence.
    if (
      !user ||
      typeof user !== 'object' ||
      !('id' in user) ||
      !('email' in user)
    ) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { id, email: userEmail } = user as { id: string; email: string };
    await this.usersService.setPasswordResetToken(id, tokenHash, expiresAt);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('CLIENT_URL') ||
      'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    await this.emailService.sendPasswordResetEmail(userEmail, resetUrl);

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

    const typedUser = user as {
      id: string;
      passwordResetExpires: Date | undefined;
    };
    if (
      !typedUser.passwordResetExpires ||
      !(typedUser.passwordResetExpires instanceof Date)
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (typedUser.passwordResetExpires.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersService.updatePassword(typedUser.id, hashedPassword);
    await this.usersService.clearPasswordResetToken(typedUser.id);

    return {
      message: 'Password reset successful',
    };
  }

  async getMe(userId: string) {
    let user = await this.usersService.findById(userId);

    if (
      !user ||
      typeof user !== 'object' ||
      !('id' in user) ||
      !('email' in user)
    ) {
      throw new BadRequestException('User not found');
    }

    // Backfill username if missing
    let typedUser = user as {
      id: string;
      email: string;
      name: string;
      username?: string;
    };
    if (!typedUser.username) {
      const generatedUsername =
        (typedUser.name || 'user').toLowerCase().replace(/\s+/g, '') +
        Math.floor(Math.random() * 1000);
      user = await this.usersService.updateUsername(userId, generatedUsername);
      typedUser = user as {
        id: string;
        email: string;
        name: string;
        username: string;
      };
    }

    return {
      id: typedUser.id,
      email: typedUser.email,
      name: typedUser.name,
      username: typedUser.username,
    };
  }
}
