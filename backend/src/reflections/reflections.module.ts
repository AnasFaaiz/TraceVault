import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ReflectionsService } from './reflections.service';
import { ReflectionsController } from './reflections.controller';
import { ThreadsService } from './threads.service';
import { ThreadsGateway } from './threads.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback_secret',
        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
  ],
  providers: [ReflectionsService, ThreadsService, ThreadsGateway],
  controllers: [ReflectionsController],
  exports: [ReflectionsService],
})
export class ReflectionsModule {}
