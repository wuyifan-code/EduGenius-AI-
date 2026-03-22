import { Injectable, Logger } from '@nestjs/common';
import { TrustAlgorithm } from './trust-algorithm';

@Injectable()
export class TrustService {
  private readonly logger = new Logger(TrustService.name);

  constructor(private readonly trustAlgorithm: TrustAlgorithm) {}

  /**
   * 获取陪诊师的信任评分
   */
  async getTrustScore(escortId: string) {
    const score = await this.trustAlgorithm.calculateTrustScore(escortId);
    const level = this.trustAlgorithm.getTrustLevel(score);

    return {
      escortId,
      trustScore: score,
      trustLevel: level,
      levelDescription: this.getLevelDescription(level),
    };
  }

  /**
   * 触发信任分重新计算
   */
  async refreshTrustScore(escortId: string) {
    await this.trustAlgorithm.updateTrustScoreOnEvidence(escortId);
    return this.getTrustScore(escortId);
  }

  /**
   * 获取信任等级描述
   */
  private getLevelDescription(level: number): string {
    const descriptions: Record<number, string> = {
      1: '新人陪诊师',
      2: '实习陪诊师',
      3: '正式陪诊师',
      4: '资深陪诊师',
      5: '金牌陪诊师',
    };
    return descriptions[level] || '未评级';
  }
}
