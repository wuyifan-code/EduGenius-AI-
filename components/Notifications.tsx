import React, { useState, useEffect, useRef } from 'react';
import { Language, UserInfo } from '../types';
import { apiService } from '../services/apiService';
import { Settings, Bell, CheckCircle, Clock, CreditCard, MessageCircle, Trash2, Loader2, Check, X, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';

interface NotificationsProps {
  lang: Language;
  user?: UserInfo | null;
  onNavigate?: (type: string, id: string) => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  is_read?: boolean;
  data?: any;
  createdAt: string;
  created_at?: string;
}

// 通知类型映射
const NOTIFICATION_TYPES = {
  ORDER: 'order',
  ORDER_STATUS: 'order',
  PAYMENT: 'payment',
  MESSAGE: 'message',
  SYSTEM: 'system',
  REVIEW: 'review',
  REFUND: 'refund',
};

// Mock 通知数据
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    type: 'ORDER_STATUS',
    title: '订单状态更新',
    content: '您的订单 #ORD20240320001 已完成服务，请对陪诊师进行评价',
    isRead: false,
    data: { orderId: 'order-001', orderNo: 'ORD20240320001' },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2小时前
  },
  {
    id: 'notif-002',
    type: 'PAYMENT',
    title: '支付成功',
    content: '您已成功支付订单 #ORD20240318002，金额 ¥280',
    isRead: true,
    data: { orderId: 'order-002', orderNo: 'ORD20240318002', amount: 280 },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1天前
  },
  {
    id: 'notif-003',
    type: 'MESSAGE',
    title: '新消息',
    content: '王医生给您发送了一条消息："明天上午9点在医院门口见"',
    isRead: false,
    data: { messageId: 'msg-001', senderId: 'escort-001', senderName: '王医生' },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30分钟前
  },
  {
    id: 'notif-004',
    type: 'SYSTEM',
    title: '系统公告',
    content: 'MediMate 医伴平台全新升级，新增在线支付功能，欢迎使用！',
    isRead: true,
    data: { type: 'system_announcement' },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3天前
  },
  {
    id: 'notif-005',
    type: 'REFUND',
    title: '退款申请已通过',
    content: '您的订单 #ORD20240315001 退款申请已通过，款项将原路退回',
    isRead: false,
    data: { orderId: 'order-003', orderNo: 'ORD20240315001', status: 'APPROVED' },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5小时前
  }
];

// Pull to refresh hook
const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff * 0.5, 80));
    }
  };

  const handleTouchEnd = async () => {
    isDragging.current = false;
    if (pullDistance > 60) {
      setIsRefreshing(true);
      setPullDistance(0);
      await onRefresh();
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
    }
  };

  return { isRefreshing, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd };
};

