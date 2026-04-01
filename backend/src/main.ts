import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors(); // Enable CORS for development

  // Serve static files from the 'uploads' directory
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
});
