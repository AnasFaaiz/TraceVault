import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { EmailService } from '../email/email.service';
import { authenticator } from '@otplib/preset-default';
import * as QRCode from 'qrcode';
import type { Response, Request } from 'express';
import { VerifyMfaDto } from './dto/mfa.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private setRefreshTokenCookie(res: Response, token: string, expires: Date) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expires,
    });
  }

  async register(
    email: string,
    password: string,
    name: string,
    res?: Response,
  ) {
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

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.usersService.setRefreshToken(
      user.id,
      this.hashToken(refreshToken),
      refreshTokenExpires,
    );

    if (res) this.setRefreshTokenCookie(res, refreshToken, refreshTokenExpires);

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

  async login(dto: LoginDto, req: Request, res: Response) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || typeof user !== 'object' || !('password' in user)) {
      throw new BadRequestException('Email Not Found');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new BadRequestException('Invalid Credentials');
    }

    const rawDeviceCookie = req.cookies['trustedDevice'];
    let isDeviceTrusted = false;

    if (rawDeviceCookie) {
      const deviceHash = this.hashToken(rawDeviceCookie);
      const trustedRecord = await this.usersService.FindTrustedDevice(
        user.id,
        deviceHash,
      );

      if (trustedRecord) isDeviceTrusted = true;
    }

    if (!isDeviceTrusted) {
      const mfaSessionToken = this.jwtService.sign(
        { sub: user.id, isMfaPending: true },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '5m',
        },
      );
      return {
        requiresMFA: true,
        mfaSessionToken,
        supportedMethods: user.twoFactorSecret ? ['totp', 'email'] : ['email'],
      };
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.usersService.setRefreshToken(
      user.id,
      this.hashToken(refreshToken),
      refreshTokenExpires,
    );
    this.setRefreshTokenCookie(res, refreshToken, refreshTokenExpires);

    return {
      message: 'Login Successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
      accessToken: token,
    };
  }

  async verifyMfaChallenge(dto: VerifyMfaDto, req: Request, res: Response) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.mfaSessionToken);
    } catch {
      throw new UnauthorizedException('MFA session expired');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new BadRequestException('User footprint not found');

    if (dto.method === 'totp') {
      if (!user.twoFactorSecret)
        throw new BadRequestException('TOTP initialization properties missing');
      const isValid = authenticator.verify({
        token: dto.code,
        secret: user.twoFactorSecret,
      });
      if (!isValid)
        throw new UnauthorizedException('Invalid Verification token');
    } else {
      const isValid = await this.usersService.verifyTemporaryEmailOtp(
        user.id,
        dto.code,
      );
      if (!isValid) throw new UnauthorizedException('Invalid or expired code');
    }

    // Success: Save Device
    const rawDeviceToken = randomBytes(64).toString('hex');
    const deviceHash = this.hashToken(rawDeviceToken);
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const userAgentRaw = req.headers['user-agent'] || 'Unknown Platform';
    const userAgent = Array.isArray(userAgentRaw)
      ? userAgentRaw[0]
      : userAgentRaw;
    await this.usersService.saveTrustedDevice(
      user.id,
      deviceHash,
      thirtyDays,
      userAgent,
    );

    res.cookie('trustedDevice', rawDeviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: thirtyDays,
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      message: 'MFA checkpoint is cleared',
      accessToken: token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async sendMfaEmailOtp(mfaSessionToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(mfaSessionToken);
    } catch {
      throw new UnauthorizedException('MFA Verification timeframe expired');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new BadRequestException('User Profile not found');

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.usersService.saveEmailOtp(
      user.id,
      this.hashToken(rawOtp),
      expiresAt,
    );
    await this.emailService.sendPasswordResetEmail(
      user.email,
      `Your TraceVault security code is: ${rawOtp}`,
    );

    return {
      message: 'security token passed to mailbox',
    };
  }

  async generate2FaQrCode(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'TraceVault', secret);

    await this.usersService.updateTwoFactorSecret(userId, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    return {
      qrCodeUrl,
      secret,
    };
  }

  async activate2Fa(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorSecret)
      throw new BadRequestException('2FA configuration uninitialized');

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });
    if (!isValid) throw new UnauthorizedException('Invalid confimation code');

    await this.usersService.enableTwoFactor(userId);
    return {
      message: 'MFA configuration activated successfully',
    };
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const user = await this.usersService.findByRefreshToken(
      this.hashToken(refreshToken),
    );
    if (
      !user ||
      !user.refreshTokenExpires ||
      user.refreshTokenExpires.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const newRefreshToken = randomBytes(64).toString('hex');
    const newRefreshTokenExpires = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );

    // ⚡️ FIXED: Re-added the database storage call so the rotated token state is saved in PostgreSQL
    await this.usersService.setRefreshToken(
      user.id,
      this.hashToken(newRefreshToken),
      newRefreshTokenExpires,
    );

    this.setRefreshTokenCookie(res, newRefreshToken, newRefreshTokenExpires);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    };
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    if (refreshToken) {
      const user = await this.usersService.findByRefreshToken(
        this.hashToken(refreshToken),
      );
      if (user) await this.usersService.clearRefreshToken(user.id);
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    const genericResponse = {
      message:
        'If an account with that email exists, a password reset link has been sent. ',
    };

    // Return generic response regardless of account existence.
    if (
      !user ||
      typeof user !== 'object' ||
      !('id' in user) ||
      !('email' in user)
    ) {
      return genericResponse;
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersService.setPasswordResetToken(
      user.id,
      this.hashToken(token),
      expiresAt,
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('CLIENT_URL') ||
      'http://localhost:3000';

    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);
    return genericResponse;
  }

  async resetPassword(token: string, password: string) {
    if (!token || !password) {
      throw new BadRequestException('Token and password are required');
    }

    const user = await this.usersService.findByPasswordResetToken(
      this.hashToken(token),
    );

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires.getTime() < Date.now()
    ) {
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
    const user = await this.usersService.findById(userId);

    if (
      !user ||
      typeof user !== 'object' ||
      !('id' in user) ||
      !('email' in user)
    ) {
      throw new BadRequestException('User not found');
    }

    let username = user.username;
    if (!username) {
      username =
        user.name.toLowerCase().replace(/\s+/g, '') +
        Math.floor(Math.random() * 1000);
      await this.usersService.updateUsername(user.id, username);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: username,
    };
  }
}
