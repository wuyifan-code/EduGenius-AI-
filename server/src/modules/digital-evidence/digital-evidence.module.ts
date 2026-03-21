import { Module } from '@nestjs/common';
import { DigitalEvidenceService } from './digital-evidence.service';
import { DigitalEvidenceController } from './digital-evidence.controller';

@Module({
  controllers: [DigitalEvidenceController],
  providers: [DigitalEvidenceService],
  exports: [DigitalEvidenceService],
})
export class DigitalEvidenceModule {}
