import { LessonPlan, LearningTask, StudentProfile } from '../types';

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_CHAT = 'qwen-plus';

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('Missing VITE_DASHSCOPE_API_KEY');
  }
  return apiKey;
};

// System instructions
const TEACHER_SYSTEM_PROMPT = `
你是一位专业的教育顾问和教师助手。
你的目标是帮助老师创建结构化、引人入胜且有效的教案。

**语言要求**：
- 请**务必使用中文**进行回答，除非用户明确要求其他语言或涉及英语教学内容。

**模式**：
1. **学术模式**：保持专业、严谨、简洁，使用标准的教学术语。关注课程标准。
2. **趣味模式**：保持创意、幽默、热情，使用表情符号（emoji）。建议游戏化元素和有趣的隐喻。

**重要提示**：
- 当展示数学公式或科学方程式时，**必须**使用 LaTeX 语法。
- 行内公式使用单美元符号：$E=mc^2$
- 块级公式使用双美元符号：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
`;

const STUDENT_TUTOR_PROMPT = `
你是一位友好、耐心且知识渊博的AI导师。
你的目标是通过简单解释概念、提出引导性问题并检查理解情况来帮助学生学习。

**语言要求**：
- 请**务必使用中文**进行回答，解释概念时可以使用中文类比。

**模式**：
1. **学术模式**：注重清晰度、定义、逻辑步骤和备考。语气支持但严肃。
2. **趣味模式**：使用笑话、流行文化参考、表情符号（emoji）和讲故事。让学习感觉像游戏。

**重要提示**：
- 当解释数学或科学时，**必须**使用 LaTeX 语法表示公式。
- 行内公式使用单美元符号：$y = mx + b$
- 块级公式使用双美元符号：$$\\int_0^\\infty x^2 dx$$
`;

type DashscopeMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type DashscopeResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const extractJson = (text: string) => {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.search(/[\[{]/);
  const lastBrace = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return text.trim();
};

const requestChatCompletion = async (messages: DashscopeMessage[], options?: { responseFormat?: unknown }) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL_CHAT,
      messages,
      temperature: 0.7,
      ...(options?.responseFormat ? { response_format: options.responseFormat } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as DashscopeResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from DashScope');
  }

  return content;
};

export interface ChatChunk {
  text?: string;
}

export interface ChatModel {
  sendMessageStream: (params: { message: string }) => AsyncIterable<ChatChunk>;
}

export const generateLessonPlan = async (
  topic: string,
  grade: string,
  subject: string
): Promise<LessonPlan> => {
  const prompt = `为${grade}${subject}课创建一个详细的教案。具体主题是“${topic}”。请确保所有内容都用中文输出。\n\n请仅输出符合以下字段的JSON对象：title, gradeLevel, subject, duration, objectives, materials, activities, assessment。`;

  const responseText = await requestChatCompletion(
    [
      { role: 'system', content: TEACHER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { responseFormat: { type: 'json_object' } }
  );

  const jsonText = extractJson(responseText);
  return JSON.parse(jsonText) as LessonPlan;
};

export const generateLearningPlan = async (profile: StudentProfile): Promise<LearningTask[]> => {
  const prompt = `
    为${profile.name}制定一个为期4周的个性化学习计划。
    年级：${profile.grade}
    优势：${profile.strengths.join(', ')}
    弱点：${profile.weaknesses.join(', ')}
    兴趣：${profile.interests.join(', ')}

    计划应侧重于改善弱点，同时利用优势和兴趣。请确保所有内容都用中文输出。
    请仅输出JSON数组，每一项包含week, focus, tasks, resources字段。
  `;

  const responseText = await requestChatCompletion([
    { role: 'system', content: TEACHER_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ]);

  const jsonText = extractJson(responseText);
  return JSON.parse(jsonText) as LearningTask[];
};

export const getChatModel = (role: 'teacher' | 'student'): ChatModel => {
  const systemInstruction = role === 'teacher' ? TEACHER_SYSTEM_PROMPT : STUDENT_TUTOR_PROMPT;

  return {
    async *sendMessageStream({ message }: { message: string }) {
      const responseText = await requestChatCompletion([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: message },
      ]);
      yield { text: responseText };
    },
  };
};
