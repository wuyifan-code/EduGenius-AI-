import React, { useState } from 'react';
import { generateLearningPlan } from '../services/geminiService';
import { LearningTask, StudentProfile } from '../types';
import { Rocket, Target, Book, Calendar, CheckCircle2, RefreshCcw, Loader2 } from 'lucide-react';

export const StudentLearningPlan: React.FC = () => {
  // Mock initial profile - in a real app this comes from DB
  const [profile, setProfile] = useState<StudentProfile>({
    name: '张同学',
    grade: '初二',
    strengths: ['逻辑思维', '几何'],
    weaknesses: ['英语写作', '代数函数'],
    interests: ['编程', '科幻小说']
  });

  const [plan, setPlan] = useState<LearningTask[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreatePlan = async () => {
    setLoading(true);
    try {
      const result = await generateLearningPlan(profile);
      setPlan(result);
    } catch (e) {
      console.error(e);
      alert('生成计划失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Summary Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Rocket className="w-6 h-6" /> 
              {profile.name}的个性化成长路径
            </h2>
            <p className="opacity-90">当前阶段：{profile.grade}</p>
          </div>
          <button 
            onClick={handleCreatePlan}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <RefreshCcw className="w-4 h-4" />}
            {plan.length > 0 ? '重新生成计划' : '生成专属计划'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">优势 Strengths</span>
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.strengths.map(s => <span key={s} className="bg-emerald-500/80 px-2 py-0.5 rounded text-sm">{s}</span>)}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">待提升 Weaknesses</span>
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.weaknesses.map(s => <span key={s} className="bg-rose-500/80 px-2 py-0.5 rounded text-sm">{s}</span>)}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">兴趣 Interests</span>
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.interests.map(s => <span key={s} className="bg-blue-500/80 px-2 py-0.5 rounded text-sm">{s}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {plan.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            4周学习冲刺计划
          </h3>
          
          <div className="relative">
             {/* Vertical Line */}
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200"></div>

            <div className="space-y-8">
              {plan.map((week, idx) => (
                <div key={idx} className="relative flex gap-6">
                  {/* Circle Indicator */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-4 border-indigo-100 flex items-center justify-center z-10 shadow-sm">
                    <span className="font-bold text-indigo-600 text-lg">{week.week}</span>
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg text-slate-800">第 {week.week} 周：{week.focus}</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 关键任务
                        </h5>
                        <ul className="space-y-2">
                          {week.tasks.map((task, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-1">
                          <Book className="w-4 h-4 text-blue-500" /> 推荐资源
                        </h5>
                         <ul className="space-y-2">
                          {week.resources.map((res, i) => (
                            <li key={i} className="flex items-start gap-2 text-indigo-600 text-sm cursor-pointer hover:underline">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-1.5 flex-shrink-0"></span>
                              {res}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {!loading && plan.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
           <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
           <p className="text-slate-500">点击上方按钮，AI将根据你的画像生成专属学习计划</p>
        </div>
      )}
      
       {loading && plan.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
           <Loader2 className="w-12 h-12 text-indigo-500 mx-auto mb-3 animate-spin" />
           <p className="text-slate-500">正在分析你的学习数据，定制计划中...</p>
        </div>
      )}
    </div>
  );
};
