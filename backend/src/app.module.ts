import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './projects/projects.module';
import { ReflectionsModule } from './reflections/reflections.module';
import { CollectionsModule } from './collections/collections.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10, // 10 requests per minute per IP (adjust as needed)
        },
      ],
    }),
    UsersModule,
    AuthModule,
    PrismaModule,
    ProjectsModule,
    ReflectionsModule,
    CollectionsModule,
  ],
})
export class AppModule {}
