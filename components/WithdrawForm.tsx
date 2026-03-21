import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Wallet, CreditCard, Building2, ChevronDown } from 'lucide-react';
import { apiService } from '../services/apiService';

type PaymentMethod = 'alipay' | 'wechat' | 'bank';

interface WithdrawRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  account: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface WithdrawFormProps {
  availableBalance: number;
  onSuccess: () => void;
  onCancel: () => void;
  lang: 'zh' | 'en';
}

export const WithdrawForm: React.FC<WithdrawFormProps> = ({
  availableBalance,
  onSuccess,
  onCancel,
  lang
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('alipay');
  const [account, setAccount] = useState('');
  const [realName, setRealName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [records, setRecords] = useState<WithdrawRecord[]>([]);

  const texts = {
    zh: {
      title: '提现',
      availableBalance: '可提现金额',
      amountLabel: '提现金额',
      amountPlaceholder: '请输入提现金额',
      amountError: '提现金额不能为0或超过余额',
      paymentMethodLabel: '收款方式',
      alipay: '支付宝',
      wechat: '微信',
      bank: '银行卡',
      accountLabel: '收款账号',
      accountPlaceholder: '请输入收款账号',
      realNameLabel: '真实姓名',
      realNamePlaceholder: '请输入真实姓名',
      passwordLabel: '提现密码',
      passwordPlaceholder: '请输入提现密码（可选）',
      confirm: '确认提现',
      cancel: '取消',
      withdrawSuccess: '提现申请已提交',
      withdrawFailed: '提现失败，请稍后重试',
      networkError: '网络错误，请检查网络连接',
      records: '提现记录',
      recentRecords: '最近提现记录',
      noRecords: '暂无提现记录',
      statusPending: '处理中',
      statusCompleted: '已完成',
      statusFailed: '失败',
      amountTooLarge: '提现金额不能超过可提现金额',
      amountMustPositive: '提现金额必须大于0',
      invalidAmount: '请输入有效的金额',
      insufficientFields: '请填写完整信息',
      processing: '处理中'
    },
    en: {
      title: 'Withdraw',
      availableBalance: 'Available Balance',
      amountLabel: 'Withdraw Amount',
      amountPlaceholder: 'Enter withdraw amount',
      amountError: 'Amount cannot be 0 or exceed balance',
      paymentMethodLabel: 'Payment Method',
      alipay: 'Alipay',
      wechat: 'WeChat',
      bank: 'Bank Card',
      accountLabel: 'Account',
      accountPlaceholder: 'Enter account number',
      realNameLabel: 'Real Name',
      realNamePlaceholder: 'Enter your real name',
      passwordLabel: 'Withdraw Password',
      passwordPlaceholder: 'Enter withdraw password (optional)',
      confirm: 'Confirm Withdraw',
      cancel: 'Cancel',
      withdrawSuccess: 'Withdraw application submitted',
      withdrawFailed: 'Withdraw failed, please try again later',
      networkError: 'Network error, please check your connection',
      records: 'Withdraw Records',
      recentRecords: 'Recent Withdraw Records',
      noRecords: 'No withdraw records',
      statusPending: 'Processing',
      statusCompleted: 'Completed',
      statusFailed: 'Failed',
      amountTooLarge: 'Amount cannot exceed available balance',
      amountMustPositive: 'Amount must be greater than 0',
      invalidAmount: 'Please enter a valid amount',
      insufficientFields: 'Please fill in all required fields',
      processing: 'Processing'
    }
  };

  const t = texts[lang];

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await apiService.getWithdrawRecords();
      if (response && response.data) {
        setRecords(response.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load withdraw records:', err);
      setRecords([]);
    }
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      setError(t.invalidAmount);
      return;
    }
    
    if (numAmount <= 0) {
      setError(t.amountMustPositive);
      return;
    }
    
    if (numAmount > availableBalance) {
      setError(t.amountTooLarge);
      return;
    }
    
    if (!account || !realName) {
      setError(t.insufficientFields);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.withdraw({
        amount: numAmount,
        method: paymentMethod,
        account: account,
        realName: realName,
        password: password || undefined
      });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Withdraw error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t.withdrawFailed);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t.statusCompleted;
      case 'failed':
        return t.statusFailed;
      default:
        return t.statusPending;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onCancel}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-6 w-6 text-slate-500" />
            </button>
            <h2 className="font-bold text-lg text-slate-900">{t.title}</h2>
            <button
              onClick={() => setShowRecords(!showRecords)}
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              {t.records}
            </button>
          </div>

          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t.withdrawSuccess}</h3>
              <p className="text-slate-500 text-center px-4">
                {lang === 'zh' 
                  ? `提现金额 ¥${parseFloat(amount).toFixed(2)} 已提交处理`
                  : `Withdrawal of ¥${parseFloat(amount).toFixed(2)} has been submitted`}
              </p>
            </div>
          ) : showRecords ? (
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{t.recentRecords}</h3>
              {records.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Wallet className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>{t.noRecords}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-slate-900">
                            ¥{record.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(record.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(record.status)}`}>
                          {getStatusText(record.status)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        {record.method === 'alipay' ? t.alipay : 
                         record.method === 'wechat' ? t.wechat : t.bank}: {record.account}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-4 mb-6 text-white">
                <div className="text-sm opacity-90 mb-1">{t.availableBalance}</div>
                <div className="text-3xl font-black">¥{availableBalance.toFixed(2)}</div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-600">
                    <div className="font-medium">{t.withdrawFailed}</div>
                    <div>{error}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.amountLabel}</label>
                  <div className="border-b-2 border-slate-100 focus-within:border-teal-500 transition-colors py-2">
                    <input
                      type="text"
                      placeholder={t.amountPlaceholder}
                      value={amount}
                      onChange={(e) => setAmount(formatAmount(e.target.value))}
                      className="flex-1 outline-none text-2xl bg-transparent placeholder-slate-400 text-slate-900 font-bold"
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.paymentMethodLabel}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className={`py-3 px-3 rounded-xl font-bold text-sm transition-colors flex flex-col items-center gap-1 ${
                        paymentMethod === 'alipay'
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                      onClick={() => setPaymentMethod('alipay')}
                    >
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.5 4c-1.68 0-3.22.38-4.56 1.03-.73.36-1.33.8-1.83 1.31-.36.37-.6.73-.76 1.08-.17.38-.22.73-.22 1.08 0 .39.05.74.22 1.08.13.31.36.63.7.93.33.29.8.56 1.4.81.6.24 1.39.45 2.36.6.97.15 2.15.24 3.53.24.85 0 1.62-.04 2.31-.12.69-.08 1.27-.19 1.75-.32.47-.14.85-.3 1.12-.49.27-.19.48-.4.61-.64.13-.23.19-.5.19-.8 0-.48-.17-.87-.51-1.17-.34-.3-.8-.54-1.39-.73-.59-.19-1.27-.34-2.05-.46-.78-.12-1.62-.21-2.52-.28l-2.04-.15c-.65-.05-1.23-.14-1.74-.28-.51-.14-.94-.33-1.3-.58-.36-.25-.64-.56-.85-.94-.21-.38-.32-.84-.32-1.4 0-.56.11-1.08.32-1.56.21-.48.51-.9.91-1.25.39-.36.86-.64 1.41-.85.54-.21 1.15-.35 1.81-.42.66-.07 1.38-.1 2.15-.1.66 0 1.28.03 1.87.1.59.07 1.13.17 1.63.32.5.14.94.32 1.33.54.39.22.72.48.99.77.27.29.48.61.63.97.15.36.22.75.22 1.17 0 .59-.11 1.12-.32 1.6-.21.48-.51.89-.9 1.24-.39.35-.85.63-1.39.83-.54.21-1.13.35-1.77.43-.64.08-1.32.12-2.05.12h-.47l-.19.02v.02l.03.02.47.02h.52l.28.02c.1 0 .2.02.3.02.1 0 .19.02.29.02l.1.02.1.02c.13.02.25.05.38.07.13.02.26.05.38.08.13.03.26.07.38.12.13.05.25.1.37.15.12.06.24.12.36.18.12.06.23.13.34.21l.24.15.22.18c.14.13.28.27.4.43.12.16.23.33.33.52.1.19.18.39.24.6.06.21.1.44.1.69 0 .25-.03.5-.1.75-.06.25-.16.48-.29.69-.13.21-.29.4-.48.56-.19.16-.41.29-.65.39-.25.1-.52.17-.83.21-.31.04-.64.06-1 .06-.36 0-.69-.02-1-.06-.31-.04-.59-.11-.84-.21-.24-.1-.46-.23-.65-.39-.19-.16-.35-.35-.48-.56-.13-.21-.23-.44-.29-.69-.06-.25-.1-.5-.1-.75 0-.25.04-.48.1-.69.06-.21.14-.41.24-.6.1-.19.21-.36.33-.52.12-.16.26-.3.4-.43l.22-.18.24-.15c.11-.08.22-.15.34-.21.12-.06.24-.12.36-.18.12-.05.24-.1.37-.15.12-.05.25-.09.38-.12.13-.03.25-.06.38-.08.13-.02.25-.05.38-.07l.1-.02.1-.02c.1 0 .19-.02.29-.02.1 0 .2-.02.3-.02l.28-.02h.52l.47-.02.03-.02v-.02l-.19-.02h-.47c-.73 0-1.41-.04-2.05-.12-.64-.08-1.23-.22-1.77-.43-.54-.2-1-.48-1.39-.83-.39-.35-.69-.76-.9-1.24-.21-.48-.32-1.01-.32-1.6 0-.42.07-.81.22-1.17.15-.36.36-.68.63-.97.27-.29.6-.55.99-.77.39-.22.83-.4 1.33-.54.5-.15 1.04-.25 1.63-.32.59-.07 1.21-.1 1.87-.1.77 0 1.49.03 2.15.1.66.07 1.27.21 1.81.42.55.21 1.02.49 1.41.85.4.35.7.77.91 1.25.21.48.32 1 .32 1.56 0 .56-.11 1.02-.32 1.4-.21.38-.49.69-.85.94-.36.25-.79.44-1.3.58-.51.14-1.09.23-1.74.28l-2.04.15c-.9.07-1.74.16-2.52.28-.78.12-1.46.27-2.05.46-.59.19-1.05.43-1.39.73-.34.3-.51.69-.51 1.17 0 .3.06.57.19.8.13.24.34.45.61.64.27.19.65.35 1.12.49.48.13 1.06.24 1.75.32.69.08 1.46.12 2.31.12 1.38 0 2.56-.09 3.53-.24.97-.15 1.76-.36 2.36-.6.6-.25 1.07-.52 1.4-.81.34-.3.57-.62.7-.93.17-.34.22-.69.22-1.08 0-.35-.05-.7-.22-1.08-.16-.35-.4-.71-.76-1.08-.5-.51-1.1-.95-1.83-1.31C22.72 4.38 21.18 4 19.5 4z"/>
                      </svg>
                      <span>{t.alipay}</span>
                    </button>
                    <button
                      className={`py-3 px-3 rounded-xl font-bold text-sm transition-colors flex flex-col items-center gap-1 ${
                        paymentMethod === 'wechat'
                          ? 'bg-green-500 text-white'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      onClick={() => setPaymentMethod('wechat')}
                    >
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.177l-.325-1.23a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
                      </svg>
                      <span>{t.wechat}</span>
                    </button>
                    <button
                      className={`py-3 px-3 rounded-xl font-bold text-sm transition-colors flex flex-col items-center gap-1 ${
                        paymentMethod === 'bank'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                      }`}
                      onClick={() => setPaymentMethod('bank')}
                    >
                      <Building2 className="h-6 w-6" />
                      <span>{t.bank}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.accountLabel}</label>
                  <div className="border-b-2 border-slate-100 focus-within:border-teal-500 transition-colors py-2">
                    <input
                      type="text"
                      placeholder={t.accountPlaceholder}
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.realNameLabel}</label>
                  <div className="border-b-2 border-slate-100 focus-within:border-teal-500 transition-colors py-2">
                    <input
                      type="text"
                      placeholder={t.realNamePlaceholder}
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.passwordLabel}</label>
                  <div className="border-b-2 border-slate-100 focus-within:border-teal-500 transition-colors py-2">
                    <input
                      type="password"
                      placeholder={t.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full py-4 font-bold text-lg hover:from-teal-600 hover:to-cyan-600 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                onClick={handleWithdraw}
                disabled={loading || !amount || !account || !realName}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t.processing}
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    {t.confirm}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
