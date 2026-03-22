import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { KnowledgeGraphService } from './knowledge-graph.service';

@Controller('knowledge-graph')
export class KnowledgeGraphController {
  constructor(private readonly knowledgeGraphService: KnowledgeGraphService) {}

  @Post('pathway')
  async generatePathway(@Body() dto: { disease: string; department: string }) {
    return this.knowledgeGraphService.generateClinicalPathway(dto.disease, dto.department);
  }

  @Get('evidence-completeness/:orderId')
  async checkEvidenceCompleteness(@Param('orderId') orderId: string) {
    return this.knowledgeGraphService.checkEvidenceCompleteness(orderId);
  }

  @Get('current-node/:orderId')
  async getCurrentPathNode(@Param('orderId') orderId: string) {
    const nodeName = await this.knowledgeGraphService.getCurrentPathNode(orderId);
    return { currentNode: nodeName };
  }
}
