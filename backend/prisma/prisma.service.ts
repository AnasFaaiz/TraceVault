import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxConnectRetries = 5;

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connectWithRetry(
    retries: number = this.maxConnectRetries,
    baseDelayMs: number = 500,
  ) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Prisma connected on attempt ${attempt}/${retries}.`);
        }
        return;
      } catch (error) {
        lastError = error;

        if (attempt === retries) {
          throw error;
        }

        const delay = baseDelayMs * attempt;
        this.logger.warn(
          `Prisma connection attempt ${attempt}/${retries} failed. Retrying in ${delay}ms.`,
        );
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
