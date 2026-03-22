import { Injectable } from '@nestjs/common';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

@Injectable()
export class AiService {
  private client: LLMClient;
  private config: Config;

  constructor() {
    this.config = new Config();
    this.client = new LLMClient(this.config);
  }

  async getHealthTriage(symptoms: string): Promise<string> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a professional medical triage assistant. Respond in Chinese.',
        },
        {
          role: 'user' as const,
          content: `Based on the user's symptoms, please provide:
1. Recommended hospital department (挂号建议)
2. Preparation advice (建议准备)
3. A warm tip (温馨提示)

Symptoms: ${symptoms}

Please keep the response concise and helpful.`,
        },
      ];

      const response = await this.client.invoke(messages, {
        model: 'doubao-seed-1-6-lite-251015',
        temperature: 0.7,
      });

      return response.content || '无法生成分诊建议，请立即咨询医生。';
    } catch (error) {
      console.error('AI Triage Error:', error);
      return '服务暂时不可用，请前往医院就诊。';
    }
  }

  async getMatchReasoning(patientNeeds: string, escortProfile: string): Promise<string> {
    try {
      const messages = [
        {
          role: 'user' as const,
          content: `Explain why this escort is a good match for the patient in one sentence (in Chinese).

Patient Needs: ${patientNeeds}
Escort Profile: ${escortProfile}`,
        },
      ];

      const response = await this.client.invoke(messages, {
        model: 'doubao-seed-1-6-lite-251015',
        temperature: 0.7,
      });

      return response.content || '基于地理位置与专业资质智能推荐';
    } catch (error) {
      console.error('AI Match Error:', error);
      return '基于地理位置与专业资质智能推荐';
    }
  }

  async *chatStream(
    prompt: string,
    history: Array<{ role: 'user' | 'assistant'; text: string }> = [],
  ): AsyncGenerator<string> {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: '你是 MediMate 医疗助手，一个专业的医疗陪诊助手。请用中文回答问题，提供专业、温暖的医疗建议。',
        },
      ];

      // Add conversation history
      for (const msg of history) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      }

      // Add current prompt
      messages.push({ role: 'user', content: prompt });

      const stream = this.client.stream(messages, {
        model: 'doubao-seed-1-6-lite-251015',
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content.toString();
        }
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      yield '抱歉，服务暂时不可用。';
    }
  }

  async chat(prompt: string, history: Array<{ role: 'user' | 'assistant'; text: string }> = []): Promise<string> {
    let fullResponse = '';
    for await (const chunk of this.chatStream(prompt, history)) {
      fullResponse += chunk;
    }
    return fullResponse;
  }
}
