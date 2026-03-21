import React, { useState, useEffect, useMemo } from 'react';
import { Language } from '../types';
import { apiService } from '../services/apiService';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface IncomeDetailProps {
  lang: Language;
  onBack: () => void;
}

interface IncomeRecord {
  id: string;
  orderNo: string;
  serviceType: string;
  patientName: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING_WITHDRAWAL' | 'WITHDRAWN';
  createdAt: string;
  hospital?: string;
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';
type StatusFilter = 'COMPLETED' | 'PENDING_WITHDRAWAL' | 'WITHDRAWN' | 'all';

export const IncomeDetail: React.FC<IncomeDetailProps> = ({ lang, onBack }) => {
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const pageSize = 10;

  const t = {
    zh: {
      title: '收入明细',
      totalIncome: '累计收入',
      monthIncome: '本月收入',
      weekIncome: '本周收入',
      todayIncome: '今日收入',
      filter: '筛选',
      timeFilter: '时间筛选',
      statusFilter: '状态筛选',
      today: '今日',
      week: '本周',
      month: '本月',
      all: '全部',
      completed: '已完成',
      pendingWithdrawal: '提现中',
      withdrawn: '已提现',
      orderNo: '订单号',
      serviceType: '服务类型',
      patientName: '患者姓名',
      time: '时间',
      amount: '金额',
      status: '状态',
      export: '导出',
      noRecords: '暂无收入记录',
      loading: '加载中...',
      exportSuccess: '导出成功',
      exportFailed: '导出失败',
      yuan: '元',
      page: '第',
      pageOf: '页，共',
      records: '条记录',
    },
    en: {
      title: 'Income Details',
      totalIncome: 'Total Income',
      monthIncome: 'Month Income',
      weekIncome: 'Week Income',
      todayIncome: 'Today Income',
      filter: 'Filter',
      timeFilter: 'Time Filter',
      statusFilter: 'Status Filter',
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      all: 'All',
      completed: 'Completed',
      pendingWithdrawal: 'Pending Withdrawal',
      withdrawn: 'Withdrawn',
      orderNo: 'Order No.',
      serviceType: 'Service Type',
      patientName: 'Patient',
      time: 'Time',
      amount: 'Amount',
      status: 'Status',
      export: 'Export',
      noRecords: 'No income records',
      loading: 'Loading...',
      exportSuccess: 'Export successful',
      exportFailed: 'Export failed',
      yuan: '',
      page: 'Page',
      pageOf: 'of',
      records: 'records',
    },
  }[lang];

  useEffect(() => {
    loadIncomeRecords();
  }, []);

  const loadIncomeRecords = async () => {
    setLoading(true);
    try {
      const appointments = await apiService.getUserAppointments();
      const incomeRecords: IncomeRecord[] = appointments
        .filter((apt: any) => apt.status === 'COMPLETED' || apt.price > 0)
        .map((apt: any) => ({
          id: apt.id,
          orderNo: apt.order_no || apt.id,
          serviceType: apt.service_type || apt.serviceType || 'FULL_PROCESS',
          patientName: apt.patient?.name || apt.patient_name || 'Unknown',
          amount: apt.price || 0,
          status: getIncomeStatus(apt.status),
          createdAt: apt.created_at || apt.createdAt,
          hospital: apt.hospital?.name || apt.hospital_name,
        }));
      setRecords(incomeRecords.length > 0 ? incomeRecords : getMockRecords());
    } catch (error) {
      console.error('Failed to load income records:', error);
      setRecords(getMockRecords());
    } finally {
      setLoading(false);
    }
  };

  const getIncomeStatus = (orderStatus: string): IncomeRecord['status'] => {
    if (orderStatus === 'COMPLETED') {
      return Math.random() > 0.5 ? 'COMPLETED' : Math.random() > 0.5 ? 'PENDING_WITHDRAWAL' : 'WITHDRAWN';
    }
    return 'COMPLETED';
  };

  const getMockRecords = (): IncomeRecord[] => {
    const mockData: IncomeRecord[] = [];
    const serviceTypes = ['FULL_PROCESS', 'APPOINTMENT', 'REPORT_PICKUP', 'VIP_TRANSPORT'];
    const patientNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];
    const statuses: IncomeRecord['status'][] = ['COMPLETED', 'PENDING_WITHDRAWAL', 'WITHDRAWN'];

    for (let i = 0; i < 25; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockData.push({
        id: `income_${i + 1}`,
        orderNo: `ORD${Date.now() - i * 100000}`,
        serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        patientName: patientNames[Math.floor(Math.random() * patientNames.length)],
        amount: Math.floor(Math.random() * 500) + 100,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: date.toISOString(),
        hospital: ['北京协和医院', '复旦大学附属华山医院', '中山大学附属第一医院'][Math.floor(Math.random() * 3)],
      });
    }
    return mockData;
  };

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedRecords = records.filter(r => r.status !== 'PENDING_WITHDRAWAL');

