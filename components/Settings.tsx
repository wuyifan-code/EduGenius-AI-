import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { ArrowLeft, Globe, Check, Bell, Tag, MessageSquare, Settings as SettingsIcon, Loader2, CheckCircle, Moon, Sun, Server, Trash } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useTheme } from '../contexts/ThemeContext';

interface NotificationSettings {
  orderNotifications: boolean;
  messageNotifications: boolean;
  systemNotifications: boolean;
  promotionalNotifications: boolean;
}

interface SettingsProps {
  currentLang: Language;
  setLang: (lang: Language) => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentLang, setLang, onBack }) => {
  const { theme, toggleTheme } = useTheme();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    orderNotifications: true,
    messageNotifications: true,
    systemNotifications: true,
    promotionalNotifications: false
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'language' | 'notifications' | 'display' | 'cache'>('language');
  const [clearingCache, setClearingCache] = useState(false);
  const [showClearSuccess, setShowClearSuccess] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  const texts = {
    zh: {
      title: '设置',
      accessibility: '辅助功能、显示与语言',
      languages: '语言',
      displayLang: '显示语言',
      chinese: '简体中文',
      english: 'English',
      notifications: '通知设置',
      notificationPrefs: '通知偏好',
      orderNotifications: '订单通知',
      orderNotificationsDesc: '接收订单状态更新和提醒',
      messageNotifications: '消息通知',
      messageNotificationsDesc: '接收新消息提醒',
      systemNotifications: '系统通知',
      systemNotificationsDesc: '接收系统公告和重要通知',
      promotionalNotifications: '促销活动通知',
      promotionalNotificationsDesc: '接收优惠活动和促销信息',
      save: '保存设置',
      saving: '保存中...',
      saved: '设置已保存',
      on: '开启',
      off: '关闭',
      display: '显示设置',
      darkMode: '深色模式',
      darkModeDesc: '开启后应用将切换到深色主题',
      light: '浅色',
      dark: '深色',
      cache: '缓存管理',
      cacheManagement: '缓存管理',
      clearCache: '清除缓存',
      clearCacheDesc: '清理临时数据和缓存文件，保留登录状态和主题设置',
      clearing: '清理中...',
      cleared: '缓存已清理',
      currentCache: '当前缓存大小',
      storage: '存储'
    },
    en: {
      title: 'Settings',
      accessibility: 'Accessibility, display and languages',
      languages: 'Languages',
      displayLang: 'Display Language',
      chinese: 'Simplified Chinese',
      english: 'English',
      notifications: 'Notifications',
      notificationPrefs: 'Notification Preferences',
      orderNotifications: 'Order Notifications',
      orderNotificationsDesc: 'Receive order status updates and reminders',
      messageNotifications: 'Message Notifications',
      messageNotificationsDesc: 'Receive new message alerts',
      systemNotifications: 'System Notifications',
      systemNotificationsDesc: 'Receive system announcements and important notices',
      promotionalNotifications: 'Promotional Notifications',
      promotionalNotificationsDesc: 'Receive special offers and promotional information',
      save: 'Save Settings',
      saving: 'Saving...',
      saved: 'Settings Saved',
      on: 'On',
      off: 'Off',
      display: 'Display',
      darkMode: 'Dark Mode',
      darkModeDesc: 'Enable dark theme for the application',
      light: 'Light',
      dark: 'Dark',
      cache: 'Cache',
      cacheManagement: 'Cache Management',
      clearCache: 'Clear Cache',
      clearCacheDesc: 'Clear temporary data and cache files, keep login status and theme settings',
      clearing: 'Clearing...',
      cleared: 'Cache Cleared',
      currentCache: 'Current Cache Size',
      storage: 'Storage'
    }
  };

  const t = texts[currentLang];

  useEffect(() => {
    const savedSettings = localStorage.getItem('notification_settings');
    if (savedSettings) {
      try {
        setNotificationSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse saved notification settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'cache') {
      calculateCacheSize();
    }
  }, [activeSection]);

  const calculateCacheSize = () => {
    let totalSize = 0;
    const cacheKeys = [
      'recent_searches',
      'recent_products',
      'recent_medicines',
      'search_history',
      'product_cache',
      'temp_data',
      'temp_files',
      'viewed_products',
      'viewed_medicines'
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && cacheKeys.some(cacheKey => key.includes(cacheKey))) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2;
        }
      }
    }
    setCacheSize(totalSize);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClearCache = async () => {
    setClearingCache(true);

    const preservedKeys = [
      'auth_token',
      'user_info',
      'userId',
      'notification_settings',
      'theme',
      'language',
      'currentLang',
      'lastLogin'
    ];

    const cacheKeys = [
      'recent_searches',
      'recent_products',
      'recent_medicines',
      'search_history',
      'product_cache',
      'temp_data',
      'temp_files',
      'viewed_products',
      'viewed_medicines'
    ];

    await new Promise(resolve => setTimeout(resolve, 1000));

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const shouldPreserve = preservedKeys.some(preservedKey =>
          key === preservedKey || key.startsWith(preservedKey)
        );
        const shouldClear = cacheKeys.some(cacheKey =>
          key.includes(cacheKey)
        );

        if (!shouldPreserve && shouldClear) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    setCacheSize(0);
    setClearingCache(false);
    setShowClearSuccess(true);
    setTimeout(() => setShowClearSuccess(false), 3000);
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateNotificationSettings(notificationSettings);
      localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-[53px] flex items-center gap-6 cursor-pointer" onClick={onBack}>
         <ArrowLeft className="h-5 w-5 hover:bg-slate-100 rounded-full" />
         <h1 className="text-xl font-bold text-slate-900">{t.title}</h1>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveSection('language')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeSection === 'language'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Globe className="h-5 w-5" />
              <span>{t.languages}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection('notifications')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeSection === 'notifications'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell className="h-5 w-5" />
              <span>{t.notifications}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection('cache')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeSection === 'cache'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Server className="h-5 w-5" />
              <span>{t.cache}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection('display')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeSection === 'display'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span>{t.display}</span>
            </div>
          </button>
        </div>

        {activeSection === 'language' && (
          <>
            <h2 className="text-xl font-black mb-6">{t.accessibility}</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 text-slate-500 mb-2">
                  <Globe className="h-5 w-5" />
                  <span className="font-bold text-slate-900">{t.languages}</span>
                </div>
                <p className="text-sm text-slate-500 mb-4 ml-8">
                  Manage which languages are used to personalize your MediMate experience.
                </p>

                <div className="ml-8 space-y-1">
                  <div
                    className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors"
                    onClick={() => setLang('zh')}
                  >
                    <span className="font-medium">{t.chinese}</span>
                    {currentLang === 'zh' && <Check className="h-5 w-5 text-teal-600" />}
                  </div>

                  <div
                    className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors"
                    onClick={() => setLang('en')}
                  >
                    <span className="font-medium">{t.english}</span>
                    {currentLang === 'en' && <Check className="h-5 w-5 text-teal-600" />}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'display' && (
          <>
            <h2 className="text-xl font-black mb-6">{t.display}</h2>
            <div className="space-y-4 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <span className="font-bold text-slate-900 dark:text-white">{t.darkMode}</span>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {t.darkModeDesc}
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => theme === 'dark' && toggleTheme()}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                        theme === 'light'
                          ? 'bg-teal-600 text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Sun className="h-5 w-5" />
                      <span>{t.light}</span>
                    </button>
                    <button
                      onClick={() => theme === 'light' && toggleTheme()}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                        theme === 'dark'
                          ? 'bg-teal-600 text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Moon className="h-5 w-5" />
                      <span>{t.dark}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'notifications' && (
          <>
            <h2 className="text-xl font-black mb-6">{t.notificationPrefs}</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3 text-slate-600">
                    <SettingsIcon className="h-5 w-5" />
                    <span className="font-bold text-slate-900">{t.notificationPrefs}</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Tag className="h-5 w-5 text-teal-600" />
                        <span className="font-medium text-slate-900">{t.orderNotifications}</span>
                      </div>
                      <p className="text-sm text-slate-500 ml-8">{t.orderNotificationsDesc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${notificationSettings.orderNotifications ? 'text-teal-600' : 'text-slate-400'}`}>
                        {notificationSettings.orderNotifications ? t.on : t.off}
                      </span>
                      <button
                        onClick={() => handleToggle('orderNotifications')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.orderNotifications ? 'bg-teal-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                            notificationSettings.orderNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <MessageSquare className="h-5 w-5 text-teal-600" />
                        <span className="font-medium text-slate-900">{t.messageNotifications}</span>
                      </div>
                      <p className="text-sm text-slate-500 ml-8">{t.messageNotificationsDesc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${notificationSettings.messageNotifications ? 'text-teal-600' : 'text-slate-400'}`}>
                        {notificationSettings.messageNotifications ? t.on : t.off}
                      </span>
                      <button
                        onClick={() => handleToggle('messageNotifications')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.messageNotifications ? 'bg-teal-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                            notificationSettings.messageNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Bell className="h-5 w-5 text-teal-600" />
                        <span className="font-medium text-slate-900">{t.systemNotifications}</span>
                      </div>
                      <p className="text-sm text-slate-500 ml-8">{t.systemNotificationsDesc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${notificationSettings.systemNotifications ? 'text-teal-600' : 'text-slate-400'}`}>
                        {notificationSettings.systemNotifications ? t.on : t.off}
                      </span>
                      <button
                        onClick={() => handleToggle('systemNotifications')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.systemNotifications ? 'bg-teal-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                            notificationSettings.systemNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Tag className="h-5 w-5 text-teal-600" />
                        <span className="font-medium text-slate-900">{t.promotionalNotifications}</span>
                      </div>
                      <p className="text-sm text-slate-500 ml-8">{t.promotionalNotificationsDesc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${notificationSettings.promotionalNotifications ? 'text-teal-600' : 'text-slate-400'}`}>
                        {notificationSettings.promotionalNotifications ? t.on : t.off}
                      </span>
                      <button
                        onClick={() => handleToggle('promotionalNotifications')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.promotionalNotifications ? 'bg-teal-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                            notificationSettings.promotionalNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-lg flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.saving}</span>
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>{t.saved}</span>
                </>
              ) : (
                <span>{t.save}</span>
              )}
            </button>
          </>
        )}

        {activeSection === 'cache' && (
          <>
            <h2 className="text-xl font-black mb-6">{t.cacheManagement}</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Server className="h-5 w-5" />
                    <span className="font-bold text-slate-900">{t.storage}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">{t.currentCache}</p>
                      <p className="text-2xl font-bold text-slate-900">{formatBytes(cacheSize)}</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
                      <Server className="h-8 w-8 text-teal-600" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-6">
                    {t.clearCacheDesc}
                  </p>

                  <button
                    onClick={handleClearCache}
                    disabled={clearingCache || cacheSize === 0}
                    className="w-full bg-red-50 hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400 text-red-600 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 border-2 border-red-200 hover:border-red-300 disabled:border-slate-200"
                  >
                    {clearingCache ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{t.clearing}</span>
                      </>
                    ) : showClearSuccess ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>{t.cleared}</span>
                      </>
                    ) : (
                      <>
                        <Trash className="h-5 w-5" />
                        <span>{t.clearCache}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
