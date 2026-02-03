import React, { useState } from 'react';
import { UserRole } from './types';
import { LessonPlanner } from './components/LessonPlanner';
import { StudentLearningPlan } from './components/StudentLearningPlan';
import { ChatInterface } from './components/ChatInterface';
import { DashboardStats } from './components/DashboardStats';
import { LoginScreen } from './components/LoginScreen';
import { LayoutDashboard, GraduationCap, MessageSquare, BookOpen, Settings, LogOut, ChevronRight, School } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setRole(null);
    setActiveTab('dashboard');
  };

  // If no role is selected, show the Login Screen
  if (!role) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const menuItems = role === UserRole.TEACHER 
    ? [
        { id: 'dashboard', label: '教学概览', icon: LayoutDashboard },
        { id: 'planner', label: '智能教案', icon: BookOpen },
        { id: 'chat', label: '助教对话', icon: MessageSquare },
      ]
    : [
        { id: 'dashboard', label: '学习中心', icon: LayoutDashboard },
        { id: 'plan', label: '成长路径', icon: GraduationCap },
        { id: 'tutor', label: 'AI导师', icon: MessageSquare },
      ];

  const renderContent = () => {
    if (role === UserRole.TEACHER) {
      switch (activeTab) {
        case 'dashboard': return <DashboardStats />;
        case 'planner': return <LessonPlanner />;
        case 'chat': return <ChatInterface role="teacher" title="AI 教学顾问" />;
        default: return <DashboardStats />;
      }
    } else {
       switch (activeTab) {
        case 'dashboard': return (
          <div className="space-y-6">
             <div className="bg-indigo-600 rounded-2xl p-8 text-white flex justify-between items-center shadow-lg shadow-indigo-200">
                <div>
                   <h2 className="text-3xl font-bold mb-2">欢迎回来, 张同学!</h2>
                   <p className="opacity-90">你今天的学习计划已完成了 60%</p>
                </div>
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                   <GraduationCap className="w-12 h-12 text-white" />
                </div>
             </div>
             <StudentLearningPlan />
          </div>
        );
        case 'plan': return <StudentLearningPlan />;
        case 'tutor': return <ChatInterface role="student" title="AI 私人导师" />;
        default: return <StudentLearningPlan />;
      }
    }
  };

  const isChatMode = activeTab === 'chat' || activeTab === 'tutor';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20 transition-all duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${role === UserRole.TEACHER ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
            {role === UserRole.TEACHER ? <School className="w-6 h-6 text-white" /> : <GraduationCap className="w-6 h-6 text-white" />}
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">EduGenius</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
             const Icon = item.icon;
             const isActive = activeTab === item.id;
             const activeClass = role === UserRole.TEACHER 
               ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
               : 'bg-emerald-50 text-emerald-600 shadow-sm';
             const inactiveClass = 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';
             const iconActiveClass = role === UserRole.TEACHER ? 'text-indigo-600' : 'text-emerald-600';

             return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? iconActiveClass : 'text-slate-400'}`} />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
             );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
           {/* User Info Card */}
           <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${role === UserRole.TEACHER ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                 {role === UserRole.TEACHER ? '李' : '张'}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-slate-800 truncate">{role === UserRole.TEACHER ? '李老师' : '张同学'}</p>
                 <p className="text-xs text-slate-500 truncate">{role === UserRole.TEACHER ? '已登录: 教师端' : '已登录: 学生端'}</p>
              </div>
           </div>

           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-sm transition-colors"
           >
              <LogOut className="w-4 h-4" />
              退出登录
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-10">
           <h1 className="text-lg font-bold text-slate-800">
             {menuItems.find(i => i.id === activeTab)?.label}
           </h1>
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                 <img src={`https://picsum.photos/200/200?random=${role === UserRole.TEACHER ? 1 : 2}`} alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="text-sm">
                 <p className="font-medium text-slate-700">{role === UserRole.TEACHER ? '李老师' : '张同学'}</p>
                 <p className="text-slate-400 text-xs">{role === UserRole.TEACHER ? '数学教研组' : '八年级 (2) 班'}</p>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
           </div>
        </header>

        {/* Content Area */}
        <div className={`flex-1 ${isChatMode ? 'overflow-hidden flex flex-col' : 'overflow-y-auto p-8'} bg-slate-50`}>
           <div className={`${isChatMode ? 'h-full w-full' : 'max-w-7xl mx-auto h-full'}`}>
              {renderContent()}
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;