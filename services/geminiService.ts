import { GoogleGenAI, Type } from "@google/genai";
import { LessonPlan, LearningTask, StudentProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const generateLessonPlan = async (
  topic: string,
  grade: string,
  subject: string
): Promise<LessonPlan> => {
  const prompt = `为${grade}${subject}课创建一个详细的教案。具体主题是“${topic}”。请确保所有内容都用中文输出。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: TEACHER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          gradeLevel: { type: Type.STRING },
          subject: { type: Type.STRING },
          duration: { type: Type.STRING },
          objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          materials: { type: Type.ARRAY, items: { type: Type.STRING } },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                description: { type: Type.STRING },
              },
            },
          },
          assessment: { type: Type.STRING },
        },
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate lesson plan");
  }

  return JSON.parse(response.text) as LessonPlan;
};

export const generateLearningPlan = async (profile: StudentProfile): Promise<LearningTask[]> => {
  const prompt = `
    为${profile.name}制定一个为期4周的个性化学习计划。
    年级：${profile.grade}
    优势：${profile.strengths.join(", ")}
    弱点：${profile.weaknesses.join(", ")}
    兴趣：${profile.interests.join(", ")}
    
    计划应侧重于改善弱点，同时利用优势和兴趣。请确保所有内容都用中文输出。
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            week: { type: Type.INTEGER },
            focus: { type: Type.STRING },
            tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
            resources: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate learning plan");
  }

  return JSON.parse(response.text) as LearningTask[];
};

export const getChatModel = (role: 'teacher' | 'student') => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: role === 'teacher' ? TEACHER_SYSTEM_PROMPT : STUDENT_TUTOR_PROMPT,
    }
  });
};