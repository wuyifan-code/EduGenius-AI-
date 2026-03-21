import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  X,
  Loader2,
  Heart,
  ArrowRight,
  CheckCircle,
  Tag,
  DollarSign,
  SlidersHorizontal,
  SortAsc
} from 'lucide-react';
import { apiService } from '../services/apiService';

export type Language = 'zh' | 'en';
export type ServiceType = 'ALL' | 'FULL_PROCESS' | 'APPOINTMENT' | 'REPORT_PICKUP' | 'MEDICINE_PICKUP' | 'VIP_TRANSPORT';
export type SortBy = 'rating' | 'price' | 'distance';

interface EscortService {
  id: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  pricePerHour: number;
  startDate: string;
  endDate: string;
  availableWeekdays: number[];
  timeSlots: { start: string; end: string }[];
  areas: string[];
  tags: string[];
  maxDailyOrders: number;
  isActive: boolean;
  escort: {
    id: string;
    userId: string;
    rating: number;
    reviewCount: number;
    completedOrders: number;
    isVerified: boolean;
    specialties: string[];
    bio: string;
    user: {
      id: string;
      name: string;
      avatarUrl: string;
    };
  };
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface AvailabilityResponse {
  date: string;
  timeSlots: TimeSlot[];
  isAvailable: boolean;
}

interface AvailableEscortsProps {
  lang: Language;
  onBook: (service: EscortService, slot: TimeSlot & { date: string }) => void;
}

const SERVICE_TYPES: { value: ServiceType; label: { zh: string; en: string } }[] = [
  { value: 'ALL', label: { zh: '全部服务', en: 'All Services' } },
  { value: 'FULL_PROCESS', label: { zh: '全程陪诊', en: 'Full Service' } },
  { value: 'APPOINTMENT', label: { zh: '代约挂号', en: 'Appointment' } },
  { value: 'REPORT_PICKUP', label: { zh: '代取报告', en: 'Report Pickup' } },
  { value: 'MEDICINE_PICKUP', label: { zh: '代办买药', en: 'Medicine Pickup' } },
  { value: 'VIP_TRANSPORT', label: { zh: '专车接送', en: 'VIP Transport' } },
];

const WEEKDAYS = [
  { value: 0, label: { zh: '周日', en: 'Sun' } },
  { value: 1, label: { zh: '周一', en: 'Mon' } },
  { value: 2, label: { zh: '周二', en: 'Tue' } },
  { value: 3, label: { zh: '周三', en: 'Wed' } },
  { value: 4, label: { zh: '周四', en: 'Thu' } },
  { value: 5, label: { zh: '周五', en: 'Fri' } },
  { value: 6, label: { zh: '周六', en: 'Sat' } },
];

export const AvailableEscorts: React.FC<AvailableEscortsProps> = ({
  lang,
  onBook,
}) => {
  // State
  const [services, setServices] = useState<EscortService[]>([]);
  const [filteredServices, setFilteredServices] = useState<EscortService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>('ALL');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [areaSearch, setAreaSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortBy>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Booking modal
  const [selectedService, setSelectedService] = useState<EscortService | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const t = {
    zh: {
      title: '可预约服务',
      subtitle: '选择适合您的陪诊服务',
      searchPlaceholder: '搜索区域或服务...',
      filter: '筛选',
      sort: '排序',
      serviceType: '服务类型',
      priceRange: '价格范围',
      minPrice: '最低价',
      maxPrice: '最高价',
      area: '服务区域',
      areaPlaceholder: '输入区域名称',
      resetFilters: '重置筛选',
      applyFilters: '应用筛选',
      sortByRating: '按评分排序',
      sortByPrice: '按价格排序',
      sortByDistance: '按距离排序',
      rating: '评分',
      reviews: '条评价',
      completedOrders: '已完成订单',
      perHour: '元/小时',
      availableAreas: '服务区域',
      availableDates: '可预约日期',
      tags: '标签',
      verified: '已认证',
      notVerified: '未认证',
      bookNow: '立即预约',
      viewDetails: '查看详情',
      noServices: '暂无可用服务',
      loading: '加载中...',
      error: '加载失败，请重试',
      selectDate: '选择日期',
      selectTime: '选择时间段',
      availableSlots: '可预约时段',
      noSlots: '该日期暂无可预约时段',
      confirmBooking: '确认预约',
      cancel: '取消',
      close: '关闭',
      monday: '周一',
      tuesday: '周二',
      wednesday: '周三',
      thursday: '周四',
      friday: '周五',
      saturday: '周六',
      sunday: '周日',
      to: '至',
      currency: '¥',
    },
    en: {
      title: 'Available Services',
      subtitle: 'Choose the right escort service for you',
      searchPlaceholder: 'Search area or service...',
      filter: 'Filter',
      sort: 'Sort',
      serviceType: 'Service Type',
      priceRange: 'Price Range',
      minPrice: 'Min Price',
      maxPrice: 'Max Price',
      area: 'Service Area',
      areaPlaceholder: 'Enter area name',
      resetFilters: 'Reset Filters',
      applyFilters: 'Apply Filters',
      sortByRating: 'Sort by Rating',
      sortByPrice: 'Sort by Price',
      sortByDistance: 'Sort by Distance',
      rating: 'Rating',
      reviews: 'reviews',
      completedOrders: 'Completed Orders',
      perHour: '/hour',
      availableAreas: 'Service Areas',
      availableDates: 'Available Dates',
      tags: 'Tags',
      verified: 'Verified',
      notVerified: 'Not Verified',
      bookNow: 'Book Now',
      viewDetails: 'View Details',
      noServices: 'No services available',
      loading: 'Loading...',
      error: 'Failed to load, please try again',
      selectDate: 'Select Date',
      selectTime: 'Select Time Slot',
      availableSlots: 'Available Slots',
      noSlots: 'No available slots for this date',
      confirmBooking: 'Confirm Booking',
      cancel: 'Cancel',
      close: 'Close',
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
      to: 'to',
      currency: '$',
    },
  }[lang];

  const getServiceTypeLabel = (type: ServiceType) => {
    const found = SERVICE_TYPES.find(s => s.value === type);
    return found ? found.label[lang] : type;
  };

  const getWeekdayLabel = (day: number) => {
    return WEEKDAYS.find(w => w.value === day)?.label[lang] || '';
  };

  // Load services
  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getAllEscortServices({
        page: 1,
        limit: 50,
      });
      setServices(response.data || []);
      setFilteredServices(response.data || []);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    try {
      const favs = await apiService.getFavorites();
      const favIds = new Set(favs.map((f: any) => f.targetId || f.escortId));
      setFavorites(favIds);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }, []);

  useEffect(() => {
    loadServices();
    loadFavorites();
  }, [loadServices, loadFavorites]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...services];

    // Filter by service type
    if (selectedServiceType !== 'ALL') {
      result = result.filter(s => s.serviceType === selectedServiceType);
    }

    // Filter by price range
    if (minPrice !== '') {
      result = result.filter(s => s.pricePerHour >= minPrice);
    }
    if (maxPrice !== '') {
      result = result.filter(s => s.pricePerHour <= maxPrice);
    }

    // Filter by area
    if (areaSearch.trim()) {
      const searchLower = areaSearch.toLowerCase();
      result = result.filter(s =>
        s.areas.some(area => area.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rating':
          comparison = a.escort.rating - b.escort.rating;
          break;
        case 'price':
          comparison = a.pricePerHour - b.pricePerHour;
          break;
        case 'distance':
          // Distance sorting would require location data
          comparison = 0;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredServices(result);
  }, [services, selectedServiceType, minPrice, maxPrice, areaSearch, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setSelectedServiceType('ALL');
    setMinPrice('');
    setMaxPrice('');
    setAreaSearch('');
  };

  const handleToggleFavorite = async (serviceId: string, escortId: string) => {
    try {
      if (favorites.has(escortId)) {
        // Find and remove favorite
        const favs = await apiService.getFavorites();
        const fav = favs.find((f: any) => f.targetId === escortId || f.escortId === escortId);
        if (fav) {
          await apiService.removeFavorite(fav.id);
          setFavorites(prev => {
            const next = new Set(prev);
            next.delete(escortId);
            return next;
          });
        }
      } else {
        await apiService.addFavorite(escortId, 'escort');
        setFavorites(prev => new Set(prev).add(escortId));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleViewDetails = async (service: EscortService) => {
    setSelectedService(service);
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailability(null);
    setShowBookingModal(true);
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (selectedService && date) {
      setLoadingAvailability(true);
      try {
        const data = await apiService.getServiceAvailability(selectedService.id, date);
        setAvailability(data);
      } catch (err) {
        console.error('Failed to load availability:', err);
        setAvailability(null);
      } finally {
        setLoadingAvailability(false);
      }
    }
  };

  const handleBook = () => {
    if (selectedService && selectedSlot && selectedDate) {
      onBook(selectedService, { ...selectedSlot, date: selectedDate });
      setShowBookingModal(false);
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    if (selectedService) {
      return selectedService.endDate.split('T')[0];
    }
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    return threeMonthsLater.toISOString().split('T')[0];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
          <p className="text-slate-500 dark:text-slate-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-4 pb-4 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Filter and Sort Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showFilters
                  ? 'bg-teal-500 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
              }`}
            >
              <Filter className="h-4 w-4" />
              {t.filter}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <div className="flex-1 flex gap-2 overflow-x-auto">
              <button
                onClick={() => {
                  setSortBy('rating');
                  setSortOrder(sortBy === 'rating' && sortOrder === 'desc' ? 'asc' : 'desc');
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortBy === 'rating'
                    ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                }`}
              >
                <Star className="h-4 w-4" />
                {t.sortByRating}
                {sortBy === 'rating' && (
                  sortOrder === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                )}
              </button>

              <button
                onClick={() => {
                  setSortBy('price');
                  setSortOrder(sortBy === 'price' && sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortBy === 'price'
                    ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                {t.sortByPrice}
                {sortBy === 'price' && (
                  sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.serviceType}
                </label>
                <select
                  value={selectedServiceType}
                  onChange={(e) => setSelectedServiceType(e.target.value as ServiceType)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  {SERVICE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.priceRange}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={t.minPrice}
                    className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={t.maxPrice}
                    className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetFilters}
                className="w-full py-2 text-sm text-teal-600 dark:text-teal-400 font-medium hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
              >
                {t.resetFilters}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Service List */}
      <div className="p-4 space-y-4">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadServices}
              className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition-colors"
            >
              {t.loading}
            </button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <Search className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">{t.noServices}</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Escort Info Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                  <img
                    src={service.escort.user.avatarUrl || `https://ui-avatars.com/api/?name=${service.escort.user.name}&background=random`}
                    alt={service.escort.user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {service.escort.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full p-0.5">
                      <BadgeCheck className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                      {service.escort.user.name}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      service.escort.isVerified
                        ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {service.escort.isVerified ? t.verified : t.notVerified}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {service.escort.rating.toFixed(1)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        ({service.escort.reviewCount} {t.reviews})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>{service.escort.completedOrders} {t.completedOrders}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleFavorite(service.id, service.escort.userId)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      favorites.has(service.escort.userId)
                        ? 'fill-red-500 text-red-500'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                </button>
              </div>

              {/* Service Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{service.title || getServiceTypeLabel(service.serviceType)}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {t.currency}{service.pricePerHour}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.perHour}</div>
                  </div>
                </div>

                {/* Areas */}
                {service.areas && service.areas.length > 0 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {service.areas.slice(0, 3).map((area, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                      {service.areas.length > 3 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          +{service.areas.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Available Weekdays */}
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {service.availableWeekdays.map((day) => (
                      <span
                        key={day}
                        className="text-xs px-2 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full"
                      >
                        {getWeekdayLabel(day)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {service.tags && service.tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {service.tags.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {service.escort.specialties && service.escort.specialties.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {service.escort.specialties.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => handleViewDetails(service)}
                  className="flex-1 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t.viewDetails}
                </button>
                <button
                  onClick={() => handleViewDetails(service)}
                  className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                  {t.bookNow}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.bookNow}</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Service Summary */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedService.escort.user.avatarUrl || `https://ui-avatars.com/api/?name=${selectedService.escort.user.name}&background=random`}
                    alt={selectedService.escort.user.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{selectedService.escort.user.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedService.title || getServiceTypeLabel(selectedService.serviceType)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedService.escort.rating.toFixed(1)}</span>
                      <span className="text-lg font-bold text-teal-600 dark:text-teal-400 ml-2">{t.currency}{selectedService.pricePerHour}{t.perHour}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {t.selectDate}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {t.selectTime}
                  </label>
                  {loadingAvailability ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                    </div>
                  ) : availability && availability.timeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availability.timeSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => slot.available && setSelectedSlot(slot)}
                          disabled={!slot.available}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            selectedSlot?.start === slot.start
                              ? 'bg-teal-500 text-white'
                              : slot.available
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          {slot.start}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                      {t.noSlots}
                    </div>
                  )}
                </div>
              )}

              {/* Available Weekdays Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">{t.availableDates}:</span>{' '}
                  {selectedService.availableWeekdays.map(day => getWeekdayLabel(day)).join(', ')}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleBook}
                disabled={!selectedSlot}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  selectedSlot
                    ? 'bg-teal-500 text-white hover:bg-teal-600'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                {t.confirmBooking}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableEscorts;
