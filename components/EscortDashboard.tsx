import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, MapPin, MessageCircle, Repeat2, Heart, Share, BarChart2, Loader2, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Language, UserInfo } from '../types';
import { apiService } from '../services/apiService';

interface EscortDashboardProps {
  lang: Language;
  user?: UserInfo | null;
}

interface Order {
  id: string;
  patient_id: string;
  hospital_id: string;
  service_id: string;
  service_type: string;
  status: string;
  price: number;
  notes: string;
  created_at: string;
  hospital?: {
    name: string;
    department: string;
  };
  patient?: {
    name: string;
    avatar_url?: string;
  };
}

// Mock 订单数据用于降级显示
const MOCK_ORDERS: Order[] = [
  {
    id: 'order-001',
    patient_id: 'patient-001',
    hospital_id: 'hosp-001',
    service_id: 'svc-001',
    service_type: '全程陪诊',
    status: 'PENDING',
    price: 280,
    notes: '需要协助挂号和取药，老人行动不便',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    hospital: { name: '北京协和医院', department: '心内科' },
    patient: { name: '张阿姨', avatar_url: 'https://ui-avatars.com/api/?name=张阿姨&background=random' }
  },
  {
    id: 'order-002',
    patient_id: 'patient-002',
    hospital_id: 'hosp-002',
    service_id: 'svc-002',
    service_type: '代取报告',
    status: 'MATCHED',
    price: 150,
    notes: '帮忙取CT报告并邮寄',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    hospital: { name: '北京大学第一医院', department: '放射科' },
    patient: { name: '李先生', avatar_url: 'https://ui-avatars.com/api/?name=李先生&background=random' }
  },
  {
    id: 'order-003',
    patient_id: 'patient-003',
    hospital_id: 'hosp-003',
    service_id: 'svc-003',
    service_type: '全程陪诊',
    status: 'COMPLETED',
    price: 350,
    notes: '术后复查陪诊',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    hospital: { name: '北京天坛医院', department: '神经外科' },
    patient: { name: '王女士', avatar_url: 'https://ui-avatars.com/api/?name=王女士&background=random' }
  },
  {
    id: 'order-004',
    patient_id: 'patient-004',
    hospital_id: 'hosp-001',
    service_id: 'svc-004',
    service_type: '专车接送',
    status: 'IN_PROGRESS',
    price: 200,
    notes: '从家到医院往返',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    hospital: { name: '北京协和医院', department: '骨科' },
    patient: { name: '赵大爷', avatar_url: 'https://ui-avatars.com/api/?name=赵大爷&background=random' }
  },
];

