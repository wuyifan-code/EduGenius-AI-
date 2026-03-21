import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { apiService } from '../services/apiService';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  ShoppingBag, 
  CreditCard, 
  RefreshCw, 
  Volume2, 
  VolumeX,
  Smartphone,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface NotificationSettingsProps {
  lang: Language;
}

interface NotificationPreferences {
  orderNotifications: boolean;
  messageNotifications: boolean;
  paymentNotifications: boolean;
  systemNotifications: boolean;
  promotionalNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  orderNotifications: true,
  messageNotifications: true,
  paymentNotifications: true,
  systemNotifications: true,
  promotionalNotifications: false,
  emailNotifications: true,
  pushNotifications: false,
  soundEnabled: true,
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ lang }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadPreferences();
    checkPushSupport();
  }, []);

  const checkPushSupport = () => {
    if ('Notification' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 从 localStorage 加载
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
      }
      
      // 从服务器加载
      try {
        const profile = await apiService.getUserProfile();
        if (profile?.notificationSettings) {
          setPreferences(prev => ({ ...prev, ...profile.notificationSettings }));
        }
      } catch (e) {
        console.log('Server preferences not available, using local');
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setError(lang === 'zh' ? '加载设置失败' : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // 保存到 localStorage
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));

      // 保存到服务器
      await apiService.updateNotificationSettings({
        orderNotifications: preferences.orderNotifications,
        messageNotifications: preferences.messageNotifications,
        systemNotifications: preferences.systemNotifications,
        promotionalNotifications: preferences.promotionalNotifications,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setError(lang === 'zh' ? '保存设置失败' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        setPreferences(prev => ({ ...prev, pushNotifications: true }));
        // 订阅推送服务
        await subscribeToPush();
      } else {
        setPreferences(prev => ({ ...prev, pushNotifications: false }));
      }
    } catch (error) {
      console.error('Failed to request push permission:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      // 这里可以实现 Web Push 订阅逻辑
      // 需要配合 Service Worker 使用
      console.log('Subscribing to push notifications...');
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePushToggle = async () => {
    if (!preferences.pushNotifications) {
      // 开启推送
      if (pushPermission !== 'granted') {
        await requestPushPermission();
      } else {
        setPreferences(prev => ({ ...prev, pushNotifications: true }));
      }
    } else {
      // 关闭推送
      setPreferences(prev => ({ ...prev, pushNotifications: false }));
    }
  };

  const t = {
    zh: {
      title: '通知设置',
      subtitle: '管理您的通知偏好',
      appNotifications: '应用内通知',
      orderNotifications: '订单通知',
      orderNotificationsDesc: '订单状态变更、新订单提醒',
      messageNotifications: '消息通知',
      messageNotificationsDesc: '新消息、聊天提醒',
      paymentNotifications: '支付通知',
      paymentNotificationsDesc: '支付成功、退款状态',
      systemNotifications: '系统通知',
      systemNotificationsDesc: '系统公告、账户安全',
      promotionalNotifications: '营销通知',
      promotionalNotificationsDesc: '优惠活动、促销信息',
      channels: '通知渠道',
      emailNotifications: '邮件通知',
      emailNotificationsDesc: '接收邮件形式的通知',
      pushNotifications: '推送通知',
      pushNotificationsDesc: '接收浏览器推送通知',
      pushNotSupported: '您的浏览器不支持推送通知',
      sound: '声音设置',
      soundEnabled: '开启提示音',
      soundEnabledDesc: '新通知到达时播放提示音',
      save: '保存设置',
      saving: '保存中...',
      saved: '保存成功',
      error: '保存失败',
      loading: '加载中...',
    },
    en: {
      title: 'Notification Settings',
      subtitle: 'Manage your notification preferences',
      appNotifications: 'In-App Notifications',
      orderNotifications: 'Order Notifications',
      orderNotificationsDesc: 'Order status changes, new order alerts',
      messageNotifications: 'Message Notifications',
      messageNotificationsDesc: 'New messages, chat alerts',
      paymentNotifications: 'Payment Notifications',
      paymentNotificationsDesc: 'Payment success, refund status',
      systemNotifications: 'System Notifications',
      systemNotificationsDesc: 'System announcements, account security',
      promotionalNotifications: 'Promotional Notifications',
      promotionalNotificationsDesc: 'Promotions, special offers',
      channels: 'Notification Channels',
      emailNotifications: 'Email Notifications',
      emailNotificationsDesc: 'Receive notifications via email',
      pushNotifications: 'Push Notifications',
      pushNotificationsDesc: 'Receive browser push notifications',
      pushNotSupported: 'Your browser does not support push notifications',
      sound: 'Sound Settings',
      soundEnabled: 'Enable Sound',
      soundEnabledDesc: 'Play sound when new notifications arrive',
      save: 'Save Settings',
      saving: 'Saving...',
      saved: 'Saved successfully',
      error: 'Failed to save',
      loading: 'Loading...',
    }
  }[lang];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <span className="ml-2 text-slate-500">{t.loading}</span>
      </div>
    );
  }

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    description, 
    checked, 
    onChange,
    disabled = false
  }: { 
    icon: any, 
    title: string, 
    description: string, 
    checked: boolean, 
    onChange: () => void,
    disabled?: boolean
  }) => (
    <div className={`flex items-center justify-between py-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded-lg">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h3 className="font-medium text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-teal-500' : 'bg-slate-200'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-800">{t.saved}</span>
        </div>
      )}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      <div className="px-4 py-6 space-y-6">
        {/* App Notifications Section */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-teal-500" />
              {t.appNotifications}
            </h2>
          </div>
          <div className="px-4 divide-y divide-slate-100">
            <SettingItem
              icon={ShoppingBag}
              title={t.orderNotifications}
              description={t.orderNotificationsDesc}
              checked={preferences.orderNotifications}
              onChange={() => handleToggle('orderNotifications')}
            />
            <SettingItem
              icon={MessageSquare}
              title={t.messageNotifications}
              description={t.messageNotificationsDesc}
              checked={preferences.messageNotifications}
              onChange={() => handleToggle('messageNotifications')}
            />
            <SettingItem
              icon={CreditCard}
              title={t.paymentNotifications}
              description={t.paymentNotificationsDesc}
              checked={preferences.paymentNotifications}
              onChange={() => handleToggle('paymentNotifications')}
            />
            <SettingItem
              icon={RefreshCw}
              title={t.systemNotifications}
              description={t.systemNotificationsDesc}
              checked={preferences.systemNotifications}
              onChange={() => handleToggle('systemNotifications')}
            />
            <SettingItem
              icon={Mail}
              title={t.promotionalNotifications}
              description={t.promotionalNotificationsDesc}
              checked={preferences.promotionalNotifications}
              onChange={() => handleToggle('promotionalNotifications')}
            />
          </div>
        </section>

        {/* Channels Section */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-teal-500" />
              {t.channels}
            </h2>
          </div>
          <div className="px-4 divide-y divide-slate-100">
            <SettingItem
              icon={Mail}
              title={t.emailNotifications}
              description={t.emailNotificationsDesc}
              checked={preferences.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <SettingItem
              icon={Bell}
              title={t.pushNotifications}
              description={pushSupported ? t.pushNotificationsDesc : t.pushNotSupported}
              checked={preferences.pushNotifications}
              onChange={handlePushToggle}
              disabled={!pushSupported}
            />
          </div>
        </section>

        {/* Sound Section */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              {preferences.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-teal-500" />
              ) : (
                <VolumeX className="h-5 w-5 text-slate-400" />
              )}
              {t.sound}
            </h2>
          </div>
          <div className="px-4">
            <SettingItem
              icon={preferences.soundEnabled ? Volume2 : VolumeX}
              title={t.soundEnabled}
              description={t.soundEnabledDesc}
              checked={preferences.soundEnabled}
              onChange={() => handleToggle('soundEnabled')}
            />
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={savePreferences}
          disabled={saving}
          className="w-full py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t.saving}
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              {t.save}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