export const Notifications: React.FC<NotificationsProps> = ({ lang, user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshData = async () => {
    await loadNotifications();
  };

  const { isRefreshing, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(refreshData);

  useEffect(() => {
    loadNotifications();
    
    // 清理超时定时器
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      setClickedId(notification.id);
      
      // 支持 isRead 和 is_read 两种格式
      const isRead = notification.isRead ?? notification.is_read;
      if (!isRead) {
        await apiService.markNotificationAsRead(notification.id);
        // 更新本地状态
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true, is_read: true } : n
        ));
      }
      
      let navigateType = '';
      let navigateId = '';
      
      // 使用映射后的类型
      const mappedType = NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES] || notification.type.toLowerCase();
      
      switch (mappedType) {
        case 'order':
          navigateType = 'order';
          navigateId = notification.data?.orderId || notification.id;
          break;
        case 'payment':
          navigateType = 'payment';
          navigateId = notification.data?.orderId || notification.id;
          break;
        case 'refund':
          navigateType = 'refund';
          navigateId = notification.data?.orderId || notification.id;
          break;
        case 'message':
          navigateType = 'chat';
          navigateId = notification.data?.senderId || notification.data?.userId || notification.data?.chatId || notification.id;
          break;
        case 'review':
          navigateType = 'review';
          navigateId = notification.data?.orderId || notification.id;
          break;
        case 'system':
          navigateType = 'system';
          navigateId = notification.id;
          break;
        default:
          navigateType = mappedType;
          navigateId = notification.data?.orderId || notification.data?.id || notification.id;
      }
      
      if (onNavigate) {
        onNavigate(navigateType, navigateId);
      }
      
      setTimeout(() => {
        setClickedId(null);
      }, 200);
      
    } catch (error) {
      console.error('Failed to handle notification click:', error);
      setClickedId(null);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      setUseMockData(false);

      // 设置 5 秒超时
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('Notifications loading timeout, switching to mock data');
        setUseMockData(true);
        setNotifications(MOCK_NOTIFICATIONS);
        setLoading(false);
        setError('数据加载超时，已显示演示数据');
      }, 5000);

      const data = await apiService.getNotifications(1, 50, activeTab === 'unread');
      
      // 清除超时定时器
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // 处理 API 返回的数据结构
      const notifications = data?.notifications || data?.data?.notifications || [];
      
      if (notifications.length > 0) {
        // 标准化通知数据格式
        const normalizedNotifications = notifications.map((n: any) => ({
          ...n,
          isRead: n.isRead ?? n.is_read ?? false,
          createdAt: n.createdAt || n.created_at || new Date().toISOString(),
        }));
        setNotifications(normalizedNotifications);
      } else {
        // API 返回空数据，使用 Mock 数据
        setUseMockData(true);
        setNotifications(MOCK_NOTIFICATIONS);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // 出错时使用 Mock 数据
      setUseMockData(true);
      setNotifications(MOCK_NOTIFICATIONS);
      setError('无法连接到服务器，已显示演示数据');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setProcessing(id);
      await apiService.markNotificationAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setProcessing('all');
      await apiService.markAllNotificationsAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setProcessing(id);
      await apiService.deleteNotification(id);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getIcon = (type: string) => {
    const mappedType = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES] || type.toLowerCase();
    const iconMap: Record<string, any> = {
      order: Bell,
      payment: CreditCard,
      refund: RefreshCw,
      message: MessageCircle,
      review: CheckCircle,
      system: Settings,
    };
    return iconMap[mappedType] || Bell;
  };

  const getColor = (type: string) => {
    const mappedType = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES] || type.toLowerCase();
    const colorMap: Record<string, string> = {
      order: 'text-teal-500',
      payment: 'text-blue-500',
      refund: 'text-orange-500',
      message: 'text-purple-500',
      review: 'text-yellow-500',
      system: 'text-slate-500',
    };
    return colorMap[mappedType] || 'text-slate-500';
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return lang === 'zh' ? '刚刚' : 'Just now';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return lang === 'zh' ? '刚刚' : 'Just now';
    if (minutes < 60) return lang === 'zh' ? `${minutes}分钟前` : `${minutes}m ago`;
    if (hours < 24) return lang === 'zh' ? `${hours}小时前` : `${hours}h ago`;
    if (days < 7) return lang === 'zh' ? `${days}天前` : `${days}d ago`;
    return date.toLocaleDateString();
  };

  const t = {
    zh: {
      title: '消息通知',
      all: '全部',
      unread: '未读',
      noNotifications: '暂无通知',
      markAllRead: '全部已读',
      loading: '加载中...',
      retry: '重试',
      useDemo: '使用演示数据',
    },
    en: {
      title: 'Notifications',
      all: 'All',
      unread: 'Unread',
      noNotifications: 'No notifications',
      markAllRead: 'Mark all read',
      loading: 'Loading...',
      retry: 'Retry',
      useDemo: 'Use Demo Data',
    }
  }[lang];

  const unreadCount = notifications.filter(n => !(n.isRead ?? n.is_read)).length;

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
            setNotifications(MOCK_NOTIFICATIONS);
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
    <div
      className="pb-20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-transform duration-200 bg-white"
        style={{ transform: `translateY(${pullDistance}px)`, height: pullDistance > 0 ? '60px' : '0' }}
      >
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        ) : (
          <RefreshCw className="h-6 w-6 text-slate-400" style={{ opacity: pullDistance / 60 }} />
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">{error}</span>
          </div>
          <button
            onClick={loadNotifications}
            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            <RefreshCw className="h-3 w-3" />
            {t.retry}
          </button>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-xl font-bold text-slate-900">{t.title}</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={processing === 'all'}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              {processing === 'all' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {t.markAllRead}
            </button>
          )}
        </div>
        <div className="flex">
          <div
            className="flex-1 flex justify-center hover:bg-slate-50 cursor-pointer transition-colors relative py-3"
            onClick={() => setActiveTab('all')}
          >
            <span className={`font-bold text-sm ${activeTab === 'all' ? 'text-slate-900' : 'text-slate-500'}`}>
              {t.all}
            </span>
            {activeTab === 'all' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-teal-500 rounded-full"></div>}
          </div>
          <div
            className="flex-1 flex justify-center hover:bg-slate-50 cursor-pointer transition-colors relative py-3"
            onClick={() => setActiveTab('unread')}
          >
            <span className={`font-bold text-sm ${activeTab === 'unread' ? 'text-slate-900' : 'text-slate-500'}`}>
              {t.unread} {unreadCount > 0 && `(${unreadCount})`}
            </span>
            {activeTab === 'unread' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-teal-500 rounded-full"></div>}
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {t.noNotifications}
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const colorClass = getColor(notification.type);
            const isClicked = clickedId === notification.id;
            const isRead = notification.isRead ?? notification.is_read;
            const createdAt = notification.createdAt || notification.created_at;

            return (
              <div
                key={notification.id}
                className={`p-4 cursor-pointer transition-all duration-200 flex gap-3 ${isClicked ? 'bg-teal-50 scale-[0.98]' : 'hover:bg-slate-50'} ${!isRead ? 'bg-blue-50/50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 w-8 flex justify-end">
                  <Icon className={`h-7 w-7 ${colorClass} fill-current`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      {!isRead && (
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      )}
                      <span className="font-bold text-slate-900">{notification.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`transition-opacity duration-200 ${isClicked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <ArrowRight className="h-4 w-4 text-teal-600" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        disabled={processing === notification.id}
                        className="text-slate-400 hover:text-red-500"
                      >
                        {processing === notification.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-slate-900 text-[15px]">
                    <div className="text-slate-600 mt-1">{notification.content}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-slate-400 text-sm">{formatTime(createdAt)}</div>
                      <div className={`flex items-center gap-1 text-teal-600 text-sm transition-opacity duration-200 ${isClicked ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="text-xs font-medium">查看详情</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
