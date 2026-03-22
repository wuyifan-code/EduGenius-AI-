import axios from 'axios';

// API base URL - use relative path for same-origin requests or configure VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types for chat
interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

/**
 * Get health triage advice based on symptoms
 * Calls backend AI service instead of direct Gemini API
 */
export const getHealthTriage = async (symptoms: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ai/triage`, { symptoms });
    return response.data.data || "Unable to generate triage advice. Please consult a doctor immediately.";
  } catch (error) {
    console.error("AI Triage API Error:", error);
    return "服务暂时不可用，请前往医院就诊。";
  }
};

/**
 * Get match reasoning for escort recommendation
 */
export const getMatchReasoning = async (patientNeeds: string, escortProfile: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ai/match`, {
      patientNeeds,
      escortProfile,
    });
    return response.data.data || "基于地理位置与专业资质智能推荐";
  } catch (error) {
    console.error("AI Match API Error:", error);
    return "基于地理位置与专业资质智能推荐";
  }
};

/**
 * Get AI assistant response (non-streaming)
 */
export const getAiAssistantResponse = async (
  prompt: string,
  history: ChatMessage[] = [],
  onChunk?: (chunk: string) => void
): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ai/chat`, {
      prompt,
      history,
    });
    
    const text = response.data.data || '抱歉，无法生成回复。';
    
    // Call onChunk with full text if provided (for consistency)
    if (onChunk) {
      onChunk(text);
    }
    
    return text;
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return '抱歉，服务暂时不可用。';
  }
};

/**
 * Get AI assistant response with streaming
 * Uses Server-Sent Events (SSE) for real-time streaming
 */
export const getAiAssistantStream = async (
  prompt: string,
  history: ChatMessage[] = [],
  onChunk: (chunk: string) => void
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, history }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // Parse SSE data format
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data) {
            fullText += data;
            onChunk(data);
          }
        }
      }
    }

    return fullText || '抱歉，无法生成回复。';
  } catch (error) {
    console.error('AI Chat Stream Error:', error);
    // Fallback to non-streaming
    return getAiAssistantResponse(prompt, history, onChunk);
  }
};
