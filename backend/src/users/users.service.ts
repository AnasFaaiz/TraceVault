import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, TrustedDevice, EmailOtps, Visibility } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // createUser()
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    username?: string;
    visibility?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        username: data.username,
        visibility:
          (data.visibility?.toUpperCase() as Visibility) || Visibility.PUBLIC,
      },
    });
  }

  // findByEmail()
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUsername(userId: string, username: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { username },
    });
  }

  async setPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetTokenHash: token,
        passwordResetExpires: expiresAt,
      },
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: token,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });
  }

  async clearPasswordResetToken(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetTokenHash: null,
        passwordResetExpires: null,
      },
    });
  }

  async setRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: tokenHash,
        refreshTokenExpires: expiresAt,
      },
    });
  }

  async clearRefreshToken(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
        refreshTokenExpires: null,
      },
    });
  }
  async findByRefreshToken(tokenHash: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        refreshTokenHash: tokenHash,
      },
    });
  }

  async updateTwoFactorSecret(userId: string, secret: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
  }

  async enableTwoFactor(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorSecret: true },
    });
  }

  async disableTwoFactor(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorSecret: false,
        twoFactorSecret: null,
      },
    });
  }

  async FindTrustedDevice(
    userId: string,
    deviceHash: string,
  ): Promise<TrustedDevice | null> {
    return this.prisma.trustedDevice.findFirst({
      where: { userId, deviceHash, expiresAt: { gte: new Date() } },
    });
  }

  async saveTrustedDevice(
    userId: string,
    deviceHash: string,
    expiresAt: Date,
    browser?: string,
    ipAddress?: string,
  ): Promise<TrustedDevice> {
    return this.prisma.trustedDevice.create({
      data: { userId, deviceHash, expiresAt, browser, ipAddress },
    });
  }

  async saveEmailOtp(
    userId: string,
    otpHash: string,
    expiresAt: Date,
  ): Promise<EmailOtps> {
    await this.prisma.emailOtps.deleteMany({ where: { userId } });
    return this.prisma.emailOtps.create({
      data: { userId, otpHash, expiresAt },
    });
  }

  async verifyTemporaryEmailOtp(
    userId: string,
    rawOtp: string,
  ): Promise<boolean> {
    const currentOtpHash = crypto
      .createHash('sha256')
      .update(rawOtp)
      .digest('hex');
    const otpRecord = await this.prisma.emailOtps.findFirst({
      where: {
        userId,
        otpHash: currentOtpHash,
        expiresAt: { gte: new Date() },
      },
    });
    if (!otpRecord) return false;
    await this.prisma.emailOtps.delete({ where: { id: otpRecord.id } });
    return true;
  }
}
