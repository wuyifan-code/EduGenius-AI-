import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KnowledgeGraphService {
  private readonly logger = new Logger(KnowledgeGraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 使用 MiniMax 大语言模型结合知识图谱生成临床路径
   */
  async generateClinicalPathway(disease: string, department: string) {
    this.logger.log(`Generating clinical pathway for ${disease} at ${department} using MiniMax LLM...`);
    
    // 模拟对接 MiniMax 大模型生成的智能预案节点
    const nodes = [
      { step: 1, name: '到达医院与患者汇合', required_evidence: ['gps', 'photo'] },
      { step: 2, name: '协助自助机取号/挂号', required_evidence: [] },
      { step: 3, name: '候诊室陪伴与情绪安抚', required_evidence: ['emotion'] },
      { step: 4, name: '主治医生面诊陪同', required_evidence: ['audio'] },
      { step: 5, name: '代取报告/医嘱确认', required_evidence: ['photo'] },
      { step: 6, name: '护送离院', required_evidence: ['gps'] }
    ];

    return this.prisma.clinicalPathway.create({
      data: {
        disease,
        department,
        nodes,
      }
    });
  }
}
