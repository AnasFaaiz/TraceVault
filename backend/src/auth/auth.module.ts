import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback_secret',
        signOptions: {
          expiresIn: '7d', // Hardcoded for now to avoid the StringValue typing issue
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
