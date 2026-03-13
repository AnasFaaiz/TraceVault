import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService){}

  // createUser()
  async createUser(data: {
    email: string,
    password: string,
    name: string,
  }) {
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
}