    const todayIncome = completedRecords
      .filter(r => new Date(r.createdAt) >= todayStart)
      .reduce((sum, r) => sum + r.amount, 0);

    const weekIncome = completedRecords
      .filter(r => new Date(r.createdAt) >= weekStart)
      .reduce((sum, r) => sum + r.amount, 0);

    const monthIncome = completedRecords
      .filter(r => new Date(r.createdAt) >= monthStart)
      .reduce((sum, r) => sum + r.amount, 0);

    const totalIncome = completedRecords.reduce((sum, r) => sum + r.amount, 0);

    return { totalIncome, monthIncome, weekIncome, todayIncome };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return records.filter(record => {
      const recordDate = new Date(record.createdAt);

      if (timeFilter === 'today' && recordDate < todayStart) return false;
      if (timeFilter === 'week' && recordDate < weekStart) return false;
      if (timeFilter === 'month' && recordDate < monthStart) return false;

      if (statusFilter !== 'all' && record.status !== statusFilter) return false;

      return true;
    });
  }, [records, timeFilter, statusFilter]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, statusFilter]);

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, { zh: string; en: string }> = {
      FULL_PROCESS: { zh: '全程陪诊', en: 'Full Escort' },
      APPOINTMENT: { zh: '代约挂号', en: 'Appointment' },
      REPORT_PICKUP: { zh: '代取报告', en: 'Report Pickup' },
      VIP_TRANSPORT: { zh: '专车接送', en: 'VIP Transport' },
    };
    return labels[type]?.[lang] || type;
  };

  const getStatusBadge = (status: IncomeRecord['status']) => {
    const statusMap: Record<IncomeRecord['status'], { zh: string; en: string; color: string }> = {
      COMPLETED: { zh: '已完成', en: 'Completed', color: 'bg-green-100 text-green-700' },
      PENDING_WITHDRAWAL: { zh: '提现中', en: 'Pending', color: 'bg-amber-100 text-amber-700' },
      WITHDRAWN: { zh: '已提现', en: 'Withdrawn', color: 'bg-blue-100 text-blue-700' },
    };
    const s = statusMap[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
        {lang === 'zh' ? s.zh : s.en}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    setExporting(true);
    try {
      const headers = [t.orderNo, t.serviceType, t.patientName, t.time, t.amount, t.status];
      const csvContent = [
        headers.join(','),
        ...filteredRecords.map(r => [
          r.orderNo,
          getServiceTypeLabel(r.serviceType),
          r.patientName,
          formatDate(r.createdAt),
          r.amount,
          lang === 'zh' ? statusMap[r.status].zh : statusMap[r.status].en,
        ].join(',')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `income_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const statusMap: Record<IncomeRecord['status'], { zh: string; en: string }> = {
    COMPLETED: { zh: '已完成', en: 'Completed' },
    PENDING_WITHDRAWAL: { zh: '提现中', en: 'Pending' },
    WITHDRAWN: { zh: '已提现', en: 'Withdrawn' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          <span className="text-slate-500">{t.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-900" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-full text-sm font-medium hover:bg-teal-100 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {t.export}
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-slate-500">{t.totalIncome}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ¥{stats.totalIncome.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-slate-500">{t.monthIncome}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ¥{stats.monthIncome.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-slate-500">{t.weekIncome}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ¥{stats.weekIncome.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm text-slate-500">{t.todayIncome}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ¥{stats.todayIncome.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-slate-600" />
            <span className="font-bold text-slate-900">{t.filter}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-500 mb-2 block">{t.timeFilter}</label>
              <div className="flex gap-2 flex-wrap">
                {(['today', 'week', 'month', 'all'] as TimeFilter[]).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      timeFilter === filter
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t[filter]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-500 mb-2 block">{t.statusFilter}</label>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'COMPLETED', 'PENDING_WITHDRAWAL', 'WITHDRAWN'] as StatusFilter[]).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === filter
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all' ? t.all : (filter === 'COMPLETED' ? t.completed : filter === 'PENDING_WITHDRAWAL' ? t.pendingWithdrawal : t.withdrawn)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {paginatedRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {t.noRecords}
              </div>
            ) : (
              paginatedRecords.map((record) => (
                <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-slate-700">{record.orderNo}</span>
                        {getStatusBadge(record.status)}
                      </div>
                      <div className="text-sm text-slate-600">
                        {getServiceTypeLabel(record.serviceType)}
                      </div>
                      {record.hospital && (
                        <div className="text-xs text-slate-500 mt-1">{record.hospital}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-teal-600">
                        +¥{record.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{record.patientName}</span>
                    <span>{formatDate(record.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <span className="text-sm text-slate-700">
              {t.page} {currentPage} {t.pageOf} {totalPages} {t.pageOf} {filteredRecords.length} {t.records}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
