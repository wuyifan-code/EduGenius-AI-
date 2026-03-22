import { Module } from '@nestjs/common';
import { TrustService } from './trust.service';
import { TrustController } from './trust.controller';
import { TrustAlgorithm } from './trust-algorithm';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrustController],
  providers: [TrustService, TrustAlgorithm],
  exports: [TrustService, TrustAlgorithm],
})
export class TrustModule {}
