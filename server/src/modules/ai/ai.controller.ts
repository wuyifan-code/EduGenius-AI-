import {
  Controller,
  Post,
  Body,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, from, map } from 'rxjs';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('triage')
  @ApiOperation({ summary: 'Get health triage advice based on symptoms' })
  async getTriage(@Body('symptoms') symptoms: string) {
    const result = await this.aiService.getHealthTriage(symptoms);
    return { success: true, data: result };
  }

  @Post('match')
  @ApiOperation({ summary: 'Get match reasoning for escort recommendation' })
  async getMatch(
    @Body('patientNeeds') patientNeeds: string,
    @Body('escortProfile') escortProfile: string,
  ) {
    const result = await this.aiService.getMatchReasoning(patientNeeds, escortProfile);
    return { success: true, data: result };
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI assistant (non-streaming)' })
  async chat(
    @Body('prompt') prompt: string,
    @Body('history') history: Array<{ role: 'user' | 'assistant'; text: string }> = [],
  ) {
    const result = await this.aiService.chat(prompt, history);
    return { success: true, data: result };
  }

  @Sse('chat/stream')
  @ApiOperation({ summary: 'Chat with AI assistant (streaming)' })
  chatStream(
    @Body('prompt') prompt: string,
    @Body('history') history: Array<{ role: 'user' | 'assistant'; text: string }> = [],
  ): Observable<MessageEvent> {
    return from(this.aiService.chatStream(prompt, history)).pipe(
      map((chunk) => ({ data: chunk })),
    );
  }
}
