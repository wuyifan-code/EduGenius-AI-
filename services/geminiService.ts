import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

export const getHealthTriage = async (symptoms: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a professional medical triage assistant. 
Based on the user's symptoms, please provide:
1. Recommended hospital department (挂号建议)
2. Preparation advice (建议准备)
3. A warm tip (温馨提示)

Symptoms: ${symptoms}

Please keep the response concise and helpful.`,
    });
    
    return response.text || "Unable to generate triage advice. Please consult a doctor immediately.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Service temporarily unavailable. Please visit a hospital.";
  }
};

export const getMatchReasoning = async (patientNeeds: string, escortProfile: string): Promise<string> => {
   try {
     const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: `Explain why this escort is a good match for the patient in one sentence.

       Patient Needs: ${patientNeeds}
       Escort Profile: ${escortProfile}`
     });
     return response.text || "基于地理位置与专业资质智能推荐";
   } catch (error) {
     console.error("Gemini API Error:", error);
     return "基于地理位置与专业资质智能推荐";
   }
}

// Types for chat
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const getAiAssistantResponse = async (
  prompt: string,
  history: ChatMessage[] = [],
  onChunk?: (chunk: string) => void
): Promise<string> => {
  try {
    // Build conversation history
    const contents: any[] = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    // Try streaming first
    if (onChunk) {
      try {
        const stream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents,
        });

        let fullText = '';
        for await (const chunk of stream) {
          const chunkText = chunk.text;
          if (chunkText) {
            fullText += chunkText;
            onChunk(chunkText);
          }
        }
        return fullText;
      } catch (streamError) {
        console.error('Streaming failed, falling back to non-streaming:', streamError);
      }
    }

    // Non-streaming fallback
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    const text = response.text || 'Sorry, I could not generate a response.';
    // Call onChunk with full text if provided (for consistency)
    if (onChunk) {
      onChunk(text);
    }
    return text;
  } catch (error) {
    console.error('AI Assistant Error:', error);
    return 'Sorry, the service is temporarily unavailable.';
  }
};