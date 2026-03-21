import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Heart, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  MapPin,
  Loader2,
  X,
  ChevronDown,
  BadgeCheck
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { Language } from '../types';

interface EscortDetailProps {
  escortId: string;
  onBack: () => void;
  onOrder: (escort: any, serviceType: string, price: number) => void;
  onChat: (userId: string) => void;
  lang?: Language;
}

interface EscortDetail {
  id: string;
  userId: string;
  rating: number;
  reviewCount: number;
  completedOrders: number;
  hourlyRate: number;
  isVerified: boolean;
  specialties: string[];
  bio: string;
  services: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    price: number;
  }>;
  user: {
    id: string;
    name: string;
    avatarUrl: string;
    phone?: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}

export const EscortDetail: React.FC<EscortDetailProps> = ({
  escortId,
  onBack,
  onOrder,
  onChat,
  lang: langProp = 'zh'
}) => {
  const [loading, setLoading] = useState(true);
  const [escort, setEscort] = useState<EscortDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showServiceList, setShowServiceList] = useState(false);

  const t = {
    zh: {
      back: '返回',
      rating: '评分',
      reviews: '条评价',
      completedOrders: '已完成订单',
      hourlyRate: '时薪',
      specialties: '专业特长',
      bio: '个人简介',
      services: '服务项目',
      selectService: '选择服务',
      orderNow: '立即预约',
      contact: '联系陪诊师',
      favorite: '收藏',
      unfavorite: '取消收藏',
      verified: '已认证',
      notVerified: '未认证',
      recentReviews: '最近评价',
      viewAllReviews: '查看全部评价',
      price: '元',
      perHour: '/小时',
      loading: '加载中...',
      error: '加载失败',
      noBio: '暂无简介',
      noReviews: '暂无评价',
      serviceTypes: {
        FULL_PROCESS: '全程陪诊',
        APPOINTMENT: '代约挂号',
        REPORT_PICKUP: '代取报告',
        MEDICINE_PICKUP: '代办买药',
        VIP_TRANSPORT: '专车接送'
      }
    },
    en: {
      back: 'Back',
      rating: 'Rating',
      reviews: 'reviews',
      completedOrders: 'Completed Orders',
      hourlyRate: 'Hourly Rate',
      specialties: 'Specialties',
      bio: 'About',
      services: 'Services',
      selectService: 'Select Service',
      orderNow: 'Book Now',
      contact: 'Contact Escort',
      favorite: 'Favorite',
      unfavorite: 'Unfavorite',
      verified: 'Verified',
      notVerified: 'Unverified',
      recentReviews: 'Recent Reviews',
      viewAllReviews: 'View All Reviews',
      price: '',
      perHour: '/hour',
      loading: 'Loading...',
      error: 'Failed to load',
      noBio: 'No bio available',
      noReviews: 'No reviews yet',
      serviceTypes: {
        FULL_PROCESS: 'Full Service',
        APPOINTMENT: 'Appointment Booking',
        REPORT_PICKUP: 'Report Pickup',
        MEDICINE_PICKUP: 'Medicine Pickup',
        VIP_TRANSPORT: 'VIP Transport'
      }
    }
  }[langProp] as any;

  useEffect(() => {
    loadEscortDetails();
    loadReviews();
    checkFavoriteStatus();
  }, [escortId]);

  const loadEscortDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEscortDetails(escortId);
      setEscort(data);
    } catch (err) {
      console.error('Failed to load escort details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await apiService.getReviewsByTarget(escortId, 1, 5);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const favorites = await apiService.getFavorites();
      const existing = favorites.find((f: any) => f.targetId === escortId || f.escortId === escortId);
      if (existing) {
        setIsFavorite(true);
        setFavoriteId(existing.id);
      }
    } catch (err) {
      console.error('Failed to check favorite status:', err);
    }
  };

  const handleFavorite = async () => {
    try {
      if (isFavorite && favoriteId) {
        await apiService.removeFavorite(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const result = await apiService.addFavorite(escortId, 'escort');
        setIsFavorite(true);
        setFavoriteId(result.id);
      }
    } catch (err) {
      console.error('Failed to update favorite:', err);
    }
  };

  const handleOrder = () => {
    if (selectedService && escort) {
      const escortForOrder = {
        id: escort.id,
        name: escort.user.name,
        avatar: escort.user.avatarUrl,
        rating: escort.rating,
        hourly_rate: escort.hourlyRate,
        is_verified: escort.isVerified
      };
      onOrder(escortForOrder, selectedService.type, selectedService.price);
    }
  };

  const handleContact = () => {
    if (escort) {
      onChat(escort.userId);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getServiceTypeName = (type: string) => {
    return t.serviceTypes[type as keyof typeof t.serviceTypes] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!escort) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-slate-500">{t.error}</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-full">
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b border-slate-100">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-900" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-slate-900">{escort.user.name}</h1>
        </div>
        <button onClick={handleFavorite} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
        </button>
      </div>

      <div className="bg-white">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={escort.user.avatarUrl || `https://ui-avatars.com/api/?name=${escort.user.name}&background=random`}
                alt={escort.user.name}
                className="w-24 h-24 rounded-full object-cover cursor-pointer"
                onClick={() => setShowImageModal(true)}
              />
              {escort.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full p-1">
                  <BadgeCheck className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-slate-900">{escort.user.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  escort.isVerified 
                    ? 'bg-teal-100 text-teal-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {escort.isVerified ? t.verified : t.notVerified}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-slate-900">{escort.rating.toFixed(1)}</span>
                  <span className="text-slate-500 text-sm">({escort.reviewCount}{t.reviews})</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-slate-400" />
                  <span>{escort.completedOrders} {t.completedOrders}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>¥{escort.hourlyRate}{t.perHour}</span>
                </div>
              </div>
            </div>
          </div>

          {escort.specialties && escort.specialties.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold text-slate-700 mb-2">{t.specialties}</h3>
              <div className="flex flex-wrap gap-2">
                {escort.specialties.map((specialty, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {escort.bio && (
            <div className="mt-4">
              <h3 className="text-sm font-bold text-slate-700 mb-2">{t.bio}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{escort.bio}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 bg-white">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{t.services}</h3>
            <button 
              onClick={() => setShowServiceList(!showServiceList)}
              className="flex items-center gap-1 text-teal-600 text-sm font-medium"
            >
              {showServiceList ? '收起' : '展开'}
              <ChevronDown className={`h-4 w-4 transition-transform ${showServiceList ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {showServiceList && escort.services && escort.services.length > 0 ? (
            <div className="mt-3 space-y-2">
              {escort.services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedService?.id === service.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{getServiceTypeName(service.type)}</h4>
                      <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-600">¥{service.price}</div>
                      <div className="text-xs text-slate-400">{t.price}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {[
                { type: 'FULL_PROCESS', name: '全程陪诊', description: '从挂号到取药的全程陪伴服务', price: 300 },
                { type: 'APPOINTMENT', name: '代约挂号', description: '帮助预约专家号', price: 100 },
                { type: 'REPORT_PICKUP', name: '代取报告', description: '代取检查报告并解读', price: 80 },
                { type: 'MEDICINE_PICKUP', name: '代办买药', description: '代购药品并送药上门', price: 120 }
              ].map((service) => (
                <div
                  key={service.type}
                  onClick={() => setSelectedService(service)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedService?.type === service.type
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{service.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-600">¥{service.price}</div>
                      <div className="text-xs text-slate-400">{t.price}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showServiceList && selectedService && (
            <div className="mt-3 p-4 bg-teal-50 rounded-xl border-2 border-teal-500">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{getServiceTypeName(selectedService.type)}</h4>
                  <p className="text-sm text-slate-500 mt-1">{selectedService.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-teal-600">¥{selectedService.price}</div>
                  <div className="text-xs text-slate-400">{t.price}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 bg-white">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">{t.recentReviews}</h3>
            {reviews.length > 0 && (
              <button 
                onClick={() => setShowAllReviews(true)}
                className="text-teal-600 text-sm font-medium"
              >
                {t.viewAllReviews}
              </button>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p>{t.noReviews}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <img
                      src={review.author.avatarUrl || `https://ui-avatars.com/api/?name=${review.author.name}&background=random`}
                      alt={review.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-sm">{review.author.name}</span>
                        <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= review.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4">
        <div className="flex gap-3">
          <button
            onClick={handleContact}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            {t.contact}
          </button>
          <button
            onClick={handleOrder}
            disabled={!selectedService}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
              selectedService
                ? 'bg-teal-500 text-white hover:bg-teal-600'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {selectedService ? (
              <>
                <span>{t.orderNow}</span>
                <span className="ml-1">¥{selectedService.price}</span>
              </>
            ) : (
              t.selectService
            )}
          </button>
        </div>
      </div>

      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setShowImageModal(false)}
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <img
            src={escort.user.avatarUrl || `https://ui-avatars.com/api/?name=${escort.user.name}&background=random`}
            alt={escort.user.name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {showAllReviews && (
        <div className="fixed inset-0 bg-white z-40 overflow-y-auto">
          <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b border-slate-100">
            <button onClick={() => setShowAllReviews(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-900" />
            </button>
            <h1 className="font-bold text-lg text-slate-900">{t.recentReviews}</h1>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <img
                      src={review.author.avatarUrl || `https://ui-avatars.com/api/?name=${review.author.name}&background=random`}
                      alt={review.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-sm">{review.author.name}</span>
                        <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= review.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscortDetail;
