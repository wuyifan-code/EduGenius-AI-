import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TrustService } from './trust.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  /**
   * 获取陪诊师信任评分
   */
  @Get('score/:escortId')
  async getTrustScore(@Param('escortId') escortId: string) {
    return this.trustService.getTrustScore(escortId);
  }

  /**
   * 刷新信任评分
   */
  @Post('refresh/:escortId')
  @UseGuards(JwtAuthGuard)
  async refreshTrustScore(@Param('escortId') escortId: string) {
    return this.trustService.refreshTrustScore(escortId);
  }
}
