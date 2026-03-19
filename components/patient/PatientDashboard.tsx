import React, { useState, useEffect } from 'react';
import { getHealthTriage } from '../../services/geminiService';
import { apiService } from '../../services/apiService';
import { EscortProfile, Language } from '../../types';
import { MapPin, MessageCircle, Heart, BarChart2, Share, RefreshCw } from 'lucide-react';

interface PatientDashboardProps {
  lang: Language;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ lang }) => {
  const [symptoms, setSymptoms] = useState('');
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [escorts, setEscorts] = useState<EscortProfile[]>([]);
  const [escortsLoading, setEscortsLoading] = useState(true);
  const [escortsError, setEscortsError] = useState('');

  const t = {
    zh: {
      placeholder: '哪里不舒服？(输入症状 AI 智能导诊)',
      aiTitle: 'AI 导诊建议',
      analyzing: '分析中...',
      triage: '智能导诊',
      services: [
        { label: '全程陪诊', sub: '挂号/取药/送医' },
        { label: '代办买药', sub: '送药上门' },
        { label: '专车接送', sub: '轮椅/担架' },
        { label: '住院陪护', sub: '24H护工' }
      ],
      certified: '实名认证',
      consult: '咨询',
      book: '下单',
      loadingEscorts: '加载陪诊师列表...',
      failedToLoad: '加载失败',
      noEscortsFound: '附近暂无陪诊师',
      retry: '重试',
      networkError: '网络错误，请检查网络连接'
    },
    en: {
      placeholder: 'What are your symptoms? (AI Triage)',
      aiTitle: 'AI Triage Advice',
      analyzing: 'Analyzing...',
      triage: 'AI Triage',
      services: [
        { label: 'Full Escort', sub: 'Registration/Medicine' },
        { label: 'Medicine Pickup', sub: 'Delivery' },
        { label: 'Transport', sub: 'Wheelchair/Stretcher' },
        { label: 'Hospital Care', sub: '24H Care' }
      ],
      certified: 'Verified',
      consult: 'Chat',
      book: 'Book',
      loadingEscorts: 'Loading escorts...',
      failedToLoad: 'Failed to load',
      noEscortsFound: 'No escorts nearby',
      retry: 'Retry',
      networkError: 'Network error'
    }
  }[lang];

  const handleAIChat = async () => {
    if (!symptoms.trim()) return;
    setAiLoading(true);
    try {
      const advice = await getHealthTriage(symptoms, lang);
      setAiAdvice(advice);
    } catch (error) {
      console.error('AI triage error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchEscorts = async () => {
    setEscortsLoading(true);
    setEscortsError('');

    try {
      let latitude = 39.9042;
      let longitude = 116.4074;

      if (navigator.geolocation) {
        await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              console.warn('Geolocation error:', error.message);
              reject(error);
            },
            { timeout: 5000, maximumAge: 300000 }
          );
        }).then(
          (position) => {
            latitude = position.latitude;
            longitude = position.longitude;
          },
          () => {}
        );
      }

      const data = await apiService.getNearbyEscorts(latitude, longitude, 10);
      setEscorts(data);

      if (data.length === 0) {
        setEscortsError(t.noEscortsFound);
      }
    } catch (error) {
      console.error('Failed to fetch escorts:', error);
      setEscortsError(t.networkError);
    } finally {
      setEscortsLoading(false);
    }
  };

  useEffect(() => {
    fetchEscorts();
  }, [lang]);

  return (
    <div className="pb-20">
      {/* AI Triage Section */}
      <div className="p-4 border-b border-slate-100">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-4 text-white">
          <h2 className="font-bold text-lg mb-2">{t.triage}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
              placeholder={t.placeholder}
              className="flex-1 px-4 py-2 rounded-full text-slate-900 text-sm"
            />
            <button
              onClick={handleAIChat}
              disabled={aiLoading || !symptoms.trim()}
              className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium disabled:opacity-50"
            >
              {aiLoading ? t.analyzing : t.triage}
            </button>
          </div>
          {aiAdvice && (
            <div className="mt-3 p-3 bg-white/10 rounded-xl text-sm">
              <p className="font-medium mb-1">{t.aiTitle}</p>
              <p>{aiAdvice}</p>
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {t.services.map((service, idx) => (
            <div key={idx} className="flex-shrink-0 bg-slate-50 rounded-xl p-3 w-24 text-center">
              <div className="w-10 h-10 bg-teal-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-lg">🏥</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{service.label}</p>
              <p className="text-xs text-slate-500">{service.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Escorts */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">{lang === 'zh' ? '附近陪诊师' : 'Nearby Escorts'}</h2>
          <button onClick={fetchEscorts} className="p-1 hover:bg-slate-100 rounded-full">
            <RefreshCw className={`h-4 w-4 ${escortsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {escortsLoading ? (
          <div className="text-center py-8 text-slate-500">{t.loadingEscorts}</div>
        ) : escortsError && escorts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-2">{escortsError}</p>
            <button
              onClick={fetchEscorts}
              className="px-4 py-2 bg-teal-500 text-white rounded-full text-sm"
            >
              {t.retry}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {escorts.map((escort) => (
              <div key={escort.id} className="bg-white rounded-xl p-3 shadow-sm flex gap-3">
                <img
                  src={escort.imageUrl || `https://picsum.photos/60/60?random=${escort.id}`}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{escort.name}</span>
                    {escort.isCertified && (
                      <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                        {t.certified}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                      {escort.rating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{escort.completedOrders} {lang === 'zh' ? '单' : 'orders'}</span>
                    {escort.distance && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {escort.distance}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 py-1.5 bg-slate-100 rounded-full text-sm text-slate-700">
                      {t.consult}
                    </button>
                    <button className="flex-1 py-1.5 bg-teal-500 rounded-full text-sm text-white">
                      {t.book}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
