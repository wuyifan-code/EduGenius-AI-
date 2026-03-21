import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Language } from '../types';
import {
  ArrowLeft,
  MessageCircle,
  XCircle,
  RotateCcw,
  Star,
  CheckCircle,
  Clock,
  Phone,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  MapPin,
  FileText,
  Play,
  CheckSquare,
} from 'lucide-react';

interface OrderDetailProps {
  orderId: string;
  lang: Language;
  onBack: () => void;
  onChat: (userId: string) => void;
  onReview: (orderId: string) => void;
}

interface Order {
  id: string;
  orderNo: string;
  status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REFUNDING' | 'REFUNDED';
  serviceType: string;
  hospital?: {
    name: string;
    address?: string;
  };
  department?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  duration: number;
  price: number;
  platformFee: number;
  couponDiscount?: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  patient: {
    id: string;
    name: string;
    phone?: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  escort?: {
    id: string;
    name: string;
    phone?: string;
    profile?: {
      avatarUrl?: string;
    };
    escortProfile?: {
      rating?: number;
    };
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
  };
  statusHistory?: Array<{
    status: string;
    note?: string;
    createdAt: string;
  }>;
}

const statusConfig = {
  PENDING: { color: 'bg-amber-100 text-amber-700', label: { zh: '待支付', en: 'Pending Payment' } },
  PAID: { color: 'bg-blue-100 text-blue-700', label: { zh: '已支付', en: 'Paid' } },
  CONFIRMED: { color: 'bg-teal-100 text-teal-700', label: { zh: '已确认', en: 'Confirmed' } },
  IN_PROGRESS: { color: 'bg-purple-100 text-purple-700', label: { zh: '服务中', en: 'In Progress' } },
  COMPLETED: { color: 'bg-green-100 text-green-700', label: { zh: '已完成', en: 'Completed' } },
  CANCELLED: { color: 'bg-slate-100 text-slate-700', label: { zh: '已取消', en: 'Cancelled' } },
  REFUNDING: { color: 'bg-orange-100 text-orange-700', label: { zh: '退款中', en: 'Refunding' } },
  REFUNDED: { color: 'bg-gray-100 text-gray-700', label: { zh: '已退款', en: 'Refunded' } },
};

const timelineSteps = [
  { key: 'PENDING', zh: '已下单', en: 'Ordered' },
  { key: 'PAID', zh: '已支付', en: 'Paid' },
  { key: 'CONFIRMED', zh: '已确认', en: 'Confirmed' },
  { key: 'IN_PROGRESS', zh: '服务中', en: 'In Progress' },
  { key: 'COMPLETED', zh: '已完成', en: 'Completed' },
];

export const OrderDetail: React.FC<OrderDetailProps> = ({
  orderId,
  lang,
  onBack,
  onChat,
  onReview,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [userRole, setUserRole] = useState<'PATIENT' | 'ESCORT'>('PATIENT');

  const t = {
    zh: {
      title: '订单详情',
      orderNo: '订单号',
      createdAt: '创建时间',
      serviceType: '服务类型',
      status: '订单状态',
      patientInfo: '患者信息',
      escortInfo: '陪诊师信息',
      serviceDetail: '服务详情',
      hospital: '医院',
      department: '科室',
      serviceDate: '服务日期',
      serviceTime: '服务时间',
      duration: '服务时长',
      durationUnit: '小时',
      price: '服务价格',
      platformFee: '平台费',
      couponDiscount: '优惠券抵扣',
      totalAmount: '实付金额',
      notes: '备注',
      chat: '联系陪诊师',
      cancel: '取消订单',
      refund: '申请退款',
      review: '立即评价',
      reorder: '重新下单',
      confirmCancel: '确定要取消此订单吗？取消后不可恢复。',
      confirmRefund: '确定要申请退款吗？退款将在3-5个工作日内退回原支付账户。',
      confirm: '确定',
      cancelAction: '取消',
      success: '操作成功',
      failed: '操作失败',
      noEscort: '等待分配陪诊师',
      phone: '电话',
      hours: '小时',
      minutes: '分钟',
      startService: '开始服务',
      completeService: '完成服务',
      acceptOrder: '接单',
      cancelReason: '取消原因',
      refundReason: '退款原因',
      optional: '选填',
      priceDetails: '价格明细',
    },
    en: {
      title: 'Order Details',
      orderNo: 'Order No.',
      createdAt: 'Created At',
      serviceType: 'Service Type',
      status: 'Status',
      patientInfo: 'Patient Info',
      escortInfo: 'Escort Info',
      serviceDetail: 'Service Details',
      hospital: 'Hospital',
      department: 'Department',
      serviceDate: 'Service Date',
      serviceTime: 'Service Time',
      duration: 'Duration',
      durationUnit: 'hours',
      price: 'Service Price',
      platformFee: 'Platform Fee',
      couponDiscount: 'Coupon Discount',
      totalAmount: 'Total Amount',
      notes: 'Notes',
      chat: 'Contact Escort',
      cancel: 'Cancel Order',
      refund: 'Request Refund',
      review: 'Write Review',
      reorder: 'Reorder',
      confirmCancel: 'Are you sure you want to cancel this order? This action cannot be undone.',
      confirmRefund: 'Are you sure you want to request a refund? Refund will be processed within 3-5 business days.',
      confirm: 'Confirm',
      cancelAction: 'Cancel',
      success: 'Operation successful',
      failed: 'Operation failed',
      noEscort: 'Waiting for escort assignment',
      phone: 'Phone',
      hours: 'hours',
      minutes: 'minutes',
      startService: 'Start Service',
      completeService: 'Complete Service',
      acceptOrder: 'Accept Order',
      cancelReason: 'Cancel Reason',
      refundReason: 'Refund Reason',
      optional: 'Optional',
      priceDetails: 'Price Details',
    },
  }[lang];

  useEffect(() => {
    loadOrderDetail();
    // 获取当前用户角色
    const user = apiService.getUser();
    if (user?.role === 'ESCORT') {
      setUserRole('ESCORT');
    }
  }, [orderId]);

  const loadOrderDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getOrderDetails(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order details:', err);
      setError(lang === 'zh' ? '加载订单详情失败' : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
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

  const getCurrentStepIndex = (status: string) => {
    // 对于已取消、退款中、已退款状态，不显示进度
    if (['CANCELLED', 'REFUNDING', 'REFUNDED'].includes(status)) {
      return -1;
    }
    return timelineSteps.findIndex((s) => s.key === status);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelOrder = async () => {
    setActionLoading('cancel');
    try {
      await apiService.cancelOrder(orderId, cancelReason);
      await loadOrderDetail();
      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError(lang === 'zh' ? '取消订单失败' : 'Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRefund = async () => {
    setActionLoading('refund');
    try {
      await apiService.requestRefund(orderId, order?.totalAmount || 0);
      await loadOrderDetail();
      setShowRefundConfirm(false);
    } catch (err) {
      console.error('Failed to request refund:', err);
      setError(lang === 'zh' ? '申请退款失败' : 'Failed to request refund');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptOrder = async () => {
    setActionLoading('accept');
    try {
      await apiService.acceptOrder(orderId);
      await loadOrderDetail();
    } catch (err) {
      console.error('Failed to accept order:', err);
      setError(lang === 'zh' ? '接单失败' : 'Failed to accept order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartService = async () => {
    setActionLoading('start');
    try {
      await apiService.startService(orderId);
      await loadOrderDetail();
    } catch (err) {
      console.error('Failed to start service:', err);
      setError(lang === 'zh' ? '开始服务失败' : 'Failed to start service');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteService = async () => {
    setActionLoading('complete');
    try {
      await apiService.completeService(orderId);
      await loadOrderDetail();
    } catch (err) {
      console.error('Failed to complete service:', err);
      setError(lang === 'zh' ? '完成服务失败' : 'Failed to complete service');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChat = () => {
    if (order?.escort?.id) {
      onChat(order.escort.id);
    }
  };

  const handleReview = () => {
    onReview(orderId);
  };

  const canShowAction = (action: string) => {
    if (!order) return false;
    
    // 患者操作
    if (userRole === 'PATIENT') {
      switch (action) {
        case 'cancel':
          return order.status === 'PENDING';
        case 'refund':
          return ['PAID', 'CONFIRMED'].includes(order.status);
        case 'review':
          return order.status === 'COMPLETED';
        case 'reorder':
          return ['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status);
        case 'chat':
          return !!order.escort && ['CONFIRMED', 'IN_PROGRESS'].includes(order.status);
        default:
          return false;
      }
    }
    
    // 陪诊师操作
    if (userRole === 'ESCORT') {
      switch (action) {
        case 'accept':
          return order.status === 'PENDING' && !order.escort;
        case 'start':
          return order.status === 'CONFIRMED' && order.escort?.id === order.escort?.id;
        case 'complete':
          return order.status === 'IN_PROGRESS';
        case 'chat':
          return !!order.patient;
        default:
          return false;
      }
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          <span className="text-slate-500">{lang === 'zh' ? '加载中...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-slate-700 mb-4">{error || (lang === 'zh' ? '订单不存在' : 'Order not found')}</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'zh' ? '返回' : 'Go Back'}
        </button>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(order.status);
  const showTimeline = currentStepIndex >= 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-900" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[order.status]?.color || ''}`}>
          {statusConfig[order.status]?.label[lang] || order.status}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* 订单基本信息 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">{t.serviceDetail}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{t.orderNo}</span>
              <span className="text-slate-900 font-mono text-sm">{order.orderNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{t.createdAt}</span>
              <span className="text-slate-900 text-sm">{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{t.serviceType}</span>
              <span className="text-slate-900 text-sm">{getServiceTypeLabel(order.serviceType)}</span>
            </div>
            {order.hospital && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">{t.hospital}</span>
                <span className="text-slate-900 text-sm">{order.hospital.name}</span>
              </div>
            )}
            {order.appointmentDate && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">{t.serviceDate}</span>
                <span className="text-slate-900 text-sm">{formatDate(order.appointmentDate)}</span>
              </div>
            )}
            {order.appointmentTime && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">{t.serviceTime}</span>
                <span className="text-slate-900 text-sm">{order.appointmentTime}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{t.duration}</span>
              <span className="text-slate-900 text-sm">
                {order.duration} {t.durationUnit}
              </span>
            </div>
          </div>
        </div>

        {/* 价格明细 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">{t.priceDetails}</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{t.price}</span>
              <span className="text-slate-900 text-sm">¥{order.price} × {order.duration}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{t.platformFee}</span>
              <span className="text-slate-900 text-sm">¥{order.platformFee}</span>
            </div>
            {order.couponDiscount && order.couponDiscount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">{t.couponDiscount}</span>
                <span className="text-green-600 text-sm">-¥{order.couponDiscount}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-slate-700 font-medium">{t.totalAmount}</span>
              <span className="text-xl font-bold text-teal-600">¥{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* 患者信息 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">{t.patientInfo}</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
              {order.patient.profile?.avatarUrl ? (
                <img src={order.patient.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-2 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{order.patient.name}</span>
              </div>
              {order.patient.phone && (
                <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                  <Phone className="h-3 w-3" />
                  {order.patient.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 陪诊师信息 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">{t.escortInfo}</h2>
          {order.escort ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                {order.escort.profile?.avatarUrl ? (
                  <img src={order.escort.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-2 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{order.escort.name}</span>
                  {order.escort.escortProfile?.rating && (
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs font-medium">{order.escort.escortProfile.rating}</span>
                    </div>
                  )}
                </div>
                {order.escort.phone && (
                  <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                    <Phone className="h-3 w-3" />
                    {order.escort.phone}
                  </div>
                )}
              </div>
              {canShowAction('chat') && (
                <button
                  onClick={handleChat}
                  className="p-2 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t.noEscort}</p>
            </div>
          )}
        </div>

        {/* 订单状态流程 */}
        {showTimeline && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">{t.status}</h2>
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200" />
              <div className="flex justify-between relative">
                {timelineSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-teal-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 text-center ${
                          isCurrent ? 'text-teal-600 font-medium' : 'text-slate-500'
                        }`}
                      >
                        {lang === 'zh' ? step.zh : step.en}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                {order.statusHistory.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">
                          {statusConfig[item.status as keyof typeof statusConfig]?.label[lang] || item.status}
                        </span>
                        <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
                      </div>
                      {item.note && <p className="text-sm text-slate-500 mt-0.5">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 备注 */}
        {order.notes && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-2">{t.notes}</h2>
            <p className="text-slate-600 text-sm">{order.notes}</p>
          </div>
        )}
      </div>

      {/* 底部操作按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4">
        <div className="flex gap-3">
          {/* 患者操作按钮 */}
          {userRole === 'PATIENT' && (
            <>
              {canShowAction('chat') && (
                <button
                  onClick={handleChat}
                  className="flex-1 px-4 py-3 bg-teal-50 text-teal-600 rounded-xl font-medium hover:bg-teal-100 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t.chat}
                </button>
              )}
              {canShowAction('cancel') && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="h-5 w-5" />
                  {t.cancel}
                </button>
              )}
              {canShowAction('refund') && (
                <button
                  onClick={() => setShowRefundConfirm(true)}
                  className="flex-1 px-4 py-3 bg-amber-50 text-amber-600 rounded-xl font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-5 w-5" />
                  {t.refund}
                </button>
              )}
              {canShowAction('review') && (
                <button
                  onClick={handleReview}
                  className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="h-5 w-5" />
                  {t.review}
                </button>
              )}
              {canShowAction('reorder') && (
                <button
                  onClick={onBack}
                  className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  {t.reorder}
                </button>
              )}
            </>
          )}

          {/* 陪诊师操作按钮 */}
          {userRole === 'ESCORT' && (
            <>
              {canShowAction('chat') && (
                <button
                  onClick={handleChat}
                  className="flex-1 px-4 py-3 bg-teal-50 text-teal-600 rounded-xl font-medium hover:bg-teal-100 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t.chat}
                </button>
              )}
              {canShowAction('accept') && (
                <button
                  onClick={handleAcceptOrder}
                  disabled={actionLoading === 'accept'}
                  className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === 'accept' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {t.acceptOrder}
                </button>
              )}
              {canShowAction('start') && (
                <button
                  onClick={handleStartService}
                  disabled={actionLoading === 'start'}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === 'start' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  {t.startService}
                </button>
              )}
              {canShowAction('complete') && (
                <button
                  onClick={handleCompleteService}
                  disabled={actionLoading === 'complete'}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === 'complete' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckSquare className="h-5 w-5" />
                  )}
                  {t.completeService}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 取消订单确认弹窗 */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.cancel}</h3>
            <p className="text-slate-600 mb-4">{t.confirmCancel}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.cancelReason}（{t.optional}）
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={2}
                placeholder={lang === 'zh' ? '请输入取消原因' : 'Enter cancel reason'}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-slate-700 font-medium hover:bg-slate-50"
              >
                {t.cancelAction}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading === 'cancel'}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t.confirm
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 退款确认弹窗 */}
      {showRefundConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.refund}</h3>
            <p className="text-slate-600 mb-4">{t.confirmRefund}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.refundReason}（{t.optional}）
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={2}
                placeholder={lang === 'zh' ? '请输入退款原因' : 'Enter refund reason'}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-slate-700 font-medium hover:bg-slate-50"
              >
                {t.cancelAction}
              </button>
              <button
                onClick={handleRequestRefund}
                disabled={actionLoading === 'refund'}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === 'refund' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t.confirm
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