export const EscortDashboard: React.FC<EscortDashboardProps> = ({ lang, user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadOrders();

    // 清理超时定时器
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      setUseMockData(false);

      // 设置 5 秒超时
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('Orders loading timeout, switching to mock data');
        setUseMockData(true);
        setOrders(MOCK_ORDERS);
        setLoading(false);
        setError('数据加载超时，已显示演示数据');
      }, 5000);

      const data = await apiService.getUserAppointments();

      // 清除超时定时器
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      if (data && data.length > 0) {
        setOrders(data);
      } else {
        // API 返回空数据，使用 Mock 数据
        setUseMockData(true);
        setOrders(MOCK_ORDERS);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      // 出错时使用 Mock 数据
      setUseMockData(true);
      setOrders(MOCK_ORDERS);
      setError('无法连接到服务器，已显示演示数据');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setProcessingOrder(orderId);
      await apiService.acceptOrder(orderId);
      await loadOrders();
    } catch (error) {
      console.error('Failed to accept order:', error);
      // 在 Mock 模式下更新本地状态
      if (useMockData) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: 'MATCHED' } : o
        ));
      }
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleDeclineOrder = async (orderId: string) => {
    try {
      setProcessingOrder(orderId);
      await apiService.updateOrder(orderId, { status: 'CANCELLED' });
      await loadOrders();
    } catch (error) {
      console.error('Failed to decline order:', error);
      // 在 Mock 模式下更新本地状态
      if (useMockData) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: 'CANCELLED' } : o
        ));
      }
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleCompleteOrder = async () => {
    if (!completingOrderId) return;

    try {
      setProcessingOrder(completingOrderId);
      setShowCompleteConfirm(false);
      await apiService.updateOrderStatus(completingOrderId, 'COMPLETED');
      await loadOrders();

      setSuccessMessage(lang === 'zh' ? '订单已完成' : 'Order completed');
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to complete order:', error);
      // 在 Mock 模式下更新本地状态
      if (useMockData) {
        setOrders(prev => prev.map(o =>
          o.id === completingOrderId ? { ...o, status: 'COMPLETED' } : o
        ));
        setSuccessMessage(lang === 'zh' ? '订单已完成' : 'Order completed');
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
      } else {
        alert(lang === 'zh' ? '完成订单失败，请重试' : 'Failed to complete order, please try again');
      }
    } finally {
      setProcessingOrder(null);
      setCompletingOrderId(null);
    }
  };

  const confirmComplete = (orderId: string) => {
    setCompletingOrderId(orderId);
    setShowCompleteConfirm(true);
  };

  const t = {
    zh: {
      pinnedStats: '数据统计',
      orderReq: '新订单请求',
      accept: '接单',
      decline: '拒绝',
      details: '订单详情',
      insurance: '包含保险',
      away: '距离',
      noOrders: '暂无新订单',
      loading: '加载中...',
      pending: '待接单',
      accepted: '已接单',
      inProgress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      totalIncome: '总收入',
      thisWeek: '本周',
      views: '浏览',
      retry: '重试',
      useDemo: '使用演示数据',
    },
    en: {
      pinnedStats: 'Statistics',
      orderReq: 'New Order Request',
      accept: 'Accept',
      decline: 'Decline',
      details: 'Order Details',
      insurance: 'Insurance Included',
      away: 'away',
      noOrders: 'No new orders',
      loading: 'Loading...',
      pending: 'Pending',
      accepted: 'Accepted',
      inProgress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      totalIncome: 'Total Income',
      thisWeek: 'This Week',
      views: 'Views',
      retry: 'Retry',
      useDemo: 'Use Demo Data',
    }
  }[lang];

  // Calculate stats
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const acceptedOrders = orders.filter(o => o.status === 'MATCHED' || o.status === 'CONFIRMED');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const totalIncome = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

  // Mock chart data (in real app, would come from API)
  const chartData = [
    { name: lang === 'zh' ? '一' : 'M', income: Math.random() * 500 + 200 },
    { name: lang === 'zh' ? '二' : 'T', income: Math.random() * 500 + 200 },
    { name: lang === 'zh' ? '三' : 'W', income: Math.random() * 500 + 200 },
    { name: lang === 'zh' ? '四' : 'T', income: Math.random() * 500 + 200 },
    { name: lang === 'zh' ? '五' : 'F', income: Math.random() * 500 + 200 },
    { name: lang === 'zh' ? '六' : 'S', income: Math.random() * 500 + 200 },
    { name: lang === 'zh' ? '日' : 'S', income: Math.random() * 500 + 200 },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { zh: string; en: string; color: string }> = {
      PENDING: { zh: '待接单', en: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      MATCHED: { zh: '已匹配', en: 'Matched', color: 'bg-blue-100 text-blue-800' },
      CONFIRMED: { zh: '已确认', en: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { zh: '进行中', en: 'In Progress', color: 'bg-purple-100 text-purple-800' },
      COMPLETED: { zh: '已完成', en: 'Completed', color: 'bg-green-100 text-green-800' },
      CANCELLED: { zh: '已取消', en: 'Cancelled', color: 'bg-red-100 text-red-800' },
    };
    const s = statusMap[status] || { zh: status, en: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.color}`}>
        {lang === 'zh' ? s.zh : s.en}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500 mb-2" />
        <span className="text-slate-500">{t.loading}</span>
        <span className="text-xs text-slate-400 mt-2">{lang === 'zh' ? '加载时间较长？点击取消' : 'Taking too long? Click to cancel'}</span>
        <button
          onClick={() => {
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }
            setUseMockData(true);
            setOrders(MOCK_ORDERS);
            setLoading(false);
            setError('已切换到演示数据模式');
          }}
          className="mt-3 px-4 py-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          {t.useDemo}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* 错误提示 */}
      {error && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">{error}</span>
          </div>
          <button
            onClick={loadOrders}
            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            <RefreshCw className="h-3 w-3" />
            {t.retry}
          </button>
        </div>
      )}

      {/* Stats as Pinned Tweet */}
      <div className="border-b border-slate-100 p-4 hover:bg-slate-50 cursor-pointer transition-colors">
        <div className="flex gap-1 mb-1 text-xs font-bold text-slate-500 items-center ml-12">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current mr-1"><g><path d="M7 4.5C7 3.12 8.12 2 9.5 2h5C15.88 2 17 3.12 17 4.5v15c0 1.38-1.12 2.5-2.5 2.5h-5C8.12 22 7 20.88 7 19.5v-15zM9.5 4c-.28 0-.5.22-.5.5v15c0 .28.22.5.5.5h5c.28 0 .5-.22.5-.5v-15c0-.28-.22-.5-.5-.5h-5z"></path></g></svg>
          {t.pinnedStats}
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <img src="https://picsum.photos/120/120" alt="Profile" className="w-10 h-10 rounded-full" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-900">{lang === 'zh' ? '我的收入' : 'My Income'}</span>
              <span className="text-slate-500 text-sm">@escort · {t.thisWeek}</span>
            </div>
            <div className="mt-1 text-slate-900">
              <span className="font-bold text-2xl text-teal-600">¥{totalIncome.toFixed(0)}</span>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 p-2 bg-slate-50 h-40 w-full max-w-md">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} cursor={{fill: '#e2e8f0'}} />
                  <Bar dataKey="income" fill="#0d9488" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-slate-500 max-w-md">
              <div className="flex items-center gap-1 text-sm"><span className="font-bold text-slate-900">{pendingOrders.length}</span> {t.pending}</div>
              <div className="flex items-center gap-1 text-sm"><span className="font-bold text-slate-900">{acceptedOrders.length}</span> {t.accepted}</div>
              <div className="flex items-center gap-1 text-sm"><span className="font-bold text-slate-900">{completedOrders.length}</span> {t.completed}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Feed */}
      <div className="divide-y divide-slate-100">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {t.noOrders}
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {order.patient?.name?.charAt(0) || 'P'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.orderReq}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <span className="text-slate-500 text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-1 text-slate-900">
                    <span className="font-bold text-teal-600">¥{order.price}</span>
                    {order.hospital?.name && (
                      <> {lang === 'zh' ? '订单在' : 'order at'} <span className="font-bold">{order.hospital.name}</span></>
                    )}
                  </div>

                  {order.notes && (
                    <div className="mt-2 text-sm text-slate-600">
                      {order.notes}
                    </div>
                  )}

                  {order.status === 'PENDING' && (
                    <div className="mt-3 flex gap-4">
                      <button
                        className="flex-1 bg-black text-white font-bold py-2 rounded-full hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                        onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order.id); }}
                        disabled={processingOrder === order.id}
                      >
                        {processingOrder === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {t.accept}
                      </button>
                      <button
                        className="flex-1 border border-slate-300 text-slate-700 font-bold py-2 rounded-full hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                        onClick={(e) => { e.stopPropagation(); handleDeclineOrder(order.id); }}
                        disabled={processingOrder === order.id}
                      >
                        <X className="h-4 w-4" />
                        {t.decline}
                      </button>
                    </div>
                  )}

                  {order.status === 'IN_PROGRESS' && (
                    <div className="mt-3 flex gap-4">
                      <button
                        className="flex-1 bg-teal-500 text-white font-bold py-2 rounded-full hover:bg-teal-600 transition-colors flex items-center justify-center gap-1"
                        onClick={(e) => { e.stopPropagation(); confirmComplete(order.id); }}
                        disabled={processingOrder === order.id}
                      >
                        {processingOrder === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {lang === 'zh' ? '完成服务' : 'Complete Service'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === 'zh' ? '确认完成服务' : 'Confirm Service Completion'}
              </h3>
              <p className="text-slate-600 mb-6">
                {lang === 'zh'
                  ? '确定要完成此订单的服务吗？完成后订单将标记为已完成。'
                  : 'Are you sure you want to complete this order? The order will be marked as completed.'}
              </p>
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-full hover:bg-slate-200 transition-colors"
                  onClick={() => {
                    setShowCompleteConfirm(false);
                    setCompletingOrderId(null);
                  }}
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-teal-500 text-white font-bold rounded-full hover:bg-teal-600 transition-colors"
                  onClick={handleCompleteOrder}
                >
                  {lang === 'zh' ? '确认完成' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-in">
          <Check className="h-5 w-5" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}
    </div>
  );
};
