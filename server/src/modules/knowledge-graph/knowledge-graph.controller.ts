import { Controller, Post, Body } from '@nestjs/common';
import { KnowledgeGraphService } from './knowledge-graph.service';

@Controller('knowledge-graph')
export class KnowledgeGraphController {
  constructor(private readonly knowledgeGraphService: KnowledgeGraphService) {}

  @Post('pathway')
  async generatePathway(@Body() dto: { disease: string; department: string }) {
    return this.knowledgeGraphService.generateClinicalPathway(dto.disease, dto.department);
  }
}
