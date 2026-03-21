import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Pause, Play, Calendar, Clock, DollarSign, MapPin, Tag, ClipboardList, AlertCircle } from 'lucide-react';
import { Language, ServiceType } from '../types';
import { apiService } from '../services/apiService';

interface EscortServiceListProps {
  lang: Language;
  onEdit: (service: any) => void;
}

interface EscortService {
  id: string;
  serviceType: ServiceType;
  title?: string;
  description?: string;
  pricePerHour: number;
  startDate: string;
  endDate: string;
  availableWeekdays: number[];
  timeSlots: { start: string; end: string }[];
  areas?: string[];
  tags?: string[];
  maxDailyOrders?: number;
  isActive: boolean;
  bookingCount?: number;
  createdAt: string;
  updatedAt: string;
}

const SERVICE_TYPE_LABELS: Record<ServiceType, { zh: string; en: string; icon: typeof ClipboardList }> = {
  FULL_PROCESS: { zh: '全程陪诊', en: 'Full Process', icon: ClipboardList },
  APPOINTMENT: { zh: '代约挂号', en: 'Appointment', icon: Calendar },
  REPORT_PICKUP: { zh: '代取报告', en: 'Report Pickup', icon: ClipboardList },
  VIP_TRANSPORT: { zh: '专车接送', en: 'VIP Transport', icon: MapPin },
};

const WEEKDAY_LABELS: Record<number, { zh: string; en: string }> = {
  1: { zh: '一', en: 'Mon' },
  2: { zh: '二', en: 'Tue' },
  3: { zh: '三', en: 'Wed' },
  4: { zh: '四', en: 'Thu' },
  5: { zh: '五', en: 'Fri' },
  6: { zh: '六', en: 'Sat' },
  7: { zh: '日', en: 'Sun' },
};

export const EscortServiceList: React.FC<EscortServiceListProps> = ({ lang, onEdit }) => {
  const [services, setServices] = useState<EscortService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const t = {
    zh: {
      title: '我的服务',
      noServices: '暂无发布的服务',
      publishFirst: '点击上方按钮发布您的第一个服务',
      serviceType: '服务类型',
      price: '价格',
      dateRange: '服务时间',
      weekdays: '可预约',
      status: '状态',
      active: '进行中',
      paused: '已暂停',
      bookings: '预约数',
      edit: '编辑',
      pause: '暂停',
      resume: '恢复',
      delete: '删除',
      deleteConfirm: '确定要删除此服务吗？此操作不可撤销。',
      cancel: '取消',
      confirm: '确认',
      perHour: '/小时',
      to: '至',
      loading: '加载中...',
      loadError: '加载失败，请重试',
      retry: '重试',
    },
    en: {
      title: 'My Services',
      noServices: 'No services published yet',
      publishFirst: 'Click the button above to publish your first service',
      serviceType: 'Service Type',
      price: 'Price',
      dateRange: 'Service Period',
      weekdays: 'Available',
      status: 'Status',
      active: 'Active',
      paused: 'Paused',
      bookings: 'Bookings',
      edit: 'Edit',
      pause: 'Pause',
      resume: 'Resume',
      delete: 'Delete',
      deleteConfirm: 'Are you sure you want to delete this service? This action cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Confirm',
      perHour: '/hour',
      to: 'to',
      loading: 'Loading...',
      loadError: 'Failed to load, please retry',
      retry: 'Retry',
    },
  }[lang];

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMyEscortServices();
      setServices(data || []);
    } catch (err) {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggleStatus = async (serviceId: string) => {
    try {
      setActionLoading(serviceId);
      await apiService.toggleEscortServiceStatus(serviceId);
      setServices(prev =>
        prev.map(s =>
          s.id === serviceId ? { ...s, isActive: !s.isActive } : s
        )
      );
    } catch (err) {
      alert(lang === 'zh' ? '操作失败，请重试' : 'Operation failed, please retry');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      setActionLoading(serviceId);
      await apiService.deleteEscortService(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert(lang === 'zh' ? '删除失败，请重试' : 'Delete failed, please retry');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatWeekdays = (weekdays: number[]) => {
    if (weekdays.length === 7) {
      return lang === 'zh' ? '每天' : 'Daily';
    }
    if (weekdays.length === 5 && weekdays.every(d => d >= 1 && d <= 5)) {
      return lang === 'zh' ? '工作日' : 'Weekdays';
    }
    return weekdays
      .sort()
      .map(d => WEEKDAY_LABELS[d][lang])
      .join(lang === 'zh' ? '、' : ', ');
  };

  const formatTimeSlots = (slots: { start: string; end: string }[]) => {
    if (slots.length === 0) return '';
    if (slots.length === 1) {
      return `${slots[0].start}-${slots[0].end}`;
    }
    return `${slots.length} ${lang === 'zh' ? '个时段' : 'slots'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="w-5 h-5 border-2 border-slate-300 border-t-teal-500 rounded-full animate-spin" />
          <span>{t.loading}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
        <button
          onClick={fetchServices}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t.noServices}
        </h3>
        <p className="text-slate-500 dark:text-slate-400">{t.publishFirst}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t.title}</h2>
      
      {services.map((service) => {
        const serviceTypeInfo = SERVICE_TYPE_LABELS[service.serviceType];
        const ServiceIcon = serviceTypeInfo.icon;
        
        return (
          <div
            key={service.id}
            className={`bg-white dark:bg-slate-800 rounded-xl border-2 transition-all ${
              service.isActive
                ? 'border-slate-200 dark:border-slate-700'
                : 'border-slate-100 dark:border-slate-700/50 opacity-75'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  service.isActive
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  <ServiceIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {service.title || serviceTypeInfo[lang]}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {serviceTypeInfo[lang]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  service.isActive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                  {service.isActive ? t.active : t.paused}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              {/* Price */}
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  ¥{service.pricePerHour}
                </span>
                <span className="text-sm text-slate-500">{t.perHour}</span>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  {formatDate(service.startDate)} {t.to} {formatDate(service.endDate)}
                </span>
              </div>

              {/* Weekdays & Time */}
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{formatWeekdays(service.availableWeekdays)}</span>
                <span className="text-slate-300">|</span>
                <span>{formatTimeSlots(service.timeSlots)}</span>
              </div>

              {/* Areas */}
              {service.areas && service.areas.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {service.areas.map(area => (
                      <span
                        key={area}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {service.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Count */}
              {service.bookingCount !== undefined && service.bookingCount > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {t.bookings}: <span className="font-medium text-slate-700 dark:text-slate-300">{service.bookingCount}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 rounded-b-xl">
              <button
                onClick={() => onEdit(service)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                {t.edit}
              </button>
              
              <button
                onClick={() => handleToggleStatus(service.id)}
                disabled={actionLoading === service.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  service.isActive
                    ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
              >
                {actionLoading === service.id ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : service.isActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {service.isActive ? t.pause : t.resume}
              </button>
              
              <button
                onClick={() => setDeleteConfirmId(service.id)}
                disabled={actionLoading === service.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t.delete}
              </button>
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {lang === 'zh' ? '确认删除' : 'Confirm Delete'}
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {t.deleteConfirm}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={actionLoading === deleteConfirmId}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === deleteConfirmId ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {lang === 'zh' ? '删除中...' : 'Deleting...'}
                  </span>
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
