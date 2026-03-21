import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Clock, DollarSign, MapPin, Tag, ClipboardList } from 'lucide-react';
import { Language } from '../types';
import { apiService } from '../services/apiService';

interface ServicePublishModalProps {
  lang: Language;
  onClose: () => void;
  onSuccess: () => void;
}

type ServiceType = 'FULL_PROCESS' | 'APPOINTMENT' | 'REPORT_PICKUP' | 'VIP_TRANSPORT';

interface TimeSlot {
  start: string;
  end: string;
}

const SERVICE_TYPES: { type: ServiceType; label: string; icon: typeof ClipboardList }[] = [
  { type: 'FULL_PROCESS', label: '全程陪诊', icon: ClipboardList },
  { type: 'APPOINTMENT', label: '代约挂号', icon: Calendar },
  { type: 'REPORT_PICKUP', label: '代取报告', icon: ClipboardList },
  { type: 'VIP_TRANSPORT', label: '专车接送', icon: MapPin },
];

const WEEKDAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
];

export const ServicePublishModal: React.FC<ServicePublishModalProps> = ({ lang, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [serviceType, setServiceType] = useState<ServiceType>('FULL_PROCESS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerHour, setPricePerHour] = useState('100');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availableWeekdays, setAvailableWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ start: '09:00', end: '12:00' }]);
  const [areas, setAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [maxDailyOrders, setMaxDailyOrders] = useState('3');

  const t = {
    zh: {
      title: '发布服务',
      step1: '选择服务类型',
      step2: '设置基本信息',
      step3: '设置时间',
      step4: '其他信息',
      serviceType: '服务类型',
      serviceTitle: '服务标题',
      description: '服务描述',
      pricePerHour: '每小时价格',
      dateRange: '服务日期范围',
      startDate: '开始日期',
      endDate: '结束日期',
      weekdays: '可预约星期',
      timeSlots: '可预约时段',
      addSlot: '添加时段',
      removeSlot: '删除',
      areas: '服务区域',
      addArea: '添加区域',
      tags: '专长标签',
      addTag: '添加标签',
      maxDailyOrders: '每日最大接单数',
      next: '下一步',
      prev: '上一步',
      submit: '发布服务',
      cancel: '取消',
      required: '必填',
      optional: '选填',
    },
    en: {
      title: 'Publish Service',
      step1: 'Select Service Type',
      step2: 'Basic Information',
      step3: 'Set Schedule',
      step4: 'Additional Info',
      serviceType: 'Service Type',
      serviceTitle: 'Service Title',
      description: 'Description',
      pricePerHour: 'Price per Hour',
      dateRange: 'Service Date Range',
      startDate: 'Start Date',
      endDate: 'End Date',
      weekdays: 'Available Weekdays',
      timeSlots: 'Available Time Slots',
      addSlot: 'Add Slot',
      removeSlot: 'Remove',
      areas: 'Service Areas',
      addArea: 'Add Area',
      tags: 'Specialty Tags',
      addTag: 'Add Tag',
      maxDailyOrders: 'Max Daily Orders',
      next: 'Next',
      prev: 'Previous',
      submit: 'Publish Service',
      cancel: 'Cancel',
      required: 'Required',
      optional: 'Optional',
    },
  }[lang];

  const handleWeekdayToggle = (day: number) => {
    setAvailableWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleAddTimeSlot = () => {
    setTimeSlots(prev => [...prev, { start: '14:00', end: '17:00' }]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    setTimeSlots(prev =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleAddArea = () => {
    if (areaInput.trim() && !areas.includes(areaInput.trim())) {
      setAreas(prev => [...prev, areaInput.trim()]);
      setAreaInput('');
    }
  };

  const handleRemoveArea = (area: string) => {
    setAreas(prev => prev.filter(a => a !== area));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiService.createEscortService({
        serviceType,
        title: title || undefined,
        description: description || undefined,
        pricePerHour: parseFloat(pricePerHour),
        startDate,
        endDate,
        availableWeekdays,
        timeSlots,
        areas: areas.length > 0 ? areas : undefined,
        tags: tags.length > 0 ? tags : undefined,
        maxDailyOrders: parseInt(maxDailyOrders),
      });

      onSuccess();
    } catch (err) {
      setError(lang === 'zh' ? '发布失败，请重试' : 'Failed to publish service');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.serviceType}</h3>
      <div className="grid grid-cols-2 gap-3">
        {SERVICE_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setServiceType(type)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              serviceType === type
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-teal-300'
            }`}
          >
            <Icon className={`h-6 w-6 mb-2 ${serviceType === type ? 'text-teal-600' : 'text-slate-400'}`} />
            <span className={`font-medium ${serviceType === type ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t.serviceTitle} <span className="text-slate-400">({t.optional})</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === 'zh' ? '例如：专业全程陪诊服务' : 'e.g., Professional Full Escort Service'}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t.description} <span className="text-slate-400">({t.optional})</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={lang === 'zh' ? '描述您的服务特色...' : 'Describe your service features...'}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t.pricePerHour} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="number"
            min="1"
            max="1000"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t.startDate} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t.endDate} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t.weekdays} <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleWeekdayToggle(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                availableWeekdays.includes(value)
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t.timeSlots} <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <input
                type="time"
                value={slot.start}
                onChange={(e) => handleUpdateTimeSlot(index, 'start', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-slate-500">-</span>
              <input
                type="time"
                value={slot.end}
                onChange={(e) => handleUpdateTimeSlot(index, 'end', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              {timeSlots.length > 1 && (
                <button
                  onClick={() => handleRemoveTimeSlot(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddTimeSlot}
            className="flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t.addSlot}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t.areas} <span className="text-slate-400">({t.optional})</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={areaInput}
            onChange={(e) => setAreaInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArea())}
            placeholder={lang === 'zh' ? '输入区域后按回车' : 'Enter area and press Enter'}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <button
            onClick={handleAddArea}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            {t.addArea}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm"
            >
              {area}
              <button onClick={() => handleRemoveArea(area)} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t.tags} <span className="text-slate-400">({t.optional})</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder={lang === 'zh' ? '例如：儿科、细心' : 'e.g., Pediatrics, Careful'}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            {t.addTag}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full text-sm"
            >
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t.maxDailyOrders}
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={maxDailyOrders}
          onChange={(e) => setMaxDailyOrders(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>
    </div>
  );

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 px-6 py-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s === step
                  ? 'bg-teal-600 text-white'
                  : s < step
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          {steps[step - 1]()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
          >
            {step === 1 ? t.cancel : t.prev}
          </button>
          <button
            onClick={step === 4 ? handleSubmit : () => setStep(step + 1)}
            disabled={loading}
            className="px-6 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {lang === 'zh' ? '发布中...' : 'Publishing...'}
              </span>
            ) : step === 4 ? (
              t.submit
            ) : (
              t.next
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
