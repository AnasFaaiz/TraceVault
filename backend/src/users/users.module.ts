import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { ReflectionsModule } from '../reflections/reflections.module';

@Module({
  imports: [PrismaModule, ReflectionsModule],
  providers: [UsersService, ProfileService],
  controllers: [ProfileController],
  exports: [UsersService, ProfileService],
})
export class UsersModule {}
