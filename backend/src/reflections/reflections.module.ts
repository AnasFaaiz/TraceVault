import { Module } from '@nestjs/common';
import { ReflectionsService } from './reflections.service';
import { ReflectionsController } from './reflections.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReflectionsService],
  controllers: [ReflectionsController],
  exports: [ReflectionsService],
})
export class ReflectionsModule {}
