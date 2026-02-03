export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export type ChatMode = 'academic' | 'fun';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface LessonPlan {
  title: string;
  gradeLevel: string;
  subject: string;
  duration: string;
  objectives: string[];
  materials: string[];
  activities: {
    time: string;
    description: string;
  }[];
  assessment: string;
}

export interface LearningTask {
  week: number;
  focus: string;
  tasks: string[];
  resources: string[];
}

export interface StudentProfile {
  name: string;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  interests: string[];
}