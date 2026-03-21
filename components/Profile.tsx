import React, { useState, useEffect, useRef } from 'react';
import { Language, UserRole, UserInfo } from '../types';
import { apiService } from '../services/apiService';
import { ArrowLeft, Calendar, MoreHorizontal, Mail, Loader2, Edit2, Star, Heart, Image as ImageIcon, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { EditProfile } from './EditProfile';

interface ProfileProps {
  lang: Language;
  role: UserRole;
  user?: UserInfo | null;
  onBack?: () => void;
  onLogout?: () => void;
}

// Mock 数据用于降级显示
const MOCK_USER_PROFILE = {
  id: 'mock-user-id',
  email: 'user@example.com',
  profile: {
    name: '测试用户',
    phone: '138****8888',
    bio: '这是一个测试账户',
    avatar_url: 'https://ui-avatars.com/api/?name=Test+User&background=random',
    gender: '男',
    age: 30
  },
  created_at: new Date().toISOString()
};

const MOCK_ESCORT_PROFILE = {
  rating: 4.8,
  completed_orders: 128,
  hourly_rate: 80,
  specialties: ['内科', '外科', '儿科'],
  is_verified: true
};

const MOCK_ORDERS = [
  {
    id: 'order-001',
    order_no: 'ORD20240320001',
    service_type: 'FULL_PROCESS',
    status: 'COMPLETED',
    appointment_date: '2024-03-15',
    appointment_time: '09:00',
    escort: { name: '王医生', avatar_url: 'https://ui-avatars.com/api/?name=王医生&background=random' }
  },
  {
    id: 'order-002',
    order_no: 'ORD20240318002',
    service_type: 'APPOINTMENT',
    status: 'PAID',
    appointment_date: '2024-03-25',
    appointment_time: '14:00',
    escort: { name: '李护士', avatar_url: 'https://ui-avatars.com/api/?name=李护士&background=random' }
  }
];

const MOCK_REVIEWS = [
  {
    id: 'review-001',
    rating: 5,
    comment: '服务非常好，陪诊师很专业！',
    created_at: '2024-03-16T10:00:00Z',
    target: { name: '王医生', avatar_url: 'https://ui-avatars.com/api/?name=王医生&background=random' }
  }
];

const MOCK_FAVORITES = [
  {
    id: 'fav-001',
    escort_id: 'escort-001',
    name: '张医生',
    avatar_url: 'https://ui-avatars.com/api/?name=张医生&background=random',
    rating: 4.9,
    completed_orders: 256,
    is_verified: true,
    bio: '10年临床经验，专业陪诊服务'
  }
];

export const Profile: React.FC<ProfileProps> = ({ lang, role, user: _user, onBack, onLogout: _onLogout }) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [escortProfile, setEscortProfile] = useState<any>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  const isGuest = role === UserRole.GUEST;
  const isEscort = role === UserRole.ESCORT;
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isGuest) {
      loadProfile();
    } else {
      setLoading(false);
    }

    // 清理超时定时器
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [role]);

  useEffect(() => {
    if (!isGuest && activeTab && !useMockData) {
      loadTabContent(activeTab);
    } else if (!isGuest && activeTab && useMockData) {
      // 使用 Mock 数据
      setOrders(MOCK_ORDERS);
      setReviews(MOCK_REVIEWS);
      setFavorites(MOCK_FAVORITES);
    }
  }, [activeTab, isGuest, useMockData]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setUseMockData(false);

      // 设置 5 秒超时
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('Profile loading timeout, switching to mock data');
        setUseMockData(true);
        setUserProfile(MOCK_USER_PROFILE);
        if (isEscort) {
          setEscortProfile(MOCK_ESCORT_PROFILE);
        }
        setOrders(MOCK_ORDERS);
        setReviews(MOCK_REVIEWS);
        setFavorites(MOCK_FAVORITES);
        setLoading(false);
        setError('数据加载超时，已显示演示数据');
      }, 5000);

      const profile = await apiService.getUserProfile();
      
      // 清除超时定时器
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      if (profile) {
        setUserProfile(profile);
      } else {
        // API 返回空数据，使用 Mock 数据
        setUseMockData(true);
        setUserProfile(MOCK_USER_PROFILE);
      }

      if (isEscort) {
        try {
          const escort = await apiService.getEscortProfile();
          setEscortProfile(escort || MOCK_ESCORT_PROFILE);
        } catch {
          setEscortProfile(MOCK_ESCORT_PROFILE);
        }
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      // 出错时使用 Mock 数据
      setUseMockData(true);
      setUserProfile(MOCK_USER_PROFILE);
      if (isEscort) {
        setEscortProfile(MOCK_ESCORT_PROFILE);
      }
      setOrders(MOCK_ORDERS);
      setReviews(MOCK_REVIEWS);
      setFavorites(MOCK_FAVORITES);
      setError('无法连接到服务器，已显示演示数据');
    } finally {
      setLoading(false);
    }
  };

  const loadTabContent = async (tab: string) => {
    try {
      setTabLoading(true);

      if (tab === 'posts') {
        const ordersData = await apiService.getUserAppointments();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else if (tab === 'replies') {
        const reviewsData = await apiService.getMyReviews();
        setReviews(reviewsData?.reviews || (Array.isArray(reviewsData) ? reviewsData : []));
      } else if (tab === 'likes') {
        const favoritesData = await apiService.getFavorites ? await apiService.getFavorites() : [];
        setFavorites(Array.isArray(favoritesData) ? favoritesData : []);
      }
    } catch (err: any) {
      console.error('Failed to load tab content:', err);
      if (activeTab === 'posts') setOrders([]);
      if (activeTab === 'replies') setReviews([]);
      if (activeTab === 'likes') setFavorites([]);
    } finally {
      setTabLoading(false);
    }
  };

  const handleImageUpload = async (imageUrl: string) => {
    try {
      await apiService.updateUserProfile({ avatar_url: imageUrl });
      setUserProfile((prev: any) => ({
        ...prev,
        profile: { ...prev?.profile, avatar_url: imageUrl }
      }));
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  };

  const handleProfileUpdate = (data: any) => {
    setUserProfile((prev: any) => ({
      ...prev,
      ...data
    }));
  };

  const t = {
    zh: {
      posts: '服务记录',
      replies: '评价',
      media: '媒体',
      likes: '收藏',
      edit: '编辑资料',
      follow: '关注',
      joined: '加入时间',
      location: '位置',
      guestName: '游客',
      guestBio: '登录后查看您的就医档案和订单记录。',
      following: '关注',
      followers: '粉丝',
      historyItem: '暂无服务记录',
      reviewItem: '暂无评价',
      loading: '加载中...',
      completedOrders: '完成订单',
      rating: '评分',
      hourlyRate: '时薪',
      specialties: '专长',
      editProfile: '编辑资料',
      save: '保存',
      cancel: '取消',
      name: '姓名',
      phone: '电话',
      bio: '简介',
      orderNo: '订单号',
      serviceType: '服务类型',
      time: '时间',
      status: '状态',
      ratingLabel: '评分',
      content: '评价内容',
      emptyOrders: '暂无服务记录',
      emptyReviews: '暂无评价',
      emptyFavorites: '暂无收藏',
      serviceTypes: {
        FULL_PROCESS: '全程陪诊',
        APPOINTMENT: '代约挂号',
        REPORT_PICKUP: '代取报告',
        VIP_TRANSPORT: '专车接送'
      },
      orderStatus: {
        PENDING: '待支付',
        PAID: '已支付',
        CONFIRMED: '已确认',
        IN_PROGRESS: '服务中',
        COMPLETED: '已完成',
        CANCELLED: '已取消'
      },
      favorites: '收藏的陪诊师'
    },
    en: {
      posts: 'History',
      replies: 'Reviews',
      media: 'Media',
      likes: 'Likes',
      edit: 'Edit Profile',
      follow: 'Follow',
      joined: 'Joined',
      location: 'Location',
      guestName: 'Guest User',
      guestBio: 'Log in to view your medical records.',
      following: 'Following',
      followers: 'Followers',
      historyItem: 'No service history yet',
      reviewItem: 'No reviews yet',
      loading: 'Loading...',
      completedOrders: 'Completed Orders',
      rating: 'Rating',
      hourlyRate: 'Hourly Rate',
      specialties: 'Specialties',
      editProfile: 'Edit Profile',
      save: 'Save',
      cancel: 'Cancel',
      name: 'Name',
      phone: 'Phone',
      bio: 'Bio',
      orderNo: 'Order No',
      serviceType: 'Service Type',
      time: 'Time',
      status: 'Status',
      ratingLabel: 'Rating',
      content: 'Content',
      emptyOrders: 'No service history',
      emptyReviews: 'No reviews',
      emptyFavorites: 'No favorites',
      serviceTypes: {
        FULL_PROCESS: 'Full Service',
        APPOINTMENT: 'Appointment Booking',
        REPORT_PICKUP: 'Report Pickup',
        VIP_TRANSPORT: 'VIP Transport'
      },
      orderStatus: {
        PENDING: 'Pending',
        PAID: 'Paid',
        CONFIRMED: 'Confirmed',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled'
      },
      favorites: 'Favorite Escorts'
    }
  }[lang];

  const getProfileData = () => {
    if (isGuest) {
      return {
        name: t.guestName,
        handle: '@guest',
        bio: t.guestBio,
        following: 0,
        followers: 0,
        avatar: 'https://ui-avatars.com/api/?name=Guest&background=random',
        banner: 'https://picsum.photos/600/200?grayscale',
        joinedDate: '',
        location: ''
      };
    }

    if (userProfile) {
      return {
        name: userProfile.profile?.name || userProfile.email?.split('@')[0] || 'User',
        handle: '@' + (userProfile.profile?.name?.toLowerCase().replace(/\s+/g, '_') || 'user'),
        bio: userProfile.profile?.bio || '',
        following: 0,
        followers: 0,
        avatar: userProfile.profile?.avatar_url || `https://ui-avatars.com/api/?name=${userProfile.profile?.name || 'User'}&background=random`,
        banner: 'https://picsum.photos/600/200?grayscale',
        joinedDate: userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : '',
        location: userProfile.profile?.gender || '',
        phone: userProfile.profile?.phone || '',
        age: userProfile.profile?.age || null,
        gender: userProfile.profile?.gender || '',
        rating: escortProfile?.rating || 0,
        completedOrders: escortProfile?.completed_orders || 0,
        hourlyRate: escortProfile?.hourly_rate || 0,
        specialties: escortProfile?.specialties || [],
        isVerified: escortProfile?.is_verified || false
      };
    }

    return {
      name: isEscort ? 'Escort User' : 'Patient User',
      handle: '@user',
      bio: '',
      following: 0,
      followers: 0,
      avatar: 'https://ui-avatars.com/api/?name=User&background=random',
      banner: 'https://picsum.photos/600/200?grayscale',
      joinedDate: '',
      location: ''
    };
  };

  const profileData = getProfileData();

  const renderOrderItem = (order: any) => {
    const serviceType = t.serviceTypes[order.service_type] || order.service_type || '未知服务';
    const status = t.orderStatus[order.status] || order.status || '未知状态';
    const date = order.appointment_date ? new Date(order.appointment_date).toLocaleDateString() : '';
    const time = order.appointment_time || '';

    return (
      <div key={order.id} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3">
        <img src={order.escort?.avatar_url || profileData.avatar} className="w-10 h-10 rounded-full" alt="" />
        <div className="flex-1">
          <div className="flex items-center gap-1 text-slate-500 text-sm mb-1">
            <span className="font-bold text-slate-900">{order.escort?.name || '陪诊师'}</span>
            <span>·</span>
            <span className="text-xs">{order.id?.slice(-8) || order.order_no || ''}</span>
          </div>
          <div className="text-slate-900 font-medium">{serviceType}</div>
          <div className="text-slate-500 text-sm mt-1">
            {date && <span>{date}</span>}
            {time && <span> {time}</span>}
          </div>
          <div className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
            order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
            order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {status}
          </div>
        </div>
      </div>
    );
  };

  const renderReviewItem = (review: any) => {
    const date = review.created_at ? new Date(review.created_at).toLocaleDateString() : '';

    return (
      <div key={review.id} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors">
        <div className="flex items-start gap-3">
          <img src={review.target?.avatar_url || profileData.avatar} className="w-10 h-10 rounded-full" alt="" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">{review.target?.name || '用户'}</span>
              <span className="text-xs text-slate-500">{date}</span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= (review.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
                />
              ))}
              <span className="text-sm font-medium text-slate-700 ml-1">{review.rating || 0}.0</span>
            </div>
            <div className="text-slate-900 text-sm">{review.comment || review.content || '用户评价'}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderFavoriteItem = (favorite: any) => {
    return (
      <div key={favorite.id || favorite.escort_id} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3">
        <img src={favorite.escort?.avatar_url || favorite.avatar_url || profileData.avatar} className="w-12 h-12 rounded-full" alt="" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-900">{favorite.escort?.name || favorite.name || '陪诊师'}</span>
            {favorite.is_verified && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">已认证</span>}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{favorite.rating?.toFixed(1) || '0.0'}</span>
            </div>
            <span>|</span>
            <span>{favorite.completed_orders || 0} 单</span>
          </div>
          <div className="text-slate-600 text-sm mt-1 line-clamp-2">
            {favorite.bio || '专业陪诊服务'}
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    const getEmptyMessage = () => {
      if (activeTab === 'posts') return t.emptyOrders;
      if (activeTab === 'replies') return t.emptyReviews;
      if (activeTab === 'likes') return t.emptyFavorites;
      return '';
    };

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          {activeTab === 'posts' ? (
            <Calendar className="h-8 w-8 text-slate-400" />
          ) : activeTab === 'replies' ? (
            <MessageSquare className="h-8 w-8 text-slate-400" />
          ) : (
            <Heart className="h-8 w-8 text-slate-400" />
          )}
        </div>
        <p className="text-slate-500 text-center">{getEmptyMessage()}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500 mb-2" />
        <span className="text-slate-500">{t.loading}</span>
        <span className="text-xs text-slate-400 mt-2">{lang === 'zh' ? '加载时间较长？点击取消' : 'Taking too long? Click to cancel'}</span>
        <button 
          onClick={() => {
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }
            setUseMockData(true);
            setUserProfile(MOCK_USER_PROFILE);
            if (isEscort) {
              setEscortProfile(MOCK_ESCORT_PROFILE);
            }
            setOrders(MOCK_ORDERS);
            setReviews(MOCK_REVIEWS);
            setFavorites(MOCK_FAVORITES);
            setLoading(false);
            setError('已切换到演示数据模式');
          }}
          className="mt-3 px-4 py-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          {lang === 'zh' ? '使用演示数据' : 'Use Demo Data'}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-20" onTouchEnd={() => {}}>
      {/* 错误提示 */}
      {error && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">{error}</span>
          </div>
          <button
            onClick={loadProfile}
            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            <RefreshCw className="h-3 w-3" />
            {lang === 'zh' ? '重试' : 'Retry'}
          </button>
        </div>
      )}
      
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md px-4 py-1 flex items-center gap-6 cursor-pointer border-b border-slate-100" onClick={onBack}>
        <div className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-900" />
        </div>
        <div>
          <div className="font-bold text-xl text-slate-900 leading-tight">{profileData.name}</div>
          <div className="text-xs text-slate-500">{profileData.completedOrders || 0} {t.posts}</div>
        </div>
      </div>

      <div className="h-32 bg-slate-200 w-full overflow-hidden">
        <img src={profileData.banner} className="w-full h-full object-cover" alt="Banner" />
      </div>

      <div className="px-4 relative mb-4">
        <div className="absolute -top-16 left-4">
          <ImageUpload
            currentImage={profileData.avatar}
            onImageUpload={handleImageUpload}
            type="avatar"
          />
        </div>
        <div className="flex justify-end py-3 gap-2">
          <div className="w-9 h-9 border border-slate-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50">
            <MoreHorizontal className="h-5 w-5 text-slate-900" />
          </div>
          {isGuest ? (
            <button className="px-5 py-1.5 bg-black text-white rounded-full font-bold text-sm hover:bg-slate-800">
              Login
            </button>
          ) : (
            <>
              {!isEscort && <div className="w-9 h-9 border border-slate-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50"><Mail className="h-5 w-5 text-slate-900" /></div>}
              <button
                onClick={() => setShowEditProfile(true)}
                className="px-4 py-1.5 border border-slate-300 rounded-full font-bold text-sm hover:bg-slate-50 text-slate-900 flex items-center gap-1"
              >
                <Edit2 className="h-4 w-4" />
                {t.edit}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="font-black text-xl text-slate-900 leading-tight">{profileData.name}</div>
        <div className="text-slate-500 text-sm mb-3">{profileData.handle}</div>
        <div className="text-slate-900 mb-3 whitespace-pre-line">{profileData.bio || (isGuest ? t.guestBio : '')}</div>

        {isEscort && (
          <div className="flex flex-wrap gap-4 mb-3">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-bold text-slate-900">{profileData.rating?.toFixed(1) || '0.0'}</span>
              <span className="text-slate-500">{t.rating}</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-slate-900">{profileData.completedOrders || 0}</span>
              <span className="text-slate-500"> {t.completedOrders}</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-slate-900">¥{profileData.hourlyRate || 0}</span>
              <span className="text-slate-500">/h</span>
            </div>
          </div>
        )}

        {!isEscort && !isGuest && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-sm mb-3">
            {profileData.phone && (
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-900">{profileData.phone}</span>
              </div>
            )}
            {profileData.gender && (
              <div className="flex items-center gap-1">
                <span>{profileData.gender}</span>
              </div>
            )}
            {profileData.age && (
              <div className="flex items-center gap-1">
                <span>{profileData.age} {lang === 'zh' ? '岁' : 'years old'}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-sm mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {profileData.joinedDate ? `${t.joined}: ${profileData.joinedDate}` : t.joined}
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="hover:underline cursor-pointer"><span className="font-bold text-slate-900">{profileData.following}</span> <span className="text-slate-500">{t.following}</span></div>
          <div className="hover:underline cursor-pointer"><span className="font-bold text-slate-900">{profileData.followers}</span> <span className="text-slate-500">{t.followers}</span></div>
        </div>
      </div>

      <div className="flex border-b border-slate-100">
        {[t.posts, t.replies, t.media, t.likes].map((tab) => (
          <div
            key={tab}
            className="flex-1 hover:bg-slate-50 cursor-pointer flex justify-center py-3 relative transition-colors"
            onClick={() => setActiveTab(tab)}
          >
            <span className={`font-bold text-sm ${activeTab === tab ? 'text-slate-900' : 'text-slate-500'}`}>{tab}</span>
            {activeTab === tab && <div className="absolute bottom-0 w-14 h-1 bg-teal-500 rounded-full"></div>}
          </div>
        ))}
      </div>

      {tabLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          <span className="ml-2 text-slate-500">{t.loading}</span>
        </div>
      ) : isGuest ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500 text-center mb-4">{t.guestBio}</p>
          <button className="px-6 py-2 bg-teal-500 text-white rounded-full font-bold text-sm hover:bg-teal-600">
            登录
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'posts' && (
            orders.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {orders.map(renderOrderItem)}
              </div>
            ) : renderEmptyState()
          )}

          {activeTab === 'replies' && (
            reviews.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {reviews.map(renderReviewItem)}
              </div>
            ) : renderEmptyState()
          )}

          {activeTab === 'media' && (
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-slate-200 rounded-lg overflow-hidden">
                    <img src={`https://picsum.photos/200/200?random=${i + 100}`} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'likes' && (
            favorites.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {favorites.map(renderFavoriteItem)}
              </div>
            ) : renderEmptyState()
          )}
        </>
      )}

      <EditProfile
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleProfileUpdate}
        profile={profileData}
        lang={lang}
      />
    </div>
  );
};
