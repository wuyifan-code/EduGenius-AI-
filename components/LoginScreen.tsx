import React from 'react';
import { UserRole } from '../types';
import { GraduationCap, School, ArrowRight, BookOpenCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-6">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <BookOpenCheck className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-800 tracking-tight">EduGenius AI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">智能教育辅助平台</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            基于 Gemini 大模型，为教师提供智能备课支持，为学生定制个性化学习路径。请选择您的身份进入系统。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Teacher Card */}
          <div 
            onClick={() => onLogin(UserRole.TEACHER)}
            className="group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl hover:shadow-indigo-200/50 border border-slate-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <School className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">我是老师</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                登录教师端，您可以：
                <br/>• 一键生成标准化教案
                <br/>• 分析班级学习数据
                <br/>• 获得 AI 教学助手支持
              </p>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-2 transition-transform">
                进入教学工作台 <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </div>

          {/* Student Card */}
          <div 
            onClick={() => onLogin(UserRole.STUDENT)}
            className="group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl hover:shadow-emerald-200/50 border border-slate-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-emerald-600 transition-colors">我是学生</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                登录学生端，您可以：
                <br/>• 获取个性化学习计划
                <br/>• 与 AI 导师一对一辅导
                <br/>• 追踪学习进度与弱项
              </p>
              <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform">
                进入学习中心 <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
           <p className="text-slate-400 text-sm">© 2024 EduGenius AI. Powered by Google Gemini.</p>
        </div>
      </div>
    </div>
  );
};