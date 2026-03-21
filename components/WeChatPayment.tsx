import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle, Clock, QrCode } from 'lucide-react';
import { apiService } from '../services/apiService';

interface WeChatPaymentProps {
  orderId: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
  lang: 'zh' | 'en';
}

export const WeChatPayment: React.FC<WeChatPaymentProps> = ({
  orderId,
  amount,
  onSuccess,
  onCancel,
  lang
}) => {
  const [paymentData, setPaymentData] = useState<{ wechatOrderId: string; qrCodeUrl: string; codeUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(300);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'timeout' | 'failed'>('pending');
  const [refreshKey, setRefreshKey] = useState(0);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const texts = {
    zh: {
      title: '微信支付',
      orderNumber: '订单号',
      amount: '支付金额',
      scanQrCode: '请使用微信扫描二维码支付',
      expireNotice: '二维码有效期',
      minutes: '分钟',
      seconds: '秒',
      refreshQrCode: '刷新二维码',
      cancel: '取消支付',
      paymentSuccess: '支付成功',
      paymentSuccessDesc: '感谢您的支付',
      paymentTimeout: '二维码已过期',
      paymentTimeoutDesc: '请刷新二维码重新支付',
      paymentFailed: '支付失败',
      paymentFailedDesc: '请重试或联系客服',
      loading: '加载中...',
      failed: '创建支付失败',
      retry: '重试',
      polling: '正在检查支付状态',
      orderExpired: '订单已过期',
      orderExpiredDesc: '该订单已超过支付时限'
    },
    en: {
      title: 'WeChat Pay',
      orderNumber: 'Order Number',
      amount: 'Amount',
      scanQrCode: 'Please scan the QR code with WeChat to pay',
      expireNotice: 'QR Code expires in',
      minutes: 'min',
      seconds: 'sec',
      refreshQrCode: 'Refresh QR Code',
      cancel: 'Cancel Payment',
      paymentSuccess: 'Payment Successful',
      paymentSuccessDesc: 'Thank you for your payment',
      paymentTimeout: 'QR Code Expired',
      paymentTimeoutDesc: 'Please refresh to get a new QR code',
      paymentFailed: 'Payment Failed',
      paymentFailedDesc: 'Please retry or contact support',
      loading: 'Loading...',
      failed: 'Failed to create payment',
      retry: 'Retry',
      polling: 'Checking payment status',
      orderExpired: 'Order Expired',
      orderExpiredDesc: 'This order has exceeded the payment time limit'
    }
  };

  const t = texts[lang];

  // Generate QR code image URL
  const generateQrCode = useCallback((codeUrl: string) => {
    // Use a QR code generation service
    const encodedUrl = encodeURIComponent(codeUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
  }, []);

  // Create payment
  const createPayment = useCallback(async () => {
    setLoading(true);
    setError('');
    setPaymentStatus('pending');
    setCountdown(300);
    setQrCodeImage('');

    try {
      const data = await apiService.createWechatPayment(orderId);
      setPaymentData(data);
      
      // Generate QR code image
      const qrUrl = data.codeUrl || data.qrCodeUrl;
      if (qrUrl) {
        setQrCodeImage(generateQrCode(qrUrl));
      }
    } catch (err: any) {
      console.error('Create payment error:', err);
      setError(err.message || t.failed);
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  }, [orderId, t.failed, generateQrCode]);

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (paymentStatus !== 'pending') return;

    try {
      const payment = await apiService.getPaymentByOrderId(orderId);
      if (payment && (payment.status === 'COMPLETED' || payment.status === 'SUCCESS')) {
        setPaymentStatus('success');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setTimeout(() => {
          onSuccess(payment.id || orderId);
        }, 1500);
      } else if (payment && payment.status === 'FAILED') {
        setPaymentStatus('failed');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err) {
      console.error('Check payment status error:', err);
    }
  }, [orderId, paymentStatus, onSuccess]);

  // Initial payment creation
  useEffect(() => {
    createPayment();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [refreshKey, createPayment]);

  // Start polling and countdown when payment data is ready
  useEffect(() => {
    if (paymentData && paymentStatus === 'pending') {
      // Countdown timer
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            setPaymentStatus('timeout');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Payment status polling (every 3 seconds)
      pollingRef.current = setInterval(checkPaymentStatus, 3000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
    }
  }, [paymentData, paymentStatus, checkPaymentStatus]);

  const handleRefresh = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    onCancel();
  };

  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amt: number) => {
    return `¥${amt.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleCancel}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            disabled={paymentStatus === 'success'}
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
          <div className="font-bold text-lg text-slate-400">{t.title}</div>
          <div className="w-10"></div>
        </div>

        <div className="px-2">
          <div className="flex justify-between items-center mb-6 bg-slate-50 rounded-xl p-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">{t.orderNumber}</div>
              <div className="font-mono text-sm text-slate-700">
                {paymentData?.wechatOrderId?.slice(0, 16) || orderId.slice(0, 16)}...
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">{t.amount}</div>
              <div className="font-bold text-xl text-teal-600">
                {formatAmount(amount)}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-slate-500 text-sm">{t.loading}</div>
            </div>
          ) : error && !paymentData ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <div className="text-red-600 font-medium mb-2">{t.failed}</div>
              <div className="text-sm text-red-500 mb-4">{error}</div>
              <button
                onClick={handleRefresh}
                className="bg-teal-600 text-white rounded-full px-6 py-2 font-bold hover:bg-teal-700 transition-colors"
              >
                {t.retry}
              </button>
            </div>
          ) : paymentStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <div className="text-xl font-black text-slate-900 mb-2">{t.paymentSuccess}</div>
              <div className="text-slate-500 text-sm">{t.paymentSuccessDesc}</div>
            </div>
          ) : paymentStatus === 'failed' ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <div className="text-xl font-black text-slate-900 mb-2">{t.paymentFailed}</div>
              <div className="text-slate-500 text-sm mb-6">{t.paymentFailedDesc}</div>
              <button
                onClick={handleRefresh}
                className="bg-teal-600 text-white rounded-full px-6 py-3 font-bold hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                {t.retry}
              </button>
            </div>
          ) : paymentStatus === 'timeout' ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
              <div className="text-xl font-black text-slate-900 mb-2">{t.paymentTimeout}</div>
              <div className="text-slate-500 text-sm mb-6">{t.paymentTimeoutDesc}</div>
              <button
                onClick={handleRefresh}
                className="bg-teal-600 text-white rounded-full px-6 py-3 font-bold hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                {t.refreshQrCode}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="relative bg-white border-2 border-slate-200 rounded-2xl p-4 mb-4">
                  {qrCodeImage ? (
                    <img
                      src={qrCodeImage}
                      alt="WeChat Pay QR Code"
                      className="w-48 h-48"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=wechat://pay?orderId=${orderId}&amount=${amount}&t=${Date.now()}`;
                      }}
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-100">
                      <QrCode className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-teal-600 text-white rounded-full px-4 py-1 text-xs font-bold">
                      <span className="flex items-center gap-1">
                        <QrCode className="h-3 w-3" />
                        WeChat Pay
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 text-center mb-4">
                  {t.scanQrCode}
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-orange-700 font-medium">{t.expireNotice}</span>
                  </div>
                  <div className={`font-mono text-xl font-bold ${countdown < 60 ? 'text-red-500' : 'text-orange-600'}`}>
                    {formatCountdown()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRefresh}
                  className="flex-1 bg-slate-100 text-slate-700 rounded-full py-3 font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t.refreshQrCode}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-slate-100 text-slate-700 rounded-full py-3 font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  {t.cancel}
                </button>
              </div>

              <div className="mt-4 text-center">
                <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                  {t.polling}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
