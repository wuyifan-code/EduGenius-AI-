import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, TrendingUp, AlertCircle, Award } from 'lucide-react';

const dataPerformance = [
  { name: '1班', avg: 85, completed: 90 },
  { name: '2班', avg: 78, completed: 82 },
  { name: '3班', avg: 92, completed: 95 },
  { name: '4班', avg: 74, completed: 70 },
  { name: '5班', avg: 88, completed: 85 },
];

const dataTrends = [
  { week: 'W1', score: 75 },
  { week: 'W2', score: 78 },
  { week: 'W3', score: 82 },
  { week: 'W4', score: 80 },
  { week: 'W5', score: 88 },
];

export const DashboardStats: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">总学生数</p>
            <p className="text-2xl font-bold text-slate-800">245</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Users className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">平均分趋势</p>
            <p className="text-2xl font-bold text-emerald-600">+12%</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">需关注学生</p>
            <p className="text-2xl font-bold text-rose-600">12</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600"><AlertCircle className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">作业完成率</p>
            <p className="text-2xl font-bold text-indigo-600">94%</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><Award className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-6">班级综合表现对比</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} name="平均分" />
                <Bar dataKey="completed" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="完成率" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-6">年级进步趋势分析</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
