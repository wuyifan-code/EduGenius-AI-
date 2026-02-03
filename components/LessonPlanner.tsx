import React, { useState } from 'react';
import { BookOpen, Clock, Target, List, Layers, Loader2, Save } from 'lucide-react';
import { generateLessonPlan } from '../services/geminiService';
import { LessonPlan } from '../types';

export const LessonPlanner: React.FC = () => {
  const [formData, setFormData] = useState({
    topic: '',
    grade: '七年级',
    subject: '数学'
  });
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!formData.topic) {
      setError('请输入课程主题');
      return;
    }
    setError('');
    setLoading(true);
    setPlan(null);
    try {
      const result = await generateLessonPlan(formData.topic, formData.grade, formData.subject);
      setPlan(result);
    } catch (err) {
      setError('生成教案失败，请重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Input Section */}
      <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          智能教案生成
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">年级</label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {['小学一年级', '小学三年级', '小学六年级', '七年级', '八年级', '九年级', '高一', '高三'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">学科</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {['语文', '数学', '英语', '物理', '化学', '历史', '生物', '地理'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">课程主题/知识点</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              placeholder="例如：勾股定理的应用"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
            {loading ? 'AI生成中...' : '生成教案'}
          </button>
        </div>

        <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-700 border border-blue-100">
          <p className="font-semibold mb-1">提示：</p>
          <p>生成的内容包含教学目标、所需材料、活动流程及评估方式。您可以直接复制或调整使用。</p>
        </div>
      </div>

      {/* Output Section */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
        {plan ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{plan.title}</h3>
                <div className="flex gap-4 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {plan.duration}</span>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">{plan.gradeLevel} {plan.subject}</span>
                </div>
              </div>
              <button className="text-slate-500 hover:text-indigo-600 transition-colors">
                <Save className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              <section>
                <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  教学目标
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {plan.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
              </section>

              <section>
                <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  所需材料
                </h4>
                <div className="flex flex-wrap gap-2">
                  {plan.materials.map((mat, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm border border-slate-200">{mat}</span>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2">
                  <List className="w-5 h-5 text-blue-500" />
                  教学流程
                </h4>
                <div className="space-y-4">
                  {plan.activities.map((act, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-100 transition-colors">
                      <div className="w-16 flex-shrink-0 font-bold text-indigo-600">{act.time}</div>
                      <div className="text-slate-700">{act.description}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2">评估与作业</h4>
                <p className="text-slate-700 bg-amber-50 p-4 rounded-lg border border-amber-100">{plan.assessment}</p>
              </section>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <Layers className="w-16 h-16 mb-4 opacity-20" />
            <p>在左侧输入信息并生成教案</p>
          </div>
        )}
      </div>
    </div>
  );
};
