import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Language } from '../types';

type RefundReason = 'escort_cancelled' | 'dissatisfied' | 'schedule_conflict' | 'other';

interface RefundModalProps {
  isOpen: boolean;
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
  lang?: Language;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  orderId,
  amount,
  onSuccess,
  onClose,
  lang = 'zh'
}) => {
  const [selectedReason, setSelectedReason] = useState<RefundReason | null>(null);
  const [description, setDescription] = useState('');
  const [refundAmount, setRefundAmount] = useState(amount.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const texts = {
    zh: {
      title: '退款申请',
      orderInfo: '订单信息',
      orderId: '订单号',
      refundAmount: '退款金额',
      reason: '退款原因',
      reasonEscortCancelled: '陪诊师取消',
      reasonDissatisfied: '服务不满意',
      reasonScheduleConflict: '临时有事',
      reasonOther: '其他原因',
      description: '退款说明（可选）',
      descriptionPlaceholder: '请详细描述退款原因...',
      confirm: '确认申请',
      cancel: '取消',
      processing: '处理中...',
      refundSuccess: '退款申请已提交',
      refundSuccessDesc: '我们将尽快审核您的申请',
      refundFailed: '退款申请失败',
      selectReasonError: '请选择退款原因',
      invalidAmountError: '请输入有效的退款金额',
      amountExceedsError: '退款金额不能超过订单金额',
      fullAmount: '全额退款',
      yuan: '元',
      networkError: '网络错误，请检查网络连接',
      alreadyRefunding: '该订单已有待处理的退款申请'
    },
    en: {
      title: 'Refund Request',
      orderInfo: 'Order Information',
      orderId: 'Order ID',
      refundAmount: 'Refund Amount',
      reason: 'Refund Reason',
      reasonEscortCancelled: 'Escort Cancelled',
      reasonDissatisfied: 'Service Dissatisfied',
      reasonScheduleConflict: 'Schedule Conflict',
      reasonOther: 'Other Reasons',
      description: 'Description (Optional)',
      descriptionPlaceholder: 'Please describe your refund reason...',
      confirm: 'Confirm Request',
      cancel: 'Cancel',
      processing: 'Processing...',
      refundSuccess: 'Refund request submitted',
      refundSuccessDesc: 'We will review your request soon',
      refundFailed: 'Refund request failed',
      selectReasonError: 'Please select a refund reason',
      invalidAmountError: 'Please enter a valid refund amount',
      amountExceedsError: 'Refund amount cannot exceed order amount',
      fullAmount: 'Full Refund',
      yuan: '¥',
      networkError: 'Network error, please check your connection',
      alreadyRefunding: 'This order already has a pending refund request'
    }
  };

  const t = texts[lang];

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError(t.selectReasonError);
      return;
    }

    const numAmount = parseFloat(refundAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t.invalidAmountError);
      return;
    }

    if (numAmount > amount) {
      setError(t.amountExceedsError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Map reason to text
      const reasonMap: Record<RefundReason, string> = {
        escort_cancelled: lang === 'zh' ? '陪诊师取消' : 'Escort Cancelled',
        dissatisfied: lang === 'zh' ? '服务不满意' : 'Service Dissatisfied',
        schedule_conflict: lang === 'zh' ? '临时有事' : 'Schedule Conflict',
        other: lang === 'zh' ? '其他原因' : 'Other Reasons',
      };

      await apiService.createRefund({
        orderId,
        reason: reasonMap[selectedReason],
        reasonType: selectedReason,
        description: description || undefined,
        amount: numAmount,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Refund error:', err);
      if (err?.response?.data?.message?.includes('already exists')) {
        setError(t.alreadyRefunding);
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t.refundFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1]?.length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    return cleaned;
  };

  const reasons: { key: RefundReason; label: string }[] = [
    { key: 'escort_cancelled', label: t.reasonEscortCancelled },
    { key: 'dissatisfied', label: t.reasonDissatisfied },
    { key: 'schedule_conflict', label: t.reasonScheduleConflict },
    { key: 'other', label: t.reasonOther }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
          <h2 className="font-bold text-lg text-slate-900">{t.title}</h2>
          <div className="w-10"></div>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t.refundSuccess}</h3>
            <p className="text-slate-500 text-center px-4">
              {lang === 'zh' 
                ? `退款金额 ¥${parseFloat(refundAmount).toFixed(2)} 已提交审核`
                : `Refund of ¥${parseFloat(refundAmount).toFixed(2)} has been submitted for review`}
            </p>
            <p className="text-slate-400 text-sm mt-2">{t.refundSuccessDesc}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-4 mb-6 text-white">
              <div className="text-sm opacity-90 mb-1">{t.orderInfo}</div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs opacity-80">{t.orderId}</span>
                <span className="text-sm font-medium">{orderId.slice(0, 8)}...</span>
              </div>
              <div className="text-3xl font-black">¥{amount.toFixed(2)}</div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-600">
                  <div className="font-medium">{t.refundFailed}</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  {t.refundAmount}
                </label>
                <div className="border-b-2 border-slate-100 focus-within:border-teal-500 transition-colors py-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(formatAmount(e.target.value))}
                      className="flex-1 outline-none text-2xl bg-transparent placeholder-slate-400 text-slate-900 font-bold"
                      inputMode="decimal"
                      placeholder={t.fullAmount}
                      disabled={loading}
                    />
                    <span className="text-slate-500 font-medium">{t.yuan}</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setRefundAmount(amount.toFixed(2))}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    disabled={loading}
                  >
                    {t.fullAmount}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  {t.reason}
                </label>
                <div className="space-y-2">
                  {reasons.map((reason) => (
                    <label
                      key={reason.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedReason === reason.key
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="refundReason"
                        value={reason.key}
                        checked={selectedReason === reason.key}
                        onChange={() => setSelectedReason(reason.key)}
                        className="w-4 h-4 text-teal-500 focus:ring-teal-500"
                        disabled={loading}
                      />
                      <span className={`text-sm font-medium ${
                        selectedReason === reason.key ? 'text-teal-700' : 'text-slate-700'
                      }`}>
                        {reason.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {t.description}
                </label>
                <div className="border-2 border-slate-100 rounded-xl focus-within:border-teal-500 transition-colors">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.descriptionPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 outline-none bg-transparent placeholder-slate-400 text-slate-900 text-sm resize-none"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 flex-shrink-0">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-full text-slate-700 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedReason}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full font-bold hover:from-teal-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t.processing}
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5" />
                    {t.confirm}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
