import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      this.logger.warn('Application will continue running without database connection');
      // Don't throw error, allow application to start
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect from database:', error);
    }
  }

  // Health check method
  async healthCheck() {
    try {
      await this.$queryRaw`SELECT 1`;
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}
