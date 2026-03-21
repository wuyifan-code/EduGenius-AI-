import { Controller, Post, Body } from '@nestjs/common';
import { DigitalEvidenceService } from './digital-evidence.service';

@Controller('digital-evidence')
export class DigitalEvidenceController {
  constructor(private readonly digitalEvidenceService: DigitalEvidenceService) {}

  @Post('submit')
  async submit(@Body() dto: { orderId: string; nodeName: string; type: string; url: string; content: string }) {
    return this.digitalEvidenceService.submitEvidence(dto.orderId, dto.nodeName, dto.type, dto.url, dto.content);
  }
}
