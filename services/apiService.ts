import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { UserRole, Hospital, Appointment, HospitalSearchParams, EscortProfile } from '../types';

// 定义API响应类型
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 定义用户凭证类型
interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

// 定义用户注册类型
interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
  phone?: string;
}

// 定义用户信息类型
interface UserInfo {
  id: string;
  email: string;
  role: UserRole;
  profile?: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
  };
}

// 定义认证响应类型
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private readonly TOKEN_KEY = 'medimate_access_token';
  private readonly REFRESH_TOKEN_KEY = 'medimate_refresh_token';
  private readonly USER_KEY = 'medimate_user';

  constructor() {
    // 创建axios实例 - default to local NestJS server
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 配置请求拦截器
    this.setupRequestInterceptor();

    // 配置响应拦截器
    this.setupResponseInterceptor();
  }

  // 请求拦截器
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      (config: AxiosRequestConfig): AxiosRequestConfig => {
        // 获取token并添加到请求头
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError): Promise<AxiosError> => {
        return Promise.reject(error);
      }
    );
  }

  // 响应拦截器
  private setupResponseInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>): AxiosResponse<ApiResponse> => {
        return response;
      },
      async (error: AxiosError<ApiResponse>): Promise<AxiosError> => {
        // 统一错误处理
        if (error.response) {
          // 服务器返回错误状态码
          console.error('API Error:', error.response.data);

          // 处理401未授权错误 - 尝试刷新token
          if (error.response.status === 401) {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // 重试请求
              return this.axiosInstance.request(error.config!);
            }
            this.logout();
          }
        } else if (error.request) {
          // 请求已发送但没有收到响应
          console.error('API Error: No response received', error.request);
        } else {
          // 请求配置错误
          console.error('API Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // 获取token
  private getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // 存储token
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // 存储refresh token
  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  // 存储用户信息
  private setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // 获取用户信息
  public getUser(): UserInfo | null {
    try {
      const userJson = localStorage.getItem(this.USER_KEY);
      if (!userJson) return null;
      const user = JSON.parse(userJson);
      // Validate that user has required fields
      if (user && user.role) {
        return user;
      }
      localStorage.removeItem(this.USER_KEY);
      return null;
    } catch {
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  // 检查是否已登录
  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // 刷新 token
  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    try {
      const response = await this.axiosInstance.post<ApiResponse<AuthResponse>>('/auth/refresh', {
        refreshToken,
      });

      if (response.data.success && response.data.data) {
        this.setToken(response.data.data.accessToken);
        this.setRefreshToken(response.data.data.refreshToken);
        this.setUser(response.data.data.user);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }

  // 登录
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken, user } = response.data.data;
      this.setToken(accessToken);
      this.setRefreshToken(refreshToken);
      this.setUser(user);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  }

  // 注册
  public async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<ApiResponse<AuthResponse>>('/auth/register', data);
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken, user } = response.data.data;
      this.setToken(accessToken);
      this.setRefreshToken(refreshToken);
      this.setUser(user);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Registration failed');
    }
  }

  // 登出
  public async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // 获取医院列表
  public async getHospitals(params?: HospitalSearchParams): Promise<Hospital[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<Hospital[]>>('/hospitals', { params });
      return response.data.success && response.data.data ? response.data.data : [];
    } catch (error) {
      console.error('Failed to get hospitals:', error);
      return [];
    }
  }

  // 获取陪诊师列表
  public async getEscorts(params?: { latitude?: number; longitude?: number; rating?: number }): Promise<EscortProfile[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<EscortProfile[]>>('/escorts', { params });
      return response.data.success && response.data.data ? response.data.data : [];
    } catch (error) {
      console.error('Failed to get escorts:', error);
      return [];
    }
  }

  // 获取推荐服务
  public async getRecommendedServices(params?: any): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<any[]>>('/services/recommended', { params });
      return response.data.success && response.data.data ? response.data.data : [];
    } catch (error) {
      console.error('Failed to get recommended services:', error);
      return [];
    }
  }

  // 获取附近陪诊师
  public async getNearbyEscorts(latitude: number, longitude: number, radius?: number): Promise<EscortProfile[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<EscortProfile[]>>('/escorts/nearby', {
        params: { latitude, longitude, radius },
      });
      return response.data.success && response.data.data ? response.data.data : [];
    } catch (error) {
      console.error('Failed to get nearby escorts:', error);
      return [];
    }
  }

  // 创建预约
  public async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    const response = await this.axiosInstance.post<ApiResponse<Appointment>>('/orders', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to create appointment');
    }
  }

  // 获取用户预约列表
  public async getUserAppointments(): Promise<Appointment[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<Appointment[]>>('/orders');
      return response.data.success && response.data.data ? response.data.data : [];
    } catch (error) {
      console.error('Failed to get user appointments:', error);
      return [];
    }
  }

  // ========== PAYMENTS ==========

  // Create Stripe payment intent
  public async createStripePaymentIntent(orderId: string, currency?: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const response = await this.axiosInstance.post<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>('/payments/stripe/create-intent', {
      orderId,
      currency: currency || 'cny',
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create payment intent');
  }

  // Confirm Stripe payment
  public async confirmStripePayment(paymentIntentId: string): Promise<{ success: boolean; orderId: string }> {
    const response = await this.axiosInstance.post<ApiResponse<{ success: boolean; orderId: string }>>('/payments/stripe/confirm', {
      paymentIntentId,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to confirm payment');
  }

  // Create WeChat payment order
  public async createWechatPayment(orderId: string): Promise<{ wechatOrderId: string; qrCodeUrl: string }> {
    const response = await this.axiosInstance.post<ApiResponse<{ wechatOrderId: string; qrCodeUrl: string }>>('/payments/wechat/create-order', {
      orderId,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create WeChat payment');
  }

  // Request refund
  public async requestRefund(paymentId: string, amount?: number): Promise<{ success: boolean; refundedAmount: number }> {
    const response = await this.axiosInstance.post<ApiResponse<{ success: boolean; refundedAmount: number }>>('/payments/refund', {
      paymentId,
      amount,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to process refund');
  }

  // Get payment by order ID
  public async getPaymentByOrderId(orderId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<any>>(`/payments/${orderId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get payment:', error);
      return null;
    }
  }

  // ========== ADMIN ==========

  // Get dashboard stats
  public async getAdminDashboard(): Promise<any> {
    const response = await this.axiosInstance.get<ApiResponse<any>>('/admin/dashboard');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get dashboard stats');
  }

  // Get revenue stats
  public async getAdminRevenue(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/admin/revenue?${params}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get revenue stats');
  }

  // Get users
  public async getAdminUsers(page = 1, limit = 20, search?: string, role?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/admin/users?${params}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get users');
  }

  // Update user role
  public async updateUserRole(userId: string, role: string): Promise<any> {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(`/admin/users/${userId}/role`, { role });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update user role');
  }

  // Disable user
  public async disableUser(userId: string): Promise<any> {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(`/admin/users/${userId}/disable`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to disable user');
  }

  // Enable user
  public async enableUser(userId: string): Promise<any> {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(`/admin/users/${userId}/enable`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to enable user');
  }

  // Get orders
  public async getAdminOrders(page = 1, limit = 20, status?: string, search?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/admin/orders?${params}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get orders');
  }

  // Update order status
  public async updateOrderStatus(orderId: string, status: string): Promise<any> {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(`/admin/orders/${orderId}/status`, { status });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update order status');
  }

  // Assign escort to order
  public async assignEscort(orderId: string, escortId: string): Promise<any> {
    const response = await this.axiosInstance.post<ApiResponse<any>>(`/admin/orders/${orderId}/assign`, { escortId });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to assign escort');
  }

  // Get escorts
  public async getAdminEscorts(page = 1, limit = 20, status?: string, search?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/admin/escorts?${params}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get escorts');
  }

  // Verify escort
  public async verifyEscort(escortId: string, approved: boolean, reason?: string): Promise<any> {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(`/admin/escorts/${escortId}/verify`, { approved, reason });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to verify escort');
  }

  // ========== REVIEWS ==========

  // Create a review
  public async createReview(orderId: string, targetId: string, rating: number, comment?: string): Promise<any> {
    const response = await this.axiosInstance.post<ApiResponse<any>>('/reviews', {
      orderId,
      targetId,
      rating,
      comment,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create review');
  }

  // Get reviews by order
  public async getReviewsByOrder(orderId: string): Promise<any[]> {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(`/reviews/order/${orderId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  }

  // Get reviews for an escort
  public async getReviewsByTarget(targetId: string, page = 1, limit = 20): Promise<any> {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/reviews/target/${targetId}?page=${page}&limit=${limit}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get reviews');
  }

  // Check if can review
  public async checkCanReview(orderId: string): Promise<{ canReview: boolean; targetId?: string; reason?: string }> {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/reviews/can-review/${orderId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return { canReview: false, reason: 'Failed to check' };
  }

  // ========== NOTIFICATIONS ==========

  // Get notifications
  public async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<any> {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get notifications');
  }

  // Mark notification as read
  public async markNotificationAsRead(notificationId: string): Promise<any> {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(`/notifications/${notificationId}/read`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to mark as read');
  }

  // Mark all notifications as read
  public async markAllNotificationsAsRead(): Promise<any> {
    const response = await this.axiosInstance.patch<ApiResponse<any>>('/notifications/read-all');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to mark all as read');
  }

  // Delete notification
  public async deleteNotification(notificationId: string): Promise<any> {
    const response = await this.axiosInstance.delete<ApiResponse<any>>(`/notifications/${notificationId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to delete notification');
  }
}

// 创建并导出单例实例
export const apiService = new ApiService();
