import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Language } from '../types';
import {
  Users, ShoppingCart, UserCheck, DollarSign, TrendingUp,
  ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight,
  Check, X, Eye, Edit, Ban, Unlock
} from 'lucide-react';

interface AdminDashboardProps {
  lang: Language;
}

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalEscorts: number;
    verifiedEscorts: number;
    totalOrders: number;
    totalRevenue: number;
  };
  trends: {
    thisMonthOrders: number;
    thisMonthRevenue: number;
    orderGrowth: number;
    revenueGrowth: number;
  };
  recentOrders: any[];
  ordersByStatus: { status: string; count: number }[];
  dailyOrders: { date: string; count: number }[];
}

type TabType = 'dashboard' | 'users' | 'orders' | 'escorts';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');

  // Order management state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');

  // Escort management state
  const [escorts, setEscorts] = useState<any[]>([]);
  const [escortsPage, setEscortsPage] = useState(1);
  const [escortsTotal, setEscortsTotal] = useState(0);
  const [escortSearch, setEscortSearch] = useState('');
  const [escortStatus, setEscortStatus] = useState('');

  const t = {
    zh: {
      dashboard: '仪表盘',
      users: '用户管理',
      orders: '订单管理',
      escorts: '陪诊师管理',
      totalUsers: '用户总数',
      totalEscorts: '陪诊师总数',
      verifiedEscorts: '已认证陪诊师',
      totalOrders: '订单总数',
      totalRevenue: '总收入',
      thisMonthOrders: '本月订单',
      thisMonthRevenue: '本月收入',
      orderGrowth: '订单增长',
      revenueGrowth: '收入增长',
      recentOrders: '最近订单',
      noData: '暂无数据',
      search: '搜索',
      status: '状态',
      actions: '操作',
      view: '查看',
      edit: '编辑',
      disable: '禁用',
      enable: '启用',
      verify: '审核',
      approve: '通过',
      reject: '拒绝',
      assign: '分配',
      prev: '上一页',
      next: '下一页',
      page: '页',
      of: '共',
      pending: '待处理',
      confirmed: '已确认',
      matched: '已匹配',
      inProgress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    },
    en: {
      dashboard: 'Dashboard',
      users: 'Users',
      orders: 'Orders',
      escorts: 'Escorts',
      totalUsers: 'Total Users',
      totalEscorts: 'Total Escorts',
      verifiedEscorts: 'Verified Escorts',
      totalOrders: 'Total Orders',
      totalRevenue: 'Total Revenue',
      thisMonthOrders: 'This Month',
      thisMonthRevenue: 'This Month Revenue',
      orderGrowth: 'Order Growth',
      revenueGrowth: 'Revenue Growth',
      recentOrders: 'Recent Orders',
      noData: 'No data',
      search: 'Search',
      status: 'Status',
      actions: 'Actions',
      view: 'View',
      edit: 'Edit',
      disable: 'Disable',
      enable: 'Enable',
      verify: 'Verify',
      approve: 'Approve',
      reject: 'Reject',
      assign: 'Assign',
      prev: 'Prev',
      next: 'Next',
      page: 'Page',
      of: 'of',
      pending: 'Pending',
      confirmed: 'Confirmed',
      matched: 'Matched',
      inProgress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
  }[lang];

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'escorts') loadEscorts();
  }, [activeTab, usersPage, ordersPage, escortsPage]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminDashboard();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiService.getAdminUsers(usersPage, 20, userSearch);
      setUsers(data.data);
      setUsersTotal(data.pagination.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await apiService.getAdminOrders(ordersPage, 20, orderStatus, orderSearch);
      setOrders(data.data);
      setOrdersTotal(data.pagination.total);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadEscorts = async () => {
    try {
      const data = await apiService.getAdminEscorts(escortsPage, 20, escortStatus, escortSearch);
      setEscorts(data.data);
      setEscortsTotal(data.pagination.total);
    } catch (error) {
      console.error('Failed to load escorts:', error);
    }
  };

  const handleDisableUser = async (userId: string) => {
    try {
      await apiService.disableUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to disable user:', error);
    }
  };

  const handleEnableUser = async (userId: string) => {
    try {
      await apiService.enableUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to enable user:', error);
    }
  };

  const handleVerifyEscort = async (escortId: string, approved: boolean) => {
    try {
      await apiService.verifyEscort(escortId, approved);
      loadEscorts();
    } catch (error) {
      console.error('Failed to verify escort:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: t.pending,
      CONFIRMED: t.confirmed,
      MATCHED: t.matched,
      IN_PROGRESS: t.inProgress,
      COMPLETED: t.completed,
      CANCELLED: t.cancelled,
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      MATCHED: 'bg-purple-100 text-purple-800',
      IN_PROGRESS: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return `¥${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const renderTabButton = (tab: TabType, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-teal-500 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  // Dashboard Tab
  if (activeTab === 'dashboard') {
    return (
      <div className="pb-20">
        <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-3">
          <h1 className="text-xl font-bold text-slate-900">{t.dashboard}</h1>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : stats ? (
          <div className="p-4 space-y-4">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t.totalUsers}</p>
                    <p className="text-xl font-bold text-slate-900">{stats.overview.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t.verifiedEscorts}</p>
                    <p className="text-xl font-bold text-slate-900">{stats.overview.verifiedEscorts}/{stats.overview.totalEscorts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t.totalOrders}</p>
                    <p className="text-xl font-bold text-slate-900">{stats.overview.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t.totalRevenue}</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.overview.totalRevenue)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trends */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">{lang === 'zh' ? '本月趋势' : 'This Month Trends'}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-500">{t.thisMonthOrders}</p>
                    <p className="text-lg font-bold text-slate-900">{stats.trends.thisMonthOrders}</p>
                  </div>
                  <div className={`flex items-center gap-1 ${stats.trends.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.trends.orderGrowth >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    {Math.abs(stats.trends.orderGrowth)}%
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-500">{t.thisMonthRevenue}</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.trends.thisMonthRevenue)}</p>
                  </div>
                  <div className={`flex items-center gap-1 ${stats.trends.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.trends.revenueGrowth >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    {Math.abs(stats.trends.revenueGrowth)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Orders by Status */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">{lang === 'zh' ? '订单状态分布' : 'Orders by Status'}</h2>
              <div className="flex flex-wrap gap-2">
                {stats.ordersByStatus.map((item) => (
                  <div key={item.status} className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}: {item.count}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">{t.recentOrders}</h2>
              <div className="space-y-2">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{order.patientName || 'Patient'}</p>
                      <p className="text-xs text-slate-500">{order.hospital?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">¥{order.price}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">{t.noData}</div>
        )}

        {/* Tab Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around">
          {renderTabButton('dashboard', <TrendingUp className="h-5 w-5" />, t.dashboard)}
          {renderTabButton('users', <Users className="h-5 w-5" />, t.users)}
          {renderTabButton('orders', <ShoppingCart className="h-5 w-5" />, t.orders)}
          {renderTabButton('escorts', <UserCheck className="h-5 w-5" />, t.escorts)}
        </div>
      </div>
    );
  }

  // Users Tab
  if (activeTab === 'users') {
    return (
      <div className="pb-20">
        <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-3">
          <h1 className="text-xl font-bold text-slate-900">{t.users}</h1>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder={t.search}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setUsersPage(1); loadUsers(); } }}
              className="w-full bg-slate-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profile?.avatarUrl || `https://picsum.photos/60/60?random=${user.id}`}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-slate-900">{user.profile?.name || user.email}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'ESCORT' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? (lang === 'zh' ? '正常' : 'Active') : (lang === 'zh' ? '禁用' : 'Disabled')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {user.isActive ? (
                    <button
                      onClick={() => handleDisableUser(user.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm"
                    >
                      <Ban className="h-3 w-3" />
                      {t.disable}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnableUser(user.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm"
                    >
                      <Unlock className="h-3 w-3" />
                      {t.enable}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setUsersPage(p => Math.max(1, p - 1))}
              disabled={usersPage === 1}
              className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-sm disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.prev}
            </button>
            <span className="text-sm text-slate-500">
              {t.page} {usersPage} {t.of} {Math.ceil(usersTotal / 20)}
            </span>
            <button
              onClick={() => setUsersPage(p => p + 1)}
              disabled={usersPage >= Math.ceil(usersTotal / 20)}
              className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-sm disabled:opacity-50"
            >
              {t.next}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around">
          {renderTabButton('dashboard', <TrendingUp className="h-5 w-5" />, t.dashboard)}
          {renderTabButton('users', <Users className="h-5 w-5" />, t.users)}
          {renderTabButton('orders', <ShoppingCart className="h-5 w-5" />, t.orders)}
          {renderTabButton('escorts', <UserCheck className="h-5 w-5" />, t.escorts)}
        </div>
      </div>
    );
  }

  // Orders Tab
  if (activeTab === 'orders') {
    return (
      <div className="pb-20">
        <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-3">
          <h1 className="text-xl font-bold text-slate-900">{t.orders}</h1>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder={t.search}
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setOrdersPage(1); loadOrders(); } }}
              className="w-full bg-slate-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto">
            {['PENDING', 'CONFIRMED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => { setOrderStatus(status === orderStatus ? '' : status); setOrdersPage(1); }}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  orderStatus === status ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">{order.id.slice(0, 8)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{order.patientName || 'Patient'}</p>
                    <p className="text-sm text-slate-500">{order.hospital?.name}</p>
                    <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">¥{order.price}</p>
                    {order.escort ? (
                      <p className="text-sm text-slate-500">{order.escort.profile?.name}</p>
                    ) : (
                      <p className="text-sm text-orange-500">{lang === 'zh' ? '待分配' : 'Unassigned'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
              disabled={ordersPage === 1}
              className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-sm disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.prev}
            </button>
            <span className="text-sm text-slate-500">
              {t.page} {ordersPage} {t.of} {Math.ceil(ordersTotal / 20)}
            </span>
            <button
              onClick={() => setOrdersPage(p => p + 1)}
              disabled={ordersPage >= Math.ceil(ordersTotal / 20)}
              className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-sm disabled:opacity-50"
            >
              {t.next}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around">
          {renderTabButton('dashboard', <TrendingUp className="h-5 w-5" />, t.dashboard)}
          {renderTabButton('users', <Users className="h-5 w-5" />, t.users)}
          {renderTabButton('orders', <ShoppingCart className="h-5 w-5" />, t.orders)}
          {renderTabButton('escorts', <UserCheck className="h-5 w-5" />, t.escorts)}
        </div>
      </div>
    );
  }

  // Escorts Tab
  return (
    <div className="pb-20">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-3">
        <h1 className="text-xl font-bold text-slate-900">{t.escorts}</h1>
      </div>

      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={t.search}
            value={escortSearch}
            onChange={(e) => setEscortSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setEscortsPage(1); loadEscorts(); } }}
            className="w-full bg-slate-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex gap-2 mb-4">
          {['verified', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => { setEscortStatus(status === escortStatus ? '' : status); setEscortsPage(1); }}
              className={`px-3 py-1 rounded-full text-sm ${
                escortStatus === status ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {status === 'verified' ? (lang === 'zh' ? '已认证' : 'Verified') : (lang === 'zh' ? '待审核' : 'Pending')}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {escorts.map((escort) => (
            <div key={escort.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src={escort.profile?.avatarUrl || `https://picsum.photos/60/60?random=${escort.id}`}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-slate-900">{escort.profile?.name || escort.email}</p>
                    <p className="text-sm text-slate-500">{escort.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {escort.escortProfile?.isVerified ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      {lang === 'zh' ? '已认证' : 'Verified'}
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      {lang === 'zh' ? '待审核' : 'Pending'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <span className="text-sm text-slate-500">
                    {lang === 'zh' ? '已完成' : 'Completed'}: {escort.escortProfile?.completedOrders || 0}
                  </span>
                  <span className="text-sm text-slate-500">
                    {lang === 'zh' ? '评分' : 'Rating'}: {escort.escortProfile?.rating?.toFixed(1) || '0.0'}
                  </span>
                </div>
                {!escort.escortProfile?.isVerified && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyEscort(escort.id, true)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm"
                    >
                      <Check className="h-3 w-3" />
                      {t.approve}
                    </button>
                    <button
                      onClick={() => handleVerifyEscort(escort.id, false)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm"
                    >
                      <X className="h-3 w-3" />
                      {t.reject}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setEscortsPage(p => Math.max(1, p - 1))}
            disabled={escortsPage === 1}
            className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-sm disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.prev}
          </button>
          <span className="text-sm text-slate-500">
            {t.page} {escortsPage} {t.of} {Math.ceil(escortsTotal / 20)}
          </span>
          <button
            onClick={() => setEscortsPage(p => p + 1)}
            disabled={escortsPage >= Math.ceil(escortsTotal / 20)}
            className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-sm disabled:opacity-50"
          >
            {t.next}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around">
        {renderTabButton('dashboard', <TrendingUp className="h-5 w-5" />, t.dashboard)}
        {renderTabButton('users', <Users className="h-5 w-5" />, t.users)}
        {renderTabButton('orders', <ShoppingCart className="h-5 w-5" />, t.orders)}
        {renderTabButton('escorts', <UserCheck className="h-5 w-5" />, t.escorts)}
      </div>
    </div>
  );
};
