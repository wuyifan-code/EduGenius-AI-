import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Calendar } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string, time?: string) => void;
  minDate?: Date;
  selectedDate?: string;
  selectedTime?: string;
}

const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_ZH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  minDate = new Date(),
  selectedDate,
  selectedTime,
}) => {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setSelected(new Date(selectedDate));
      setStep('time');
    } else {
      setSelected(null);
      setStep('date');
    }
  }, [selectedDate, isOpen]);

  const weekdays = lang === 'zh' ? WEEKDAYS_ZH : WEEKDAYS_EN;
  const months = lang === 'zh' ? MONTHS_ZH : MONTHS_EN;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDisabled = (date: Date | null) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }
    return false;
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selected) return false;
    return date.toDateString() === selected.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isRangeStart = (date: Date | null) => {
    if (!date || !hoverDate) return false;
    const [start, end] = hoverDate < date ? [hoverDate, date] : [date, hoverDate];
    return date.toDateString() === start.toDateString();
  };

  const isRangeEnd = (date: Date | null) => {
    if (!date || !hoverDate) return false;
    const [start, end] = hoverDate < date ? [hoverDate, date] : [date, hoverDate];
    return date.toDateString() === end.toDateString() && !isSelected(date);
  };

  const isInRange = (date: Date | null) => {
    if (!date || !hoverDate || isSelected(date)) return false;
    const [start, end] = hoverDate < date ? [hoverDate, date] : [date, hoverDate];
    return isRangeStart(date) || isRangeEnd(date) || (hoverDate > date ? start < date : end > date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date | null) => {
    if (!date || isDisabled(date)) return;
    setSelected(date);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    if (selected) {
      onSelect(selected.toISOString().split('T')[0], time);
      onClose();
    }
  };

  const handleBack = () => {
    setStep('date');
  };

  if (!isOpen) return null;

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="relative">
          <div className={`bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white transition-all duration-300 ${step === 'time' ? 'h-24' : 'h-32'}`}>
            {step === 'date' ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                  <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors">
                    {lang === 'zh' ? 'EN' : '中文'}
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-1">
                    {selected ? selected.getDate() : '--'}
                  </div>
                  <div className="text-white/80">
                    {selected ? `${selected.getFullYear()}年${selected.getMonth() + 1}月` : lang === 'zh' ? '选择日期' : 'Select Date'}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <button onClick={handleBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center flex-1">
                  <div className="text-lg font-bold">
                    {selected?.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric' })}
                  </div>
                  <div className="text-sm text-white/80 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lang === 'zh' ? '选择时间' : 'Select Time'}
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="p-4">
            {step === 'date' ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft className="h-5 w-5 text-slate-600" />
                  </button>
                  <div className="font-bold text-slate-900">
                    {currentMonth.getFullYear()} {months[currentMonth.getMonth()]}
                  </div>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronRight className="h-5 w-5 text-slate-600" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekdays.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {days.map((date, idx) => (
                    <div
                      key={idx}
                      className="aspect-square flex items-center justify-center"
                      onMouseEnter={() => date && !isDisabled(date) && setHoverDate(date)}
                      onMouseLeave={() => setHoverDate(null)}
                    >
                      {date ? (
                        <button
                          onClick={() => handleDateClick(date)}
                          disabled={isDisabled(date)}
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                            ${isDisabled(date) ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'}
                            ${isSelected(date) ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/30' : ''}
                            ${isToday(date) && !isSelected(date) ? 'border-2 border-teal-500 text-teal-600' : ''}
                            ${isInRange(date) && !isSelected(date) ? 'bg-teal-100 text-teal-700' : ''}
                            ${isRangeStart(date) ? 'rounded-r-none' : ''}
                            ${isRangeEnd(date) ? 'rounded-l-none' : ''}
                          `}
                        >
                          {date.getDate()}
                        </button>
                      ) : (
                        <div className="w-10 h-10" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                  >
                    {lang === 'zh' ? '今天' : 'Today'}
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setCurrentMonth(tomorrow);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                  >
                    {lang === 'zh' ? '明天' : 'Tomorrow'}
                  </button>
                </div>
              </>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`
                        py-3 rounded-xl text-sm font-medium transition-all duration-200
                        ${selectedTime === time
                          ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }
                      `}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center text-sm text-slate-500">
                  {lang === 'zh' ? '选择就诊时间，方便陪诊师安排服务' : 'Select consultation time for scheduling'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
