import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // createUser()
  async createUser(data: { email: string; password: string; name: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  // findByEmail()
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
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
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      },
    });
  }

  async findByPasswordResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
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
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }
}
