import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { Language } from '../types';
import {
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
} from 'lucide-react';

interface OrderListProps {
  lang: Language;
  onOrderClick: (orderId: string) => void;
  userRole?: 'PATIENT' | 'ESCORT';
}

interface Order {
  id: string;
  orderNo: string;
  status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REFUNDING' | 'REFUNDED';
  serviceType: string;
  hospital?: {
    name: string;
  };
  appointmentDate?: string;
  appointmentTime?: string;
  duration: number;
  totalAmount: number;
  createdAt: string;
  patient?: {
    id: string;
    name: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  escort?: {
    id: string;
    name: string;
    profile?: {
      avatarUrl?: string;
    };
    escortProfile?: {
      rating?: number;
    };
  };
}

const statusConfig = {
  PENDING: { color: 'bg-amber-100 text-amber-700', label: { zh: '待支付', en: 'Pending' } },
  PAID: { color: 'bg-blue-100 text-blue-700', label: { zh: '已支付', en: 'Paid' } },
  CONFIRMED: { color: 'bg-teal-100 text-teal-700', label: { zh: '已确认', en: 'Confirmed' } },
  IN_PROGRESS: { color: 'bg-purple-100 text-purple-700', label: { zh: '服务中', en: 'In Progress' } },
  COMPLETED: { color: 'bg-green-100 text-green-700', label: { zh: '已完成', en: 'Completed' } },
  CANCELLED: { color: 'bg-slate-100 text-slate-700', label: { zh: '已取消', en: 'Cancelled' } },
  REFUNDING: { color: 'bg-orange-100 text-orange-700', label: { zh: '退款中', en: 'Refunding' } },
  REFUNDED: { color: 'bg-gray-100 text-gray-700', label: { zh: '已退款', en: 'Refunded' } },
};

const statusFilters = [
  { key: 'ALL', label: { zh: '全部', en: 'All' } },
  { key: 'PENDING', label: { zh: '待支付', en: 'Pending' } },
  { key: 'PAID', label: { zh: '已支付', en: 'Paid' } },
  { key: 'CONFIRMED', label: { zh: '已确认', en: 'Confirmed' } },
  { key: 'IN_PROGRESS', label: { zh: '服务中', en: 'In Progress' } },
  { key: 'COMPLETED', label: { zh: '已完成', en: 'Completed' } },
  { key: 'CANCELLED', label: { zh: '已取消', en: 'Cancelled' } },
];

export const OrderList: React.FC<OrderListProps> = ({
  lang,
  onOrderClick,
  userRole: propUserRole,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userRole, setUserRole] = useState<'PATIENT' | 'ESCORT'>('PATIENT');
  const [total, setTotal] = useState(0);

  const t = {
    zh: {
      title: '我的订单',
      searchPlaceholder: '搜索订单号、医院或陪诊师',
      noOrders: '暂无订单',
      noOrdersDesc: '您还没有任何订单，快去预约服务吧',
      loadMore: '加载更多',
      loading: '加载中...',
      error: '加载失败',
      retry: '重试',
      orderNo: '订单号',
      serviceType: '服务类型',
      totalAmount: '实付金额',
      orderTime: '下单时间',
      all: '全部',
      pending: '待支付',
      paid: '已支付',
      confirmed: '已确认',
      inProgress: '服务中',
      completed: '已完成',
      cancelled: '已取消',
    },
    en: {
      title: 'My Orders',
      searchPlaceholder: 'Search order number, hospital or escort',
      noOrders: 'No Orders',
      noOrdersDesc: 'You have no orders yet. Book a service now!',
      loadMore: 'Load More',
      loading: 'Loading...',
      error: 'Failed to load',
      retry: 'Retry',
      orderNo: 'Order No.',
      serviceType: 'Service Type',
      totalAmount: 'Total Amount',
      orderTime: 'Order Time',
      all: 'All',
      pending: 'Pending',
      paid: 'Paid',
      confirmed: 'Confirmed',
      inProgress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
  }[lang];

  useEffect(() => {
    // 获取用户角色
    const user = apiService.getUser();
    if (user?.role === 'ESCORT') {
      setUserRole('ESCORT');
    } else if (propUserRole) {
      setUserRole(propUserRole);
    }
  }, [propUserRole]);

  const loadOrders = useCallback(async (reset = false) => {
    if (reset) {
      setPage(1);
      setOrders([]);
    }

    setLoading(true);
    setError('');

    try {
      const currentPage = reset ? 1 : page;
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (activeFilter !== 'ALL') {
        params.status = activeFilter;
      }

      const response = await apiService.getMyOrders(params);
      
      const newOrders = response.data || [];
      const totalCount = response.total || 0;
      
      setTotal(totalCount);
      
      if (reset) {
        setOrders(newOrders);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }
      
      setHasMore(newOrders.length === 10 && orders.length + newOrders.length < totalCount);
      
      if (reset) {
        setPage(2);
      } else {
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(lang === 'zh' ? '加载订单失败' : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, orders.length, lang]);

  useEffect(() => {
    loadOrders(true);
  }, [activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 搜索功能：过滤当前已加载的订单
    // 实际项目中应该调用后端搜索API
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, { zh: string; en: string }> = {
      FULL_PROCESS: { zh: '全程陪诊', en: 'Full Escort' },
      APPOINTMENT: { zh: '代约挂号', en: 'Appointment' },
      REPORT_PICKUP: { zh: '代取报告', en: 'Report Pickup' },
      VIP_TRANSPORT: { zh: '专车接送', en: 'VIP Transport' },
    };
    return labels[type]?.[lang] || type;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 过滤订单
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNo.toLowerCase().includes(query) ||
      order.hospital?.name?.toLowerCase().includes(query) ||
      order.escort?.name?.toLowerCase().includes(query) ||
      order.patient?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 头部 */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
        </div>

        {/* 搜索栏 */}
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </form>

        {/* 状态筛选 */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.key
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* 订单列表 */}
      <div className="p-4 space-y-3">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => loadOrders(true)}
              className="px-3 py-1 bg-red-100 rounded-full text-xs font-medium"
            >
              {t.retry}
            </button>
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500 mb-3" />
            <span className="text-slate-500">{t.loading}</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t.noOrders}</h3>
            <p className="text-slate-500 text-sm text-center">{t.noOrdersDesc}</p>
          </div>
        ) : (
          <>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => onOrderClick(order.id)}
                className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* 订单头部 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">{order.orderNo}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || ''}`}>
                    {statusConfig[order.status]?.label[lang] || order.status}
                  </span>
                </div>

                {/* 服务信息 */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-teal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {getServiceTypeLabel(order.serviceType)}
                    </h3>
                    {order.hospital && (
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.hospital.name}
                      </p>
                    )}
                    {order.appointmentDate && (
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(order.appointmentDate)} {order.appointmentTime}
                        {order.duration > 0 && ` · ${order.duration}${lang === 'zh' ? '小时' : 'h'}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* 人员信息 */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {userRole === 'PATIENT' ? (
                    // 患者视角：显示陪诊师信息
                    <div className="flex items-center gap-2">
                      {order.escort ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                            {order.escort.profile?.avatarUrl ? (
                              <img
                                src={order.escort.profile.avatarUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-full h-full p-1 text-slate-400" />
                            )}
                          </div>
                          <span className="text-sm text-slate-700">{order.escort.name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {lang === 'zh' ? '等待分配' : 'Waiting'}
                        </span>
                      )}
                    </div>
                  ) : (
                    // 陪诊师视角：显示患者信息
                    <div className="flex items-center gap-2">
                      {order.patient ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                            {order.patient.profile?.avatarUrl ? (
                              <img
                                src={order.patient.profile.avatarUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-full h-full p-1 text-slate-400" />
                            )}
                          </div>
                          <span className="text-sm text-slate-700">{order.patient.name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </div>
                  )}

                  {/* 金额 */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-teal-600">¥{order.totalAmount}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => loadOrders(false)}
                  disabled={loading}
                  className="px-6 py-2 bg-white text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.loading}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {t.loadMore}
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderList;
