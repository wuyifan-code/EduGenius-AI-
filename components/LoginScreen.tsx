import React from 'react';
import { GraduationCap, User, BookOpen, Brain } from 'lucide-react';

interface LoginScreenProps {
  onSelectRole: (role: 'teacher' | 'student') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">EduGenius AI</h1>
            <p className="text-blue-200 text-sm">智能教育助手</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl w-full text-center">
          <h2 className="text-4xl font-bold mb-4">重新定义教学体验</h2>
          <p className="text-xl text-blue-100 mb-12">
            基于国产大模型，为教师提供智能备课支持，为学生定制个性化学习路径。请选择您的身份进入系统。
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Teacher Card */}
            <div 
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
              onClick={() => onSelectRole('teacher')}
            >
              <div className="bg-indigo-500 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">教师入口</h3>
              <p className="text-blue-100 mb-4">
                智能教案生成、课堂活动设计、学习成效分析
              </p>
              <button className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium transition-colors">
                进入教师模式
              </button>
            </div>

            {/* Student Card */}
            <div 
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
              onClick={() => onSelectRole('student')}
            >
              <div className="bg-emerald-500 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">学生入口</h3>
              <p className="text-blue-100 mb-4">
                个性化学习计划、AI导师辅导、知识点解析
              </p>
              <button className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg font-medium transition-colors">
                进入学生模式
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-blue-200">
        <p className="text-slate-400 text-sm">© 2024 EduGenius AI. Powered by 通义千问.</p>
      </footer>
    </div>
  );
};
